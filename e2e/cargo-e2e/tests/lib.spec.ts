import {
	checkFilesExist,
	ensureNxProject,
	readJson,
	runNxCommandAsync,
	uniq,
} from "@nx/plugin/testing";
import { env } from "process";

describe("generate cargo:lib", () => {
	beforeEach(() => {
		env.NX_DAEMON = "false";
	});

	it("should create a new Rust library", async () => {
		let lib = uniq("cargo");
		ensureNxProject("@nxrs/cargo", "dist/packages/cargo");

		await runNxCommandAsync(`generate @nxrs/cargo:lib ${lib}`);

		expect(() => {
			checkFilesExist(`${lib}/src/lib.rs`);
		}).not.toThrow();
	}, 120000);

	describe("--directory", () => {
		it("should create src in the specified directory", async () => {
			let lib = uniq("cargo");
			ensureNxProject("@nxrs/cargo", "dist/packages/cargo");

			await runNxCommandAsync(
				`generate @nxrs/cargo:lib ${lib} --directory subdir`
			);

			expect(() => {
				checkFilesExist(`subdir/${lib}/src/lib.rs`);
			}).not.toThrow();
		}, 120000);
	});

	describe("--tags", () => {
		it("should add tags to nx.json", async () => {
			let lib = uniq("cargo");
			ensureNxProject("@nxrs/cargo", "dist/packages/cargo");

			await runNxCommandAsync(
				`generate @nxrs/cargo:lib ${lib} --tags e2etag,e2ePackage`
			);

			let projectCfg = readJson(`${lib}/project.json`);

			expect(projectCfg.tags).toEqual(["e2etag", "e2ePackage"]);
		}, 120000);
	});
});
