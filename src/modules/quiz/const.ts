export const QUIZ_TIME_LIMIT = {
	EASY: 20,
	MIDDLE: 15,
	HARD: 10,
} as const;
export const CATEGORY_VALUES = ["tags", "completition_year", "artist", "styles"] as const;

export const QUIZ_TYPE = {
	ONE_CHOICE: "ONE_CHOICE",
	MULTIPLE_CHOICE: "MULTIPLE_CHOICE",
	TRUE_FALSE: "TRUE_FALSE",
} as const;

export const QUIZ_TYPE_CONFIG = {
	ONE_CHOICE: { COUNT: { ANSWER: 1, DISTRACTOR: 3 } },
	MULTIPLE_CHOICE: { COUNT: { TOTAL: 6, MIN_ANSWER: 2 } },
	TRUE_FALSE: { ANSWER: 1, FALSE: 1 },
} as const;
export const QUIZ_REACTION = {
	LIKE: "like",
	DISLIKE: "dislike",
} as const;

export type QuizReactionType = (typeof QUIZ_REACTION)[keyof typeof QUIZ_REACTION];
