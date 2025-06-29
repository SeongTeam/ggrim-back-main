module.exports = {
	parser: "@typescript-eslint/parser",
	parserOptions: {
		project: "tsconfig.json",
		tsconfigRootDir: __dirname,
		sourceType: "module",
	},
	plugins: [
		"@typescript-eslint", // TypeScript용 플러그인
		"prettier", // Prettier와의 통합
	],
	extends: [
		"plugin:@typescript-eslint/recommended",
		"plugin:@typescript-eslint/recommended-requiring-type-checking", // 타입 검사 필요한 규칙 추가
		"plugin:prettier/recommended", // Prettier 통합 규칙
	],
	root: true,
	env: {
		node: true,
		jest: true,
		es6: true,
	},
	ignorePatterns: [".eslintrc.js"],
	rules: {
		"@typescript-eslint/interface-name-prefix": "off",
		"@typescript-eslint/no-explicit-any": "warn",
	},
};
