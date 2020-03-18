import fs from 'fs';
import jsonfile from 'jsonfile';
import { Environment, FlowFile } from 'last-hit-replayer/dist';
import path from 'path';
import { MatrixEnvironment } from './env-loader';
import { MatrixData } from './types';
import { getMatrixDataFile, getMatrixFolder, getOriginalFlow } from './utils';
import 'colors';

const readMatrixJSON = (env: Environment, story: string, flow: string): MatrixData[] | null => {
	let matrixFile = path.join(getMatrixFolder(env), story, `${flow}.json`);
	if (fs.existsSync(matrixFile) && fs.statSync(matrixFile).isFile()) {
		return jsonfile.readFileSync(matrixFile, { encoding: 'UTF-8' });
	}
	return null;
};

const readMatrix = (flowFile: FlowFile, env: Environment): Array<FlowFile> => {
	const { story, flow } = flowFile;

	const matrixRows: Array<MatrixData> = readMatrixJSON(env, story, flow) || [];
	if (matrixRows.length == 0) {
		return [ { story, flow } ];
	} else {
		return matrixRows.map(row => {
			jsonfile.writeFileSync(getMatrixDataFile(env, story, flow, row.key), row, {
				encoding: 'UTF-8',
				spaces: '\t'
			});
			return { story, flow: `matrix:${flow}?${row.key}` };
		});
	}
};

const generateKeyByString = (storyName: string, flowName: string): string =>
	`[${flowName}@${storyName}]`;

const checkNecessary = (flows: Array<FlowFile>, env: MatrixEnvironment): Array<FlowFile> => {
	const flowMap: { [key in string]: FlowFile } = {};
	const necessaryFlows = flows.map(flowFile => {
		flowMap[generateKeyByString(flowFile.story, flowFile.flow)] = flowFile;
		return flowFile;
	}).reduce((necessary, flowFile) => {
		const {
			settings: { forceDepends, dataDepends = [] } = {
				forceDepends: undefined,
				dataDepends: undefined
			}
		} = env.readFlowFile(flowFile.story, flowFile.flow);
		if (forceDepends) {
			const { story, flow } = forceDepends;
			const key = generateKeyByString(story, flow);
			if (!flowMap[key]) {
				// not include, includes it
				const add = { story, flow };
				necessary.push(add);
				flowMap[key] = add;
			}
		}
		dataDepends.forEach(({ story, flow }) => {
			const key = generateKeyByString(story, flow);
			if (!flowMap[key]) {
				// not include, includes it
				const add = { story, flow };
				necessary.push(add);
				flowMap[key] = add;
			}
		});
		necessary.forEach(flowFile => {
			const matches = getOriginalFlow(flowFile.flow);
			if (matches.matrixed) {
				const matrixFilename = getMatrixDataFile(env, flowFile.story, matches.flow, matches.matrixKey!);
				if (!fs.existsSync(matrixFilename)) {
					// create matrix data
					readMatrix({ story: flowFile.story, flow: matches.flow }, env);
				}
			}
		});
		return necessary;
	}, [] as FlowFile[]);
	return [ ...necessaryFlows, ...flows ];
};
/**
 * build flows array of given workspace
 */
export const findFlows = (env: MatrixEnvironment): FlowFile[] => {
	if (env.isOnChildProcess()) {
		return [ env.getFlowFileInChildProcess() ];
	} else {
		const workspace = env.getWorkspace();
		const flows = fs
			.readdirSync(workspace)
			.filter(dir => fs.statSync(path.join(workspace, dir)).isDirectory())
			.filter(dir => ![ '.scripts', '.matrix' ].includes(dir))
			.map(storyName => {
				return fs.readdirSync(path.join(workspace, storyName))
					.filter(flowFilename =>
						fs.statSync(path.join(workspace, storyName, flowFilename)).isFile()
					)
					.filter(flowFilename => flowFilename.endsWith('.flow.json'))
					.map(flowFilename => flowFilename.replace(/^(.*)\.flow\.json$/, '$1'))
					.filter(
						flowName =>
							env.isIncluded(storyName, flowName) &&
							!env.isExcluded(storyName, flowName)
					)
					.map(flowName => ({ story: storyName, flow: flowName }))
					.reduce((matrix: Array<FlowFile>, flow: FlowFile) => {
						matrix.push(...readMatrix(flow, env));
						return matrix;
					}, [] as Array<FlowFile>);
			})
			.reduce((flows, array) => {
				flows.push(...array);
				return flows;
			}, [] as Array<FlowFile>);

		let necessaryFlows = checkNecessary(flows, env);
		while (true) {
			const nextRound = checkNecessary(necessaryFlows, env);
			if (nextRound.length === necessaryFlows.length) {
				break;
			}
			necessaryFlows = nextRound;
		}
		return necessaryFlows;
	}
};
