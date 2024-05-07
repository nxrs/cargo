import {
	checkFilesExist,
	ensureNxProject,
	readFile,
	runNxCommandAsync,
	uniq,
} from "@nx/plugin/testing";
import { env } from "process";

describe("generate cargo:lib && generate cargo:app", () => {
	beforeEach(() => {
		env.NX_DAEMON = "false";
	});

	it("should generate two projects in the same workspace", async () => {
		let app = uniq("app");
		let lib = uniq("lib");

		ensureNxProject("@nxrs/cargo", "dist/packages/cargo");

		await runNxCommandAsync(`generate @nxrs/cargo:lib ${lib}`);
		await runNxCommandAsync(`generate @nxrs/cargo:app ${app}`);

		expect(() => {
			checkFilesExist(`${lib}/src/lib.rs`);
		}).not.toThrow();

		expect(() => {
			checkFilesExist(`${app}/src/main.rs`);
		}).not.toThrow();

		let cargoToml = readFile("Cargo.toml").replace(/\s+/g, "");

		expect(cargoToml).toMatch(`[workspace]members=["./${app}","./${lib}"]`);
	}, 120000);
});
