import {
	Tree,
	formatFiles,
	generateFiles,
	readNxJson,
	updateNxJson,
} from "@nx/devkit";
import * as path from "path";

import CLIOptions from "./schema";

// TODO: Add `buildable` option to `library` generator
// TODO: Add `format` executor via rustfmt
// TODO: Add `benchmark` generator/executor via Criterion

interface Options extends CLIOptions {
	toolchain: string;
}

export default async function (host: Tree, opts: CLIOptions) {
	let options = normalizeOptions(host, opts);
	addFiles(host, options);
	addPlugin(host, options);

	await formatFiles(host);
}

function normalizeOptions(_: Tree, options: CLIOptions): Options {
	let toolchain = options.toolchain ?? "stable";

	return { toolchain };
}

function addFiles(host: Tree, options: Options) {
	let templateOptions = {
		toolchain: options.toolchain,
		template: "",
	};

	generateFiles(host, path.join(__dirname, "files"), ".", templateOptions);

	let gitignore = host.read(".gitignore")?.toString() ?? "";
	gitignore += "/target";

	host.write(".gitignore", gitignore);
}

function addPlugin(host: Tree, _: Options) {
	let config = readNxJson(host) ?? {};
	let plugins = config.plugins
		? config.plugins.concat("@nxrs/cargo")
		: ["@nxrs/cargo"];

	updateNxJson(host, { ...config, plugins });
}
