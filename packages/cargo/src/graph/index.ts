import {
	DependencyType,
	ProjectGraph,
	ProjectGraphBuilder,
	ProjectGraphProcessorContext,
} from "@nrwl/devkit";
import * as cp from "child_process";

export function processProjectGraph(
	graph: ProjectGraph,
	ctx: ProjectGraphProcessorContext
): ProjectGraph {
	let metadata = cp.execSync("cargo metadata --format-version=1", {
		encoding: "utf8",
	});
	let { packages, workspace_members } = JSON.parse(metadata);
	let builder = new ProjectGraphBuilder(graph);

	workspace_members
		.map(id => packages.find(pkg => pkg.id === id))
		.filter(pkg => Object.keys(ctx.fileMap).includes(pkg.name))
		.forEach(pkg => {
			pkg.dependencies.forEach(dep => {
				let depName = dep.source == null ? dep.name : `cargo:${dep.name}`;

				if (!Object.keys(graph.nodes).includes(depName)) {
					let depPkg = packages.find(pkg => pkg.source === dep.source);
					builder.addNode({
						name: depName,
						type: "cargo",
						data: {
							version: depPkg.version,
							packageName: depPkg.name,
							files: [],
						},
					});
				}

				builder.addDependency(DependencyType.static, pkg.name, depName);
			});
		});

	return builder.getProjectGraph();
}
