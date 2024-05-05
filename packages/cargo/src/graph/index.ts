import {
	ProjectConfiguration,
	ProjectGraph,
	ProjectGraphBuilder,
	ProjectGraphProcessorContext as Context,
	ProjectGraphProjectNode as ProjectNode,
} from "@nrwl/devkit";
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
	}
	target_directory: string;
	version: number;
	workspace_root: string;
	metadata: unknown | null;
}

interface ResolveNode {
	id: CargoId;
	dependencies: CargoId[];
}

export function processProjectGraph(graph: ProjectGraph, ctx: Context): ProjectGraph {
	let {
		packages,
		workspace_members: cargoWsMembers,
		resolve: cargoResolve,
		workspace_root: wsRoot,
	} = getCargoMetadata();

	let builder = new ProjectGraphBuilder(graph);

	let workspacePackages = new Map<CargoId, CargoPackage>();
	for (let id of cargoWsMembers) {
		let pkg = packages.find(p => p.id === id);
		if (pkg) {
			workspacePackages.set(id, pkg);
		}
	}

	let nxData = mapCargoProjects(ctx, graph, wsRoot, workspacePackages);
	for (let { id: sourceId, dependencies } of cargoResolve.nodes) {
		if (nxData.has(sourceId)) {
			let sourceProject = nxData.get(sourceId)!;
			let graphDependencies = graph.dependencies[sourceProject.name];

			if (graphDependencies) {
				for (let dependency of graphDependencies) {
					if (!sourceProject.config.implicitDependencies?.includes(dependency.target)) {
						builder.removeDependency(sourceProject.name, dependency.target);
					}
				}
			}

			for (let depId of dependencies) {
				if (nxData.has(depId)) {
					let targetProject = nxData.get(depId)!;
					builder.addImplicitDependency(sourceProject.name, targetProject.name);
				}
			}
		}
	}

	return builder.getUpdatedProjectGraph();
}

function getCargoMetadata(): CargoMetadata {
	let availableMemory = os.freemem();
	let metadata = cp.execSync("cargo metadata --format-version=1", {
		encoding: "utf8",
		maxBuffer: availableMemory,
	});

	return JSON.parse(metadata);
}

interface NxProjectData {
	name: string;
	config: ProjectConfiguration;
	graphNode?: ProjectNode<{ [key: string]: unknown }>;
}

function mapCargoProjects(
	ctx: Context,
	graph: ProjectGraph,
	wsRoot: string,
	packages: Map<CargoId, CargoPackage>,
) {
	let result = new Map<CargoId, NxProjectData>();
	for (let [cargoId, cargoPackage] of packages) {
		if (!cargoPackage.manifest_path) {
			throw new Error("Expected cargo package's `manifest_path` to exist");
		}

		let manifestDir = path.dirname(cargoPackage.manifest_path);
		let projectDir = path
			.relative(wsRoot, manifestDir)
			.replace(/\\/g, "/");

		let found = Object
			.entries(ctx.workspace.projects)
			.find(([, config]) => config.root === projectDir);

		if (found) {
			let [projectName, projectConfig] = found;
			let projectNode = graph.nodes[projectName];

			assert(projectNode?.type !== "npm");

			result.set(cargoId, {
				name: projectName,
				config: projectConfig,
				graphNode: projectNode,
			});
		}
	}

	return result;
}

function assert(expression: unknown, message?: string): asserts expression {
	if (!expression) {
		if (message) throw new Error(`Assertion failed: ${message}`);
		else throw new Error("Assertion failed");
	}
}
