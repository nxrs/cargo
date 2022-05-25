import { ExecutorContext } from "@nrwl/devkit";
import { CargoOptions, parseCargoArgs } from ".";

describe("common utils", () => {
	describe("parseCargoArgs", () => {
		it("should support --target argument", () => {
			let ctx = mockExecutorContext("test-app:build");
			let opts: CargoOptions = {
				target: "86_64-pc-windows-gnu",
			};
			let args = parseCargoArgs(opts, ctx);
			args.unshift("cargo");

			expect(args.join(" ")).toEqual(
				"cargo build --bin test-app --target 86_64-pc-windows-gnu"
			);
		});
	});
});

function mockExecutorContext(command: string): ExecutorContext {
	let [projectName, targetName] = command.split(":");

	return {
		cwd: "C:/test",
		root: "C:/test",
		isVerbose: false,
		workspace: {
			npmScope: "@test",
			projects: {
				"test-app": {
					root: "apps/test-app",
					projectType: "application",
				},
				"test-lib": {
					root: "libs/test-lib",
					projectType: "library",
				},
			},
			version: 2,
		},
		projectName,
		targetName,
	};
}
