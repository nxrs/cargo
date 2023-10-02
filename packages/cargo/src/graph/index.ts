import {
	ProjectGraph,
	ProjectGraphBuilder,
	ProjectGraphProcessorContext,
} from "@nrwl/devkit";
import * as cp from "child_process";
import * as util from "util";
import * as chalk from "chalk";

type JsonPrimitive = string | number | null;

type JsonObject = {
	[key: string]:
		| JsonPrimitive | JsonObject
		| JsonPrimitive[] | JsonObject[]
}

interface CargoMetadata {
	packages: JsonObject[];
	workspace_members: string[];
}

export function processProjectGraph(
	graph: ProjectGraph,
	ctx: ProjectGraphProcessorContext
): ProjectGraph {
	let metadata = cp.execSync("cargo metadata --format-version=1", {
		encoding: "utf8",
		maxBuffer: 1024 * 1024 * 1024 * 32,
	});
	let { packages, workspace_members }: CargoMetadata = JSON.parse(metadata);
	let builder = new ProjectGraphBuilder(graph);

	workspace_members
		.map(id => packages.find(pkg => pkg?.id === id))
		.filter(pkg => Object.keys(ctx.fileMap).includes(pkg?.name as string))
		.forEach(pkg => {
			if (!pkg) return;

			(pkg.dependencies as JsonObject[])?.forEach(dep => {
				let depName = dep.source == null
					? dep.name as string
					: `cargo:${dep.name}`;

				if (!Object.keys(graph.nodes).includes(depName)) {
					let depPkg = packages.find(pkg =>
						(pkg.source as string)?.startsWith(dep.source as string)
					);

					if (!depPkg) {
						console.log(
							`${chalk.yellowBright.bold.inverse(
								" WARN "
							)} Failed to find package for dependency:`
						);
						console.log(util.inspect(dep));

						return;
					}

					builder.addNode({
						name: depName,
						type: "cargo" as any,
						data: {
							version: depPkg.version,
							packageName: depPkg.name,
							files: [],
						},
					});
				}

				builder.addImplicitDependency(pkg.name as string, depName);
			});
		});

	return builder.getUpdatedProjectGraph();
}
