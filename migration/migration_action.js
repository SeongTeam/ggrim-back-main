import { execSync } from "child_process";

const command = process.argv[2]; // 실행할 명령어를 첫 번째 인자로 받음
const migrationName = process.argv[3]; // 마이그레이션 이름 (필요한 경우)

const PATH = "./migration";
const OPTION_FILE = "migration.option.ts";

switch (command) {
	case "generate":
		if (!migrationName) {
			console.error("❌ 마이그레이션 이름을 입력해주세요.");
			process.exit(1);
		}
		console.log(`🚀 Generating migration: ${migrationName}`);
		execSync(
			`npm run typeorm migration:generate -- ./migration/action/${migrationName} -d ${PATH}/${OPTION_FILE}`,
			{ stdio: "inherit" },
		);
		break;

	case "create":
		if (!migrationName) {
			console.error("❌ 마이그레이션 이름을 입력해주세요.");
			process.exit(1);
		}
		console.log(`🚀 Creating migration: ${migrationName}`);
		execSync(`npm run typeorm migration:create -- ./migration/action/${migrationName}`, {
			stdio: "inherit",
		});
		break;

	case "run":
		console.log("🚀 Running migrations...");
		execSync(`npm run typeorm migration:run -- -d ${PATH}/${OPTION_FILE}`, {
			stdio: "inherit",
		});
		break;

	case "revert":
		console.log("🚀 Reverting migration...");
		execSync(`npm run typeorm migration:revert -- -d ${PATH}/${OPTION_FILE}`, {
			stdio: "inherit",
		});
		break;

	default:
		console.error(
			"❌ 올바른 명령어를 입력하세요: generate <name> | create <name> | run | revert",
		);
		process.exit(1);
}
