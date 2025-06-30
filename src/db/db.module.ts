import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { TypeORMConfig } from "../utils/typeormConfig";
import { DatabaseService } from "./db.service";

@Module({
	imports: [
		TypeOrmModule.forRootAsync({
			useClass: TypeORMConfig,
			dataSourceFactory: async (options) => new DataSource(options!).initialize(),
		}),
	],
	providers: [DatabaseService],
	exports: [DatabaseService],
})
export class DataBaseModule {}
