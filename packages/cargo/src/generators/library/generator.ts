import {
	addProjectConfiguration,
	formatFiles,
	generateFiles,
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
	let options = normalizeGeneratorOptions("library", host, opts);

	addProjectConfiguration(host, options.projectName, {
		root: options.projectRoot,
		projectType: "library",
		sourceRoot: `${options.projectRoot}/src`,
		targets: {
			test: {
				executor: "@nxrs/cargo:test",
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
	await formatFiles(host);
}

async function addFiles(host: Tree, opts: Options) {
	if (!host.exists("Cargo.toml")) {
		await cargoInit(host, {});
	}

	let substitutions = {
		projectName: opts.projectName,
		edition: opts.edition,
		template: "",
	};

	generateFiles(
		host,
		path.join(__dirname, "files"),
		opts.projectRoot,
		substitutions
	);
}
