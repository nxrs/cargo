import { WasmPackExecutorSchema } from "./schema";
import executor from "./executor";
import * as child_process from "child_process";
import MockedFn = jest.MockedFn;

const onClose = jest.fn().mockImplementation((cmd, cb) => {
	cb();
});
jest.mock("child_process", () => ({
	spawn: jest.fn(() => ({
		// .on('error'...
		on: jest.fn(() => ({
			// .on('close'...
			on: onClose,
		})),
	})),
}));

const options: WasmPackExecutorSchema = {};

describe("WasmPack Executor", () => {
	it("can run", async () => {
		let output = await executor(options, {
			targetName: "test",
			projectName: "test",
			workspace: {
				projects: {
					test: {
						root: "/test-root",
					},
				},
			},
		} as any);
		expect(output.success).toBe(true);
		expect(child_process.spawn as MockedFn<any>).toBeCalledWith(
			"wasm-pack",
			["test"],
			{ cwd: "/test-root", shell: true, stdio: "inherit" }
		);
	});
	it("should support numeric and boolean configuration", async () => {
		let ctx = {
			targetName: "test",
			projectName: "test",
			workspace: {
				projects: {
					test: {
						root: "/test-root",
					},
				},
			},
		};
		let output = await executor(
			{
				globalFlags: {
					verbose: 4,
					quiet: true,
				},
				globalOptions: {
					"log-level": "info",
				},
				flags: {
					dev: true,
				},
				options: {
					target: "bundler",
				},
				args: {
					path: "/path",
				},
				commandName: "test",
			},
			ctx as any
		);

		expect(output.success).toBe(true);
		expect(child_process.spawn as MockedFn<any>).toBeCalledWith(
			"wasm-pack",
			[
				"--verbose 4",
				"--quiet",
				"--log-level info",
				"test",
				"--dev",
				"--target bundler",
				"--path /path",
			],
			{ cwd: "/test-root", shell: true, stdio: "inherit" }
		);
	});
	it("should return errorCode on spawn error", async () => {
		let ctx = {
			targetName: "test",
			projectName: "test",
			workspace: {
				projects: {
					test: {
						root: "/test-root",
					},
				},
			},
		};

		onClose.mockImplementationOnce((cmd, cb) => {
			cb("errorCode");
		});

		let output = await executor({}, ctx as any);

		expect(output.success).toBe(false);
		expect(output.reason).toBe("wasm-pack failed with exit code errorCode");
	});
});
