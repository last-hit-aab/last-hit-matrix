import fs from 'fs';
import jsonfile from 'jsonfile';
import { Environment, loadConfig } from 'last-hit-replayer/dist';
import { Flow } from 'last-hit-types';
import path from 'path';
import { getMatrixDataFile } from './utils';
import { MatrixData } from './types';

const matrixRegexp = /^matrix:(.+)\?(.+)$/;
class MatrixEnvironment extends Environment {
	constructor(env: Environment) {
		super(env.getOriginalOptions());
	}
	isFlowExists(storyName: string, flowName: string): boolean {
		const dependsStoryFolder = path.join(this.getWorkspace(), storyName);
		if (!this.isStoryExists(storyName)) {
			return false;
		}
		const matches = flowName.match(matrixRegexp);
		if (matches == null) {
			const dependsFlowFilename = path.join(dependsStoryFolder, `${flowName}.flow.json`);
			return fs.existsSync(dependsFlowFilename) && fs.statSync(dependsFlowFilename).isFile();
		} else {
			const realFlowName = matches[1];
			const dependsFlowFilename = path.join(dependsStoryFolder, `${realFlowName}.flow.json`);
			return fs.existsSync(dependsFlowFilename) && fs.statSync(dependsFlowFilename).isFile();
		}
	}
	readFlowFile(storyName: string, flowName: string): Flow {
		const dependsStoryFolder = path.join(this.getWorkspace(), storyName);

		const matches = flowName.match(matrixRegexp);
		if (matches == null) {
			const filename = path.join(dependsStoryFolder, `${flowName}.flow.json`);
			return jsonfile.readFileSync(filename);
		} else {
			const realFlowName = matches[1];
			const filename = path.join(dependsStoryFolder, `${realFlowName}.flow.json`);
			const flow: Flow = jsonfile.readFileSync(filename);

			const matrixKey = matches[2];
			const matrixFilename = getMatrixDataFile(this, storyName, realFlowName, matrixKey);
			const matrixData: MatrixData = jsonfile.readFileSync(matrixFilename, {
				encoding: 'UTF-8'
			});
			if (matrixData.depends) {
				Object.keys(matrixData.depends).forEach(depend => {
					const dependKey = matrixData.depends[depend];
					const ss = depend.split('@');
					const dependStoryName = (ss[0] || '').trim();
					const dependFlowName = (ss[1] || '').trim();
					if (!dependStoryName || !dependFlowName) {
						throw new Error(
							`Incorrect dependency[${depend}] on matrix definition of [${realFlowName}@${storyName}]`
						);
					}
					((flow.settings || {}).dataDepends || []).forEach(depends => {
						if (depends.story === dependStoryName && depends.flow === dependFlowName) {
							depends.flow = `matrix:${depends.flow}?${dependKey}`;
						}
					});
				});
			}
			if (matrixData.params) {
				Object.keys(matrixData.params).forEach(paramKey => {
					const param = (flow.params || []).find(param => param.name == paramKey);
					if (param == null) {
						if (flow.params == null) {
							flow.params = [];
						}
						flow.params.push({
							name: paramKey,
							type: 'in',
							value: matrixData.params[paramKey]
						});
					} else {
						param.value = matrixData.params[paramKey];
					}
				});
			}
			return flow;
		}
	}
}
const load = (): Promise<Environment> => {
	return new Promise(async (resolve, reject) => {
		try {
			const env = await loadConfig();
			resolve(new MatrixEnvironment(env));
		} catch (e) {
			reject(e);
		}
	});
};

export { load as loadConfig };
