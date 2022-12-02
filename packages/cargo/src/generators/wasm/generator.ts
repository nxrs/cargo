import * as nrwl from "@nrwl/devkit";
import {
	generateFiles,
	getImportPath,
	getWorkspaceLayout,
	Tree,
} from "@nrwl/devkit";
import * as path from "path";

import {
	GeneratorOptions,
	normalizeGeneratorOptions,
	updateWorkspaceMembers,
} from "../../common";
import cargoInit from "../init/generator";
import CLIOptions from "./schema";

// prettier-ignore
type Options = CLIOptions & GeneratorOptions;

export default async function (host: Tree, opts: CLIOptions) {
	let options = normalizeGeneratorOptions<CLIOptions>("library", host, opts);

	nrwl.addProjectConfiguration(host, options.projectName, {
		root: options.projectRoot,
		projectType: "library",
		sourceRoot: `${options.projectRoot}/src`,
		targets: {
			build: {
				executor: "@nxrs/cargo:wasm-pack",
				options: {},
			},
			pack: {
				executor: "@nxrs/cargo:wasm-pack",
				options: {},
			},
			test: {
				executor: "@nxrs/cargo:wasm-pack",
				options: {},
			},
			publish: {
				executor: "@nxrs/cargo:wasm-pack",
				options: {},
			},
			lint: {
				executor: "@nxrs/cargo:clippy",
				options: {
					fix: false,
					failOnWarnings: true,
					noDeps: true,
				},
			},
		},
		tags: options.parsedTags,
	});

	await addFiles(host, options);
	updateWorkspaceMembers(host, options);
	updateTsConfigPaths(host, options);
	await nrwl.formatFiles(host);
}

async function addFiles(host: Tree, opts: Options) {
	if (!host.exists("Cargo.toml")) {
		await cargoInit(host, {});
	}

	let substitutions = {
		projectName: opts.projectName,
		moduleName: opts.moduleName,
		edition: opts.edition,
		template: "",
	};

	nrwl.generateFiles(
		host,
		path.join(__dirname, "files"),
		opts.projectRoot,
		substitutions
	);
}

function updateTsConfigPaths(host: Tree, opts: CLIOptions & GeneratorOptions) {
	let { npmScope } = getWorkspaceLayout(host);
	let importPath = getImportPath(npmScope, opts.projectDirectory);

	let tsConfigBase = JSON.parse(host.read("tsconfig.base.json")!.toString());

	tsConfigBase.compilerOptions.paths[importPath] = [
		`${opts.projectRoot}/${opts.outDirName}`,
	];

	tsConfigBase.compilerOptions.paths[`${importPath}/*`] = [
		`${opts.projectRoot}/${opts.outDirName}/*`,
	];

	host.write("tsconfig.base.json", JSON.stringify(tsConfigBase));
}
