import { config } from "dotenv";
import { resolve } from "path";
import { DataSource } from "typeorm";
import {
	ENV_DB_DATABASE_KEY,
	ENV_DB_HOST_KEY,
	ENV_DB_PASSWORD_KEY,
	ENV_DB_PORT_KEY,
	ENV_DB_USER_NAME_KEY,
} from "./src/modules/_common/const/envKeys.const";

const envName = ".env.migration";
config({ path: resolve(__dirname, envName) });
console.log(__dirname);

export const migrationConfig = new DataSource({
	type: "postgres",
	host: process.env[ENV_DB_HOST_KEY],
	port: +(process.env[ENV_DB_PORT_KEY] || ""),
	username: process.env[ENV_DB_USER_NAME_KEY],
	password: process.env[ENV_DB_PASSWORD_KEY],
	database: process.env[ENV_DB_DATABASE_KEY],
	synchronize: false, //!process.env[NODE_ENV] ? false : true,
	logging: true,
	logger: "file",
	maxQueryExecutionTime: 1000,
	entities: [__dirname + "/src/**/{entity,entities}/*.entity.{ts,js}"], //엔티티 클래스 경로
	migrationsRun: false, // 서버 구동 시 작성된 마이그레이션 파일을 기반으로 마이그레이션을 수행하게 할지 설정하는 옵션. false로 설정하여 직접 CLI로 마이그레이션 수행
	migrations: [__dirname + `/migration/action/*.ts`], // 마이그레이션을 수행할 파일이 관리되는 경로 설정
	migrationsTableName: "migrations", // 마이그레이션 이력이 기록되는 테이블 이름 설정
});
