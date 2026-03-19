import { Module } from "@nestjs/common";
import { QuizModule } from "../quiz/quiz.module";
import { ScheduleController } from "./schedule.controller";

@Module({
	imports: [QuizModule],
	controllers: [ScheduleController],
})
export class SystemScheduleModule {}
