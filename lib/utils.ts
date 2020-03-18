import { Environment } from 'last-hit-replayer/dist';
import path from 'path';

export const getMatrixFolder = (env: Environment): string => {
	return path.join(env.getWorkspace(), '.matrix');
};

export const getMatrixDataFile = (
	env: Environment,
	story: string,
	flow: string,
	key: string
): string => {
	return path.join(getMatrixFolder(env), story, `matrix:${flow}?${key}.json`);
};

const matrixRegexp = /^matrix:(.+)\?(.+)$/;
export const getOriginalFlow = (flowName: string): { flow: string, matrixKey?: string, matrixed: boolean } => {
	const matches = flowName.match(matrixRegexp);
	if (matches == null) {
		return { flow: flowName, matrixed: false };
	} else {
		return { flow: matches[1], matrixKey: matches[2], matrixed: true };
	}
};
