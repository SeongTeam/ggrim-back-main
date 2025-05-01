export interface IPaginationResult<T> {
  data: T[];
  count: number;
  pagination: number;
  isMore?: boolean;
}
