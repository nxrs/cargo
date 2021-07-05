import {
	checkFilesExist,
	ensureNxProject,
	readFile,
	runNxCommandAsync,
	uniq,
} from "@nrwl/nx-plugin/testing";

describe("generate cargo:lib && generate cargo:app", () => {
	it("should generate two projects in the same workspace", async () => {
		let app = uniq("app-");
		let lib = uniq("lib-");

		ensureNxProject("@nxrs/cargo", "dist/packages/cargo");

		await runNxCommandAsync(`generate @nxrs/cargo:lib ${lib}`);
		await runNxCommandAsync(`generate @nxrs/cargo:app ${app}`);

		expect(() => {
			checkFilesExist(`libs/${lib}/src/lib.rs`);
		}).not.toThrow();

		expect(() => {
			checkFilesExist(`apps/${app}/src/main.rs`);
		}).not.toThrow();

		let cargoToml = readFile("Cargo.toml").replace(/\s+/g, "");

		expect(cargoToml).toMatch(`[workspace]members=["apps/${app}","libs/${lib}"]`);
	}, 120000);
});
