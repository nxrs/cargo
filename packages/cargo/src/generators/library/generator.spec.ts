import { Tree } from "@nrwl/devkit";
import { createTreeWithEmptyWorkspace } from "@nrwl/devkit/testing";
import runGenerator from "./generator";

describe("library generator", () => {
	let appTree: Tree;

	beforeAll(async () => {
		appTree = createTreeWithEmptyWorkspace();
		await runGenerator(appTree, { name: "my-library" });
	});

	it("should create the correct file structure", () => {
		let changes = appTree.listChanges();
		let cargoToml = changes.find(c => c.path === "libs/my-library/Cargo.toml");
		let libRs = changes.find(c => c.path === "libs/my-library/src/lib.rs");

		expect(cargoToml).toBeTruthy();
		expect(libRs).toBeTruthy();
	});

	it("should populate project files with the correct content", () => {
		let changes = appTree.listChanges();
		let cargoContent = changes
			.find(c => c.path === "libs/my-library/Cargo.toml")!
			.content!.toString();

		expect(cargoContent).toContain(`name = "my_library"`);
		expect(cargoContent).toContain(`edition = "2018"`);

		let libRsContent = changes
			.find(c => c.path === "libs/my-library/src/lib.rs")!
			.content!.toString();

		expect(libRsContent).toContain(`pub fn my_library() -> String {`);
		expect(libRsContent).toContain(`"my_library".into()`);
		expect(libRsContent).toContain(
			`assert_eq!(my_library(), "my_library".to_string())`
		);
	});

	it("should add project to workspace members", () => {
		let changes = appTree.listChanges();
		let members = changes.find(c => c.path === "Cargo.toml")!.content!.toString();

		expect(members).toContain(`"libs/my-library"`);
	});
});
