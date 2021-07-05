import {
	checkFilesExist,
	ensureNxProject,
	readJson,
	runNxCommandAsync,
	uniq,
} from "@nrwl/nx-plugin/testing";

describe("generate cargo:lib", () => {
	it("should create a new Rust library", async () => {
		let lib = uniq("cargo-");
		ensureNxProject("@nxrs/cargo", "dist/packages/cargo");

		await runNxCommandAsync(`generate @nxrs/cargo:lib ${lib}`);

		expect(() => {
			checkFilesExist(`libs/${lib}/src/lib.rs`);
		}).not.toThrow();
	}, 120000);

	describe("--directory", () => {
		it("should create src in the specified directory", async () => {
			let lib = uniq("cargo-");
			ensureNxProject("@nxrs/cargo", "dist/packages/cargo");

			await runNxCommandAsync(`generate @nxrs/cargo:lib ${lib} --directory subdir`);

			expect(() => {
				checkFilesExist(`libs/subdir/${lib}/src/lib.rs`);
			}).not.toThrow();
		}, 120000);
	});

	describe("--tags", () => {
		it("should add tags to nx.json", async () => {
			let lib = uniq("cargo-");
			ensureNxProject("@nxrs/cargo", "dist/packages/cargo");

			await runNxCommandAsync(
				`generate @nxrs/cargo:lib ${lib} --tags e2etag,e2ePackage`
			);

			let nxJson = readJson("nx.json");

			expect(nxJson.projects[lib].tags).toEqual(["e2etag", "e2ePackage"]);
		}, 120000);
	});
});
