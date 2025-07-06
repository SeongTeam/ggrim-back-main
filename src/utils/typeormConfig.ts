import { Injectable, Logger } from "@nestjs/common";
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from "@nestjs/typeorm";
import { existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import {
	ENV_DB_DATABASE_KEY,
	ENV_DB_HOST_KEY,
	ENV_DB_PASSWORD_KEY,
	ENV_DB_PORT_KEY,
	ENV_DB_USER_NAME_KEY,
} from "../modules/_common/const/envKeys";
import { TypeORMCustomLogger } from "./typeormCustomLogger";
@Injectable()
export class TypeORMConfig implements TypeOrmOptionsFactory {
	logPath: string = join("logs", "db", "ormlogs.log");
	createTypeOrmOptions(): TypeOrmModuleOptions {
		const host: string = process.env[ENV_DB_HOST_KEY] || "";
		const port: number = +(process.env[ENV_DB_PORT_KEY] || "");
		this.ensureLogDirectoryExistence();
		Logger.log(
			`[TypeORMConfig] DB config. host : ${host}, port : ${port}, logPath : ${this.logPath}`,
		);
		return {
			type: "postgres",
			url: "",
			host: process.env[ENV_DB_HOST_KEY],
			port: +(process.env[ENV_DB_PORT_KEY] || ""),
			username: process.env[ENV_DB_USER_NAME_KEY],
			password: process.env[ENV_DB_PASSWORD_KEY],
			database: process.env[ENV_DB_DATABASE_KEY],
			autoLoadEntities: true,
			synchronize: false, //!process.env[NODE_ENV] ? false : true,
			keepConnectionAlive: true,
			logging: ["error", "warn", "log", "query"],
			logger: new TypeORMCustomLogger(["error", "warn", "log", "query"]),
			maxQueryExecutionTime: 1000,
			entities: [__dirname + "src/**/{entity,entities}/*.entity.{ts,js}"], //엔티티 클래스 경로
			extra: {
				max: 100,
			},
		} as TypeOrmModuleOptions;
	}

	ensureLogDirectoryExistence() {
		const dir = dirname(this.logPath);
		if (!existsSync(dir)) {
			mkdirSync(dir, { recursive: true });
		}
	}
}
