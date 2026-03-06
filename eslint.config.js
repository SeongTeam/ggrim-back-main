const { defineConfig, globalIgnores } = require("eslint/config");

const tsParser = require("@typescript-eslint/parser");
const globals = require("globals");
const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const js = require("@eslint/js");

const { FlatCompat } = require("@eslint/eslintrc");

const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all,
});

module.exports = defineConfig([
	{
		languageOptions: {
			parser: tsParser,
			sourceType: "module",

			parserOptions: {
				project: "tsconfig.json",
				tsconfigRootDir: __dirname,
			},

			globals: {
				...globals.node,
				...globals.jest,
			},
		},

		extends: compat.extends(
			"plugin:@typescript-eslint/recommended",
			"plugin:@typescript-eslint/recommended-requiring-type-checking",
			"plugin:prettier/recommended",
			"prettier",
		),

		plugins: {
			"@typescript-eslint": typescriptEslint,
		},

		rules: {
			"@typescript-eslint/interface-name-prefix": "off",
			"@typescript-eslint/no-explicit-any": "warn",
		},
	},
	globalIgnores(["**/eslint.config.js", "test/generated"]),
]);
