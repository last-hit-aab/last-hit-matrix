import fs from 'fs';
import jsonfile from 'jsonfile';
import { Environment, FlowFile } from 'last-hit-replayer/dist';
import path from 'path';
import { MatrixEnvironment } from './env-loader';
import { MatrixData } from './types';
import { getMatrixDataFile, getMatrixFolder } from './utils';
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
		return [{ story, flow }];
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

/**
 * build flows array of given workspace
 */
export const findFlows = (env: MatrixEnvironment): FlowFile[] => {
	if (env.isOnChildProcess()) {
		return [env.getFlowFileInChildProcess()];
	} else {
		const workspace = env.getWorkspace();
		return fs
			.readdirSync(workspace)
			.filter(dir => fs.statSync(path.join(workspace, dir)).isDirectory())
			.filter(dir => !['.scripts'].includes(dir))
			.map(storyName => {
				return fs
					.readdirSync(path.join(workspace, storyName))
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
	}
};
