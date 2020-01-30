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
