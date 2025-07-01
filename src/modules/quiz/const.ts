export const QUIZ_TIME_LIMIT = {
	EASY: 20,
	MIDDLE: 15,
	HARD: 10,
} as const;
export const CATEGORY_VALUES = ["tags", "completition_year", "artist", "styles"] as const;

export const TYPE_VALUES = ["ONE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE"];

export const QUIZ_TYPE_CONFIG = {
	ONE_CHOICE: { COUNT: { ANSWER: 1, DISTRACTOR: 3 } },
	MULTIPLE_CHOICE: { COUNT: { TOTAL: 6, MIN_ANSWER: 2 } },
	TRUE_FALSE: { ANSWER: 1, FALSE: 1 },
};
