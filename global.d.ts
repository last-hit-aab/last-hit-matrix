// declare module NodeJS {
// 	interface ProcessVersions {
// 		readonly electron: string;
// 	}
// }

// interface Window {
// 	$lhGetUuid: () => Promise<string>;
// 	$lhGod?: boolean;
// 	$lhUuid: string;
// 	$lhRecordEvent: (event: string) => void;
// 	WeixinJSBridge: {
// 		invoke: (
// 			event:
// 				| 'sendAppMessage'
// 				| 'shareTimeline'
// 				| 'preVerifyJSAPI'
// 				| 'chooseImage'
// 				| 'getLocalImgData',
// 			data: any,
// 			func: (arg: any) => void
// 		) => void;
// 		on: (event, func: (arg: any) => void) => void;
// 	};
// }

declare module 'last-hit-replayer/dist' {
	class Environment {
		constructor(options: any);
		getOriginalOptions(): any;
		getWorkspace(): string;
		isStoryExists(storyName: string): boolean;
		isOnParallel(): boolean;
		isIncluded(storyName: string, flowName: string): boolean;
		isExcluded(storyName: string, flowName: string): boolean;
		isOnChildProcess(): boolean;
	}
	class FlowFile {
		story: string;
		flow: string;
	}
	export const loadConfig: () => Promise<Environment>;
}
