import {
	ProjectConfiguration,
	CreateDependenciesContext as Context,
	RawProjectGraphDependency as GraphDependency,
	DependencyType,
} from "@nx/devkit";
import * as cp from "child_process";
import * as os from "os";
import * as path from "path";

type VersionNumber = `${number}.${number}.${number}`;
type PackageVersion = `${string}@${VersionNumber}` | VersionNumber;
type CargoId = `${"registry"|"path"}+${"http"|"https"|"file"}://${string}#${PackageVersion}`;

interface CargoPackage {
	name: string;
	version: string;
	id: CargoId;
	license: string;
	license_file: string | null;
	description: string;
	source: string | null;
	dependencies: CargoDependency[];
	targets: unknown; // TODO
	features: Record<string, string[]>;
	manifest_path: string;
	metadata: unknown | null; // TODO
	publish: unknown | null; // TODO
	authors: string[];
	categories: string[];
	keywords: string[];
	readme: string | null;
	repository: string | null;
	homepage: string | null;
	documentation: string | null;
	edition: string;
	links: unknown | null; // TODO
	default_run: unknown | null; // TODO
	rust_version: string;
}

interface CargoDependency {
	name: string;
	source: string | null;
	req: string;
	kind: "build" | "dev" | null;
	rename: string | null;
	optional: boolean;
	uses_default_features: boolean;
	features: string[];
	target: string | null;
	registry: string | null;
	path?: string;
}

interface CargoMetadata {
	packages: CargoPackage[];
	workspace_members: CargoId[];
	workspace_default_members: CargoId[];
	resolve: {
		nodes: ResolveNode[];
		root: unknown;
	};
	target_directory: string;
	version: number;
	workspace_root: string;
	metadata: unknown | null;
}

interface ResolveNode {
	id: CargoId;
	dependencies: CargoId[];
}

export function createDependencies<T = unknown>(_: T, ctx: Context): GraphDependency[] {
	let {
		packages,
		workspace_members: cargoWsMembers,
		resolve: cargoResolve,
	} = getCargoMetadata();

	let workspacePackages = new Map<CargoId, CargoPackage>();
	for (let id of cargoWsMembers) {
		let pkg = packages.find(p => p.id === id);
		if (pkg) {
			workspacePackages.set(id, pkg);
		}
	}

	let nxData = mapCargoProjects(ctx, workspacePackages);

	return cargoResolve
		.nodes
		.filter(({ id }) => nxData.has(id))
		.flatMap<GraphDependency>(({ id: sourceId, dependencies }) => {
			let sourceProject = nxData.get(sourceId)!;
			let cargoPackage = workspacePackages.get(sourceId)!;
			let sourceManifest = path
				.relative(ctx.workspaceRoot, cargoPackage.manifest_path)
				.replace(/\\/g, "/");

			return dependencies
				.filter(depId => nxData.has(depId))
				.map(depId => {
					let targetProject = nxData.get(depId)!;

					return {
						source: sourceProject.name,
						target: targetProject.name,
						type: DependencyType.static,
						sourceFile: sourceManifest,
					}
				})
		});
}

function getCargoMetadata(): CargoMetadata {
	let availableMemory = os.freemem();
	let metadata = cp.execSync("cargo metadata --format-version=1", {
		encoding: "utf8",
		maxBuffer: availableMemory,
	});

	return JSON.parse(metadata);
}

type WithReq<T, K extends keyof T>
	= Omit<T, K>
	& { [Key in K]-?: Exclude<T[Key], null|undefined> }

function mapCargoProjects(ctx: Context, packages: Map<CargoId, CargoPackage>) {
	let result = new Map<CargoId, WithReq<ProjectConfiguration, "name">>();

	for (let [cargoId, cargoPackage] of packages) {
		if (!cargoPackage.manifest_path) {
			throw new Error("Expected cargo package's `manifest_path` to exist");
		}

		let manifestDir = path.dirname(cargoPackage.manifest_path);
		let projectDir = path
			.relative(ctx.workspaceRoot, manifestDir)
			.replace(/\\/g, "/");

		let found = Object
			.entries(ctx.projects)
			.find(([, config]) => config.root === projectDir);

		if (found) {
			let [projectName, projectConfig] = found;

			result.set(cargoId, {
				...projectConfig,
				name: projectName,
			});
		}
	}

	return result;
}
