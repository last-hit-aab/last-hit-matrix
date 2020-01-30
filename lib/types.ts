export interface MatrixData {
	key: string;
	params: { [key in string]: any };
	depends: { [key in string]: string };
}
