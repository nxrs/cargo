import { ExecutorContext, Tree } from "@nrwl/devkit";
import { createTreeWithEmptyV1Workspace } from "@nrwl/devkit/testing";
import {
	CargoOptions,
	normalizeGeneratorOptions,
	parseCargoArgs,
	runCargo,
} from ".";
import * as chalk from "chalk";
import * as child_process from "child_process";

describe("common utils", () => {
	describe("parseCargoArgs", () => {
		describe("with targetName build", () => {
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
			it("should support toolchain argument", () => {
				let ctx = mockExecutorContext("test-app:build");
				let opts: CargoOptions = {
					toolchain: "toolchain",
				};
				let args = parseCargoArgs(opts, ctx);
				args.unshift("cargo");

				expect(args.join(" ")).toEqual("cargo +toolchain build --bin test-app");
			});
			it("should support --all-features argument", () => {
				let ctx = mockExecutorContext("test-app:build");
				let opts: CargoOptions = {
					features: "all",
				};
				let args = parseCargoArgs(opts, ctx);
				args.unshift("cargo");

				expect(args.join(" ")).toEqual("cargo build --bin test-app --all-features");
			});
			it("should support --features argument", () => {
				let ctx = mockExecutorContext("test-app:build");
				let opts: CargoOptions = {
					features: "feature1",
				};
				let args = parseCargoArgs(opts, ctx);
				args.unshift("cargo");

				expect(args.join(" ")).toEqual(
					"cargo build --bin test-app --features feature1"
				);
			});
		});
		describe("with targetName test", () => {
			it("should support test targetName", () => {
				let ctx = mockExecutorContext("test-app:test");
				let opts: CargoOptions = {};
				let args = parseCargoArgs(opts, ctx);
				args.unshift("cargo");

				expect(args.join(" ")).toEqual("cargo test -p test-app");
			});
		});
		describe("with targetName run", () => {
			it("should support run targetName", () => {
				let ctx = mockExecutorContext("test-app:run");
				let opts: CargoOptions = {};
				let args = parseCargoArgs(opts, ctx);
				args.unshift("cargo");

				expect(args.join(" ")).toEqual("cargo run -p test-app");
			});
		});
		describe("with invalid targetName", () => {
			it("should throw in case of invalid targetName", () => {
				let ctx = mockExecutorContext("test-app:invalid");
				let opts: CargoOptions = {};
				expect(() => parseCargoArgs(opts, ctx)).toThrow(
					`Target '${ctx.targetName}' is invalid or not yet implemented`
				);
			});
			it("should throw in case of null targetName", () => {
				let ctx = mockExecutorContext("test-app:");
				let opts: CargoOptions = {};
				expect(() => parseCargoArgs(opts, ctx)).toThrow(
					"Expected target name to be non-null"
				);
			});
		});
		describe("with invalid projectName", () => {
			it("should throw in case of invalid projectName", () => {
				let ctx = mockExecutorContext("test-app:build");

				ctx.projectName = undefined;
				let opts: CargoOptions = {};

				expect(() => parseCargoArgs(opts, ctx)).toThrow(
					`Expected project name to be non-null`
				);
			});
		});
		describe("with out-dir argument", () => {
			it("should support --out-dir argument", () => {
				let ctx = mockExecutorContext("test-app:build");
				let opts: CargoOptions = {
					outDir: "outDir",
				};
				let args = parseCargoArgs(opts, ctx);
				args.unshift("cargo");

				expect(args.join(" ")).toEqual(
					"cargo +nightly build --bin test-app -Z unstable-options --out-dir outDir"
				);
			});

			it("should conflict with other toolchain", () => {
				let warn = jest.spyOn(console, "log");

				let ctx = mockExecutorContext("test-app:build");
				let opts: CargoOptions = {
					outDir: "outDir",
					toolchain: "toolchain",
				};
				let args = parseCargoArgs(opts, ctx);
				args.unshift("cargo");

				expect(args.join(" ")).toEqual(
					"cargo +nightly build --bin test-app -Z unstable-options --out-dir outDir"
				);
				expect(warn).toBeCalledWith(
					chalk.bold.yellowBright.inverse(" WARNING ") +
						" 'outDir' option can only be used with 'nightly' toolchain, but toolchain 'toolchain' was already specified. Overriding 'toolchain' => 'nightly'."
				);
				warn.mockReset();
			});
		});
	});

	describe("normalizeGeneratorOptions", () => {
		let appTree: Tree;

		beforeAll(() => {
			appTree = createTreeWithEmptyV1Workspace();
		});

		it("should respect kebab-case project names", () => {
			let opts = normalizeGeneratorOptions("application", appTree, {
				name: "my-app",
			});
			expect(opts.projectName).toBe("my-app");
		});

		it("should respect snake_case project names", () => {
			let opts = normalizeGeneratorOptions("application", appTree, {
				name: "my_app",
			});
			expect(opts.projectName).toBe("my_app");
		});

		it("should respect PascalCase project names", () => {
			let opts = normalizeGeneratorOptions("application", appTree, {
				name: "MyApp",
			});
			expect(opts.projectName).toBe("MyApp");
		});

		it("should respect camelCase project names (you monster)", () => {
			let opts = normalizeGeneratorOptions("application", appTree, {
				name: "myApp",
			});
			expect(opts.projectName).toBe("myApp");
		});
	});

	describe("runCargo", () => {
		it("should invoke cargo", async () => {
			let onClose = jest.fn((_, cb) => {
					cb();
				}),
				onerror = jest.fn(() => ({
					on: onClose,
				})),
				spawn = jest.spyOn(child_process, "spawn").mockImplementation(
					() =>
						({
							//.on('error'...
							on: onerror,
						} as any)
				);

			let ctx = mockExecutorContext("test-app:build");
			await runCargo([], ctx);
			expect(spawn).toBeCalledWith("cargo", [], {
				cwd: ctx.root,
				shell: true,
				stdio: "inherit",
			});
			spawn.mockReset();
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
