module.exports = {
	displayName: "cargo-e2e",
	preset: "../../jest.preset.js",
	globals: {},
	transform: {
		"^.+\\.[tj]s$": [
			"ts-jest",
			{
				tsconfig: "<rootDir>/tsconfig.spec.json",
			},
		],
	},
	moduleFileExtensions: ["ts", "js", "html"],
	coverageDirectory: "../../coverage/e2ecargo-e2e",
};
