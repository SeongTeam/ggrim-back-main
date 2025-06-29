import { Module } from "@nestjs/common";
import { LoggerModule } from "../Logger/logger.module";
import { QuizModule } from "../quiz/quiz.module";
import { ScheduleController } from "./schedule.controller";

@Module({
	imports: [QuizModule, LoggerModule],
	controllers: [ScheduleController],
})
export class SystemScheduleModule {}
