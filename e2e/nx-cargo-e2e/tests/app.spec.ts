import * as nrwl from "@nrwl/nx-plugin/testing";

describe("generate cargo:app", () => {
	afterAll(() => {
		nrwl.cleanup();
	});

	it("should create a new Rust application", async () => {
		let app = nrwl.uniq("cargo");
		nrwl.ensureNxProject("@noctifer20/nx-cargo", "dist/packages/nx-cargo");

		await nrwl.runNxCommandAsync(`generate @noctifer20/nx-cargo:app ${app}`, {
			silenceError: false,
		});

		expect(() => {
			nrwl.checkFilesExist(`apps/${app}/src/main.rs`);
		}).not.toThrow();
	}, 120000);

	describe("--directory", () => {
		it("should create src in the specified directory", async () => {
			let app = nrwl.uniq("cargo");
			nrwl.ensureNxProject("@noctifer20/nx-cargo", "dist/packages/nx-cargo");

			await nrwl.runNxCommandAsync(
				`generate @noctifer20/nx-cargo:app ${app} --directory subdir`
			);

			expect(() => {
				nrwl.checkFilesExist(`apps/subdir/${app}/src/main.rs`);
			}).not.toThrow();
		}, 120000);
	});

	describe("--tags", () => {
		it("should add tags to nx.json", async () => {
			let app = nrwl.uniq("cargo");
			nrwl.ensureNxProject("@noctifer20/nx-cargo", "dist/packages/nx-cargo");

			await nrwl.runNxCommandAsync(
				`generate @noctifer20/nx-cargo:app ${app} --tags e2etag,e2ePackage`
			);

			let projectCfg = nrwl.readJson(`apps/${app}/project.json`);

			expect(projectCfg.tags).toEqual(["e2etag", "e2ePackage"]);
		}, 120000);
	});
});
