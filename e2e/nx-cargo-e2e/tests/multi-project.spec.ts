import * as nrwl from "@nrwl/nx-plugin/testing";

describe("generate cargo:lib && generate cargo:app", () => {
	afterAll(() => {
		nrwl.cleanup();
	});

	it("should generate two projects in the same workspace", async () => {
		let app = nrwl.uniq("app");
		let lib = nrwl.uniq("lib");

		nrwl.ensureNxProject("@noctifer20/nx-cargo", "dist/packages/nx-cargo");

		await nrwl.runNxCommandAsync(`generate @noctifer20/nx-cargo:lib ${lib}`);
		await nrwl.runNxCommandAsync(`generate @noctifer20/nx-cargo:app ${app}`);

		expect(() => {
			nrwl.checkFilesExist(`libs/${lib}/src/lib.rs`);
		}).not.toThrow();

		expect(() => {
			nrwl.checkFilesExist(`apps/${app}/src/main.rs`);
		}).not.toThrow();

		let cargoToml = nrwl.readFile("Cargo.toml").replace(/\s+/g, "");

		expect(cargoToml).toMatch(`[workspace]members=["apps/${app}","libs/${lib}"]`);
	}, 120000);
});
