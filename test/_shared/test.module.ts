import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { DataBaseModule } from "../../src/modules/db/db.module";
import { TypeORMConfig } from "../../src/utils/typeormConfig";
import { TestService } from "./test.service";

/* TestModule
## Purpose:
- Initialize the test environment for E2E and integration tests.
- Provide a test API for external modules.
- Create a DataSource connected to the test database tables.

## Configuration Details:
- The configuration is defined in the `setEnvVars.js` file.
- Adapts the module specifically for the test environment.
*/

@Module({
	imports: [
		TypeOrmModule.forRootAsync({
			useClass: TypeORMConfig,
			dataSourceFactory: async (options) => new DataSource(options!).initialize(),
		}),
		DataBaseModule,
	],
	providers: [TestService],
	exports: [TestService],
})
export class TestModule {}
