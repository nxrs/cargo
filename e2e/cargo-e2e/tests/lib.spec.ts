import * as nrwl from "@nx/plugin/testing";
import { env } from "process";

describe("generate cargo:lib", () => {
	beforeEach(() => {
		env.NX_DAEMON = "false";
	});

	it("should create a new Rust library", async () => {
		let lib = nrwl.uniq("cargo");
		nrwl.ensureNxProject("@nxrs/cargo", "dist/packages/cargo");

		await nrwl.runNxCommandAsync(`generate @nxrs/cargo:lib ${lib}`);

		expect(() => {
			nrwl.checkFilesExist(`${lib}/src/lib.rs`);
		}).not.toThrow();
	}, 120000);

	describe("--directory", () => {
		it("should create src in the specified directory", async () => {
			let lib = nrwl.uniq("cargo");
			nrwl.ensureNxProject("@nxrs/cargo", "dist/packages/cargo");

			await nrwl.runNxCommandAsync(
				`generate @nxrs/cargo:lib ${lib} --directory subdir`
			);

			expect(() => {
				nrwl.checkFilesExist(`subdir/${lib}/src/lib.rs`);
			}).not.toThrow();
		}, 120000);
	});

	describe("--tags", () => {
		it("should add tags to nx.json", async () => {
			let lib = nrwl.uniq("cargo");
			nrwl.ensureNxProject("@nxrs/cargo", "dist/packages/cargo");

			await nrwl.runNxCommandAsync(
				`generate @nxrs/cargo:lib ${lib} --tags e2etag,e2ePackage`
			);

			let projectCfg = nrwl.readJson(`${lib}/project.json`);

			expect(projectCfg.tags).toEqual(["e2etag", "e2ePackage"]);
		}, 120000);
	});
});
