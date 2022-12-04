import * as nrwl from "@nrwl/nx-plugin/testing";

describe("generate cargo:lib", () => {
	afterAll(() => {
		nrwl.cleanup();
	});

	it("should create a new Rust library", async () => {
		let lib = nrwl.uniq("cargo");
		nrwl.ensureNxProject("@noctifer20/nx-cargo", "dist/packages/nx-cargo");

		await nrwl.runNxCommandAsync(`generate @noctifer20/nx-cargo:lib ${lib}`);

		expect(() => {
			nrwl.checkFilesExist(`libs/${lib}/src/lib.rs`);
		}).not.toThrow();
	}, 120000);

	describe("--directory", () => {
		it("should create src in the specified directory", async () => {
			let lib = nrwl.uniq("cargo");
			nrwl.ensureNxProject("@noctifer20/nx-cargo", "dist/packages/nx-cargo");

			await nrwl.runNxCommandAsync(
				`generate @noctifer20/nx-cargo:lib ${lib} --directory subdir`
			);

			expect(() => {
				nrwl.checkFilesExist(`libs/subdir/${lib}/src/lib.rs`);
			}).not.toThrow();
		}, 120000);
	});

	describe("--tags", () => {
		it("should add tags to nx.json", async () => {
			let lib = nrwl.uniq("cargo");
			nrwl.ensureNxProject("@noctifer20/nx-cargo", "dist/packages/nx-cargo");

			await nrwl.runNxCommandAsync(
				`generate @noctifer20/nx-cargo:lib ${lib} --tags e2etag,e2ePackage`
			);

			let projectCfg = nrwl.readJson(`libs/${lib}/project.json`);

			expect(projectCfg.tags).toEqual(["e2etag", "e2ePackage"]);
		}, 120000);
	});
});
