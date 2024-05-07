import { Tree } from "@nx/devkit";
import { createTreeWithEmptyV1Workspace } from "@nx/devkit/testing";
import runGenerator from "./generator";

describe("binary generator", () => {
	let appTree: Tree;

	beforeAll(async () => {
		appTree = createTreeWithEmptyV1Workspace();
	});

	describe("with kebab-case project name", () => {
		beforeAll(async () => {
			await runGenerator(appTree, { name: "my-app" });
		});

		it("should create the correct file structure", () => {
			let changes = appTree.listChanges();
			let cargoToml = changes.find(c => c.path === "apps/my-app/Cargo.toml");
			let libRs = changes.find(c => c.path === "apps/my-app/src/main.rs");

			expect(cargoToml).toBeTruthy();
			expect(libRs).toBeTruthy();
		});

		it("should populate project files with the correct content", () => {
			let changes = appTree.listChanges();
			let cargoContent = changes
				.find(c => c.path === "apps/my-app/Cargo.toml")!
				.content!.toString();

			expect(cargoContent).toContain(`name = "my-app"`);
			expect(cargoContent).toContain(`edition = "2021"`);
		});

		it("should add project to workspace members", () => {
			let changes = appTree.listChanges();
			let members = changes.find(c => c.path === "Cargo.toml")!.content!.toString();

			expect(members).toContain(`"apps/my-app"`);
		});
	});

	describe("with snake_case project name", () => {
		beforeAll(async () => {
			await runGenerator(appTree, { name: "my_app" });
		});

		it("should create the correct file structure", () => {
			let changes = appTree.listChanges();
			let cargoToml = changes.find(c => c.path === "apps/my_app/Cargo.toml");
			let libRs = changes.find(c => c.path === "apps/my_app/src/main.rs");

			expect(cargoToml).toBeTruthy();
			expect(libRs).toBeTruthy();
		});

		it("should populate project files with the correct content", () => {
			let changes = appTree.listChanges();
			let cargoContent = changes
				.find(c => c.path === "apps/my_app/Cargo.toml")!
				.content!.toString();

			expect(cargoContent).toContain(`name = "my_app"`);
			expect(cargoContent).toContain(`edition = "2021"`);
		});

		it("should add project to workspace members", () => {
			let changes = appTree.listChanges();
			let members = changes.find(c => c.path === "Cargo.toml")!.content!.toString();

			expect(members).toContain(`"apps/my_app"`);
		});
	});
});
