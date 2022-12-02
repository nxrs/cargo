import { WasmPackExecutorSchema } from "./schema";
import executor from "./executor";
import * as child_process from "child_process";
import MockedFn = jest.MockedFn;

jest.mock("child_process", () => ({
	spawn: jest.fn(() => ({
		// .on('error'...
		on: jest.fn(() => ({
			// .on('close'...
			on: (cmd, cb) => {
				cb();
			},
		})),
	})),
}));

const options: WasmPackExecutorSchema = {};

describe("WasmPack Executor", () => {
	it("can run", async () => {
		let output = await executor(options, {
			targetName: "test",
			cwd: "/test-dir",
		} as any);
		expect(output.success).toBe(true);
		expect(child_process.spawn as MockedFn<any>).toBeCalledWith(
			"wasm-pack",
			["test"],
			{ cwd: "/test-dir", shell: true, stdio: "inherit" }
		);
	});
});
