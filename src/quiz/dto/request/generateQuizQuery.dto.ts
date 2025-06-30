import { IsString } from "class-validator";
import { IsInArray } from "../../../utils/classValidator";
import { CATEGORY_VALUES } from "../../const";
import { QuizCategory } from "../../type";

export class GenerateQuizQueryDTO {
	@IsInArray(CATEGORY_VALUES)
	category!: QuizCategory;

	@IsString()
	keyword!: string;
}
