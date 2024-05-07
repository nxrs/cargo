import * as nrwl from "@nx/plugin/testing";
import { env } from "process";

describe("generate cargo:app", () => {
	beforeEach(() => {
		env.NX_DAEMON = "false";
	});

	it("should create a new Rust application", async () => {
		let app = nrwl.uniq("cargo");
		nrwl.ensureNxProject("@nxrs/cargo", "dist/packages/cargo");

		await nrwl.runNxCommandAsync(`generate @nxrs/cargo:app ${app}`);

		expect(() => {
			nrwl.checkFilesExist(`${app}/src/main.rs`);
		}).not.toThrow();
	}, 120000);

	describe("--directory", () => {
		it("should create src in the specified directory", async () => {
			let app = nrwl.uniq("cargo");
			nrwl.ensureNxProject("@nxrs/cargo", "dist/packages/cargo");

			await nrwl.runNxCommandAsync(
				`generate @nxrs/cargo:app ${app} --directory subdir`
			);

			expect(() => {
				nrwl.checkFilesExist(`subdir/${app}/src/main.rs`);
			}).not.toThrow();
		}, 120000);
	});

	describe("--tags", () => {
		it("should add tags to nx.json", async () => {
			let app = nrwl.uniq("cargo");
			nrwl.ensureNxProject("@nxrs/cargo", "dist/packages/cargo");

			await nrwl.runNxCommandAsync(
				`generate @nxrs/cargo:app ${app} --tags e2etag,e2ePackage`
			);

			let projectCfg = nrwl.readJson(`${app}/project.json`);

			expect(projectCfg.tags).toEqual(["e2etag", "e2ePackage"]);
		}, 120000);
	});
});
