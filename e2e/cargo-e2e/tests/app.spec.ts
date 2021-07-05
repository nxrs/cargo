import {
	checkFilesExist,
	ensureNxProject,
	readJson,
	runNxCommandAsync,
	uniq,
} from "@nrwl/nx-plugin/testing";

describe("generate cargo:app", () => {
	it("should create a new Rust application", async () => {
		let app = uniq("cargo-");
		ensureNxProject("@nxrs/cargo", "dist/packages/cargo");

		await runNxCommandAsync(`generate @nxrs/cargo:app ${app}`);

		expect(() => {
			checkFilesExist(`apps/${app}/src/main.rs`);
		}).not.toThrow();
	}, 120000);

	describe("--directory", () => {
		it("should create src in the specified directory", async () => {
			let app = uniq("cargo-");
			ensureNxProject("@nxrs/cargo", "dist/packages/cargo");

			await runNxCommandAsync(`generate @nxrs/cargo:app ${app} --directory subdir`);

			expect(() => {
				checkFilesExist(`apps/subdir/${app}/src/main.rs`);
			}).not.toThrow();
		}, 120000);
	});

	describe("--tags", () => {
		it("should add tags to nx.json", async () => {
			let app = uniq("cargo-");
			ensureNxProject("@nxrs/cargo", "dist/packages/cargo");

			await runNxCommandAsync(
				`generate @nxrs/cargo:app ${app} --tags e2etag,e2ePackage`
			);

			let nxJson = readJson("nx.json");

			expect(nxJson.projects[app].tags).toEqual(["e2etag", "e2ePackage"]);
		}, 120000);
	});
});
