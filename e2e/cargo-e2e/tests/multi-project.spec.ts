import * as nrwl from "@nx/plugin/testing";

describe("generate cargo:lib && generate cargo:app", () => {
	it("should generate two projects in the same workspace", async () => {
		let app = nrwl.uniq("app");
		let lib = nrwl.uniq("lib");

		nrwl.ensureNxProject("@nxrs/cargo", "dist/packages/cargo");

		await nrwl.runNxCommandAsync(`generate @nxrs/cargo:lib ${lib}`);
		await nrwl.runNxCommandAsync(`generate @nxrs/cargo:app ${app}`);

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
