import { Module } from "@nestjs/common";
import { DataBaseModule } from "../../src/modules/db/db.module";
import { TestService } from "./test.service";
import { UserModule } from "../../src/modules/user/user.module";
import { AuthModule } from "../../src/modules/auth/auth.module";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TypeORMConfig } from "../../src/utils/typeormConfig";
import { DataSource } from "typeorm";
import { ConfigModule } from "@nestjs/config";
import { NODE_ENV } from "../../src/modules/_common/const/envKeys";

/* TestModule
## Purpose:
- Initialize the test environment for E2E and integration tests.
- Provide a test API for external modules.
- Create a DataSource connected to the test database tables.

## Configuration Details:
- The configuration is defined in the `setEnvVars.js` file.
- Adapts the module specifically for the test environment.
*/

const ENV = process.env[NODE_ENV];
@Module({
	imports: [
		ConfigModule.forRoot({
			envFilePath: !ENV ? ".env" : `.env.${ENV}`,
			isGlobal: true,
		}),
		TypeOrmModule.forRootAsync({
			useClass: TypeORMConfig,
			dataSourceFactory: async (options) => new DataSource(options!).initialize(),
		}),
		DataBaseModule,
		UserModule,
		AuthModule,
	],
	providers: [TestService],
	exports: [TestService],
})
export class TestModule {}
