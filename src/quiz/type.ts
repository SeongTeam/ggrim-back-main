import { Painting } from "../painting/entities/painting.entity";

export type QuizCategory = keyof Pick<Painting, "tags" | "completition_year" | "artist" | "styles">;

export type QUIZ_TYPE = "ONE_CHOICE" | "MULTIPLE_CHOICE" | "TRUE_FALSE";
