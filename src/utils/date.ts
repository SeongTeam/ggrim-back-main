import * as moment from "moment";

export function getLatestMonday() {
	const today = moment();
	const isMonday = today.isoWeekday() === 1; // 월요일인지 확인 (1 = 월요일)

	const latestMonday = isMonday
		? today.format("YYMMDD") // 오늘이 월요일이라면 오늘 날짜 사용
		: today.startOf("isoWeek").format("YYMMDD"); // 오늘이 월요일이 아니면 이번 주 월요일

	return latestMonday;
}
