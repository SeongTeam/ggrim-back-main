export interface IPaginationResult<T> {
	data: T[];
	count: number;
	total: number;
	page: number;
	pageCount: number;
}

export interface UpdateInfo {
	targetId: string;
	isSuccess: boolean;
}
