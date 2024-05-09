import { ExecutorContext, Tree } from "@nx/devkit";
import { createTreeWithEmptyWorkspace } from "@nx/devkit/testing";

import ClippyCliOptions from "../executors/clippy/schema";
import {
	CargoOptions,
	normalizeGeneratorOptions,
	parseCargoArgs,
	Target,
} from "./index";

describe("common utils", () => {
	describe("parseCargoArgs", () => {
		it("should support --target argument", () => {
			let ctx = mockExecutorContext("test-app:build");
			let opts: CargoOptions = {
				target: "86_64-pc-windows-gnu",
			};
			let [args] = parseCargoArgs(Target.Build, opts, ctx);
			args.unshift("cargo");

			expect(args.join(" ")).toEqual(
				"cargo build --bin test-app --target 86_64-pc-windows-gnu"
			);
		});

		it("should support --package argument", () => {
			let ctx = mockExecutorContext("test-app:build");
			let opts: CargoOptions = {
				package: "foo",
			};

			let args = ["cargo", ...parseCargoArgs(Target.Build, opts, ctx)[0]];
			expect(args.join(" ")).toEqual("cargo build --bin foo");

			args = ["cargo", ...parseCargoArgs(Target.Test, opts, ctx)[0]];
			expect(args.join(" ")).toEqual("cargo test -p foo");

			args = ["cargo", ...parseCargoArgs(Target.Run, opts, ctx)[0]];
			expect(args.join(" ")).toEqual("cargo run -p foo");

			args = ["cargo", ...parseCargoArgs(Target.Clippy, opts, ctx)[0]];
			expect(args.join(" ")).toEqual(
				"cargo clippy -p foo -- -D warnings --no-deps"
			);
		});

		it("should ignore the Nx-config-specified target name", () => {
			let ctx = mockExecutorContext("test-app:flooptydoopty");
			let opts: CargoOptions = {};
			let args = ["cargo", ...parseCargoArgs(Target.Build, opts, ctx)[0]];

			expect(args.join(" ")).toEqual("cargo build --bin test-app");
		});

		it("should correctly handle `release` option", () => {
			let ctx = mockExecutorContext("test-app:build");

			let args = ["cargo", ...parseCargoArgs(Target.Build, { release: false }, ctx)[0]];
			expect(args.join(" ")).toEqual("cargo build --bin test-app");

			args = ["cargo", ...parseCargoArgs(Target.Build, { release: true }, ctx)[0]];
			expect(args.join(" ")).toEqual("cargo build --bin test-app --profile release");
		});

		it("should pass through unknown arguments to cargo", () => {
			let ctx = mockExecutorContext("test-app:build");

			let opts: CargoOptions & { [key: string]: string } = {
				profile: "dev-custom",
			};
			let args = ["cargo", ...parseCargoArgs(Target.Build, opts, ctx)[0]];

			expect(args.join(" ")).toEqual(
				"cargo build --bin test-app --profile dev-custom",
			);

			opts = { unknownArg: "lorem-ipsum" };
			args = ["cargo", ...parseCargoArgs(Target.Build, opts, ctx)[0]];

			expect(args.join(" ")).toEqual(
				"cargo build --bin test-app --unknown-arg lorem-ipsum",
			);
		});

		it("allows specifying a custom binary target", () => {
			let ctx = mockExecutorContext("test-app:build");

			let opts: CargoOptions = {
				bin: "custom-bin-name",
			};
			let args = ["cargo", ...parseCargoArgs(Target.Build, opts, ctx)[0]];

			expect(args.join(" ")).toEqual(
				"cargo build -p test-app --bin custom-bin-name",
			);
		});

		it("correctly handles pass-through arguments for clippy", () => {
			let ctx = mockExecutorContext("test-app:lint");
			let opts: ClippyCliOptions = {
				package: "test-app-pkg",
				target: "wasm32-unknown-unknown",
				fix: false,
				failOnWarnings: true,
				noDeps: true,
			};
			let args = ["cargo", ...parseCargoArgs(Target.Clippy, opts, ctx)[0]];

			expect(args.join(" ")).toEqual(
				"cargo clippy -p test-app-pkg --target wasm32-unknown-unknown "
					+ "-- -D warnings --no-deps",
			);
		});

		it("correctly handles the `env` option", () => {
			let ctx = mockExecutorContext("test-app:run");
			let opts: CargoOptions = {
				package: "foo",
				env: {
					RUST_BACKTRACE: "FULL",
				},
			};
			let [args, env] = parseCargoArgs(Target.Run, opts, ctx);

			expect(["cargo", ...args].join(" ")).toEqual("cargo run -p foo");
			expect(env).toEqual({ RUST_BACKTRACE: "FULL" });
		});
	});

	describe("normalizeGeneratorOptions", () => {
		let appTree: Tree;

		beforeAll(() => {
			appTree = createTreeWithEmptyWorkspace();
		});

		it("should respect kebab-case project names", () => {
			let opts = normalizeGeneratorOptions("application", appTree, { name: "my-app" });
			expect(opts.projectName).toBe("my-app");
		});

		it("should respect snake_case project names", () => {
			let opts = normalizeGeneratorOptions("application", appTree, { name: "my_app" });
			expect(opts.projectName).toBe("my_app");
		});

		it("should respect PascalCase project names", () => {
			let opts = normalizeGeneratorOptions("application", appTree, { name: "MyApp" });
			expect(opts.projectName).toBe("MyApp");
		});

		it("should respect camelCase project names (you monster)", () => {
			let opts = normalizeGeneratorOptions("application", appTree, { name: "myApp" });
			expect(opts.projectName).toBe("myApp");
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
