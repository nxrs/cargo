import * as nrwl from "@nx/plugin/testing";
import { env } from "process";

describe("generate cargo:lib && generate cargo:app", () => {
	beforeEach(() => {
		env.NX_DAEMON = "false";
	});

	it("should generate two projects in the same workspace", async () => {
		let app = nrwl.uniq("app");
		let lib = nrwl.uniq("lib");

		nrwl.ensureNxProject("@nxrs/cargo", "dist/packages/cargo");

		await nrwl.runNxCommandAsync(`generate @nxrs/cargo:lib ${lib}`);
		await nrwl.runNxCommandAsync(`generate @nxrs/cargo:app ${app}`);

		expect(() => {
			nrwl.checkFilesExist(`${lib}/src/lib.rs`);
		}).not.toThrow();

		expect(() => {
			nrwl.checkFilesExist(`${app}/src/main.rs`);
		}).not.toThrow();

		let cargoToml = nrwl.readFile("Cargo.toml").replace(/\s+/g, "");

		expect(cargoToml).toMatch(`[workspace]members=["./${app}","./${lib}"]`);
	}, 120000);
});
