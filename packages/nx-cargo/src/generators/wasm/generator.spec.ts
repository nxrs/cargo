import { Tree } from "@nrwl/devkit";
import { createTreeWithEmptyV1Workspace } from "@nrwl/devkit/testing";
import runGenerator from "./generator";

describe("wasm generator", () => {
	let appTree: Tree;

	beforeAll(() => {
		appTree = createTreeWithEmptyV1Workspace();
	});

	describe("with kebab-case project name", () => {
		beforeAll(async () => {
			await runGenerator(appTree, { name: "my-library", outDirName: "pkg" });
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

			expect(cargoContent).toContain(`name = "my-library"`);
			expect(cargoContent).toContain(`edition = "2021"`);

			let libRsContent = changes
				.find(c => c.path === "libs/my-library/src/lib.rs")!
				.content!.toString();

			expect(libRsContent).toMatchSnapshot();

			let utilsRsContent = changes
				.find(c => c.path === "libs/my-library/src/utils.rs")!
				.content!.toString();

			expect(utilsRsContent).toMatchSnapshot();

			let testsWebRsContent = changes
				.find(c => c.path === "libs/my-library/tests/web.rs")!
				.content!.toString();

			expect(testsWebRsContent).toMatchSnapshot();
		});

		it("should add project to workspace members", () => {
			let changes = appTree.listChanges();
			let members = changes.find(c => c.path === "Cargo.toml")!.content!.toString();

			expect(members).toContain(`"libs/my-library"`);
		});
	});

	describe("with snake_case project name", () => {
		beforeAll(async () => {
			appTree = createTreeWithEmptyV1Workspace();
			await runGenerator(appTree, { name: "my_library", outDirName: "pkg" });
		});

		it("should create the correct file structure", () => {
			let changes = appTree.listChanges();
			let cargoToml = changes.find(c => c.path === "libs/my_library/Cargo.toml");
			let libRs = changes.find(c => c.path === "libs/my_library/src/lib.rs");
			let utilsRs = changes.find(c => c.path === "libs/my_library/src/utils.rs");
			let testsWebRs = changes.find(c => c.path === "libs/my_library/tests/web.rs");

			expect(cargoToml).toBeTruthy();
			expect(libRs).toBeTruthy();
			expect(utilsRs).toBeTruthy();
			expect(testsWebRs).toBeTruthy();
		});

		it("should populate project files with the correct content", () => {
			let changes = appTree.listChanges();
			let cargoContent = changes
				.find(c => c.path === "libs/my_library/Cargo.toml")!
				.content!.toString();

			expect(cargoContent).toContain(`name = "my_library"`);
			expect(cargoContent).toContain(`edition = "2021"`);

			let libRsContent = changes
				.find(c => c.path === "libs/my_library/src/lib.rs")!
				.content!.toString();

			expect(libRsContent).toMatchSnapshot();

			let utilsRsContent = changes
				.find(c => c.path === "libs/my_library/src/utils.rs")!
				.content!.toString();

			expect(utilsRsContent).toMatchSnapshot();

			let testsWebRsContent = changes
				.find(c => c.path === "libs/my_library/tests/web.rs")!
				.content!.toString();

			expect(testsWebRsContent).toMatchSnapshot();
		});

		it("should add project to workspace members", () => {
			let changes = appTree.listChanges();
			let members = changes.find(c => c.path === "Cargo.toml")!.content!.toString();

			expect(members).toContain(`"libs/my_library"`);
		});
	});
});
