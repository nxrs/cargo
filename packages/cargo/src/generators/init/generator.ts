import { formatFiles, generateFiles, Tree } from "@nrwl/devkit";
import * as path from "path";

import CLIOptions from "./schema";

// Next release:
//   TODO: Add `buildable` and `publishable` options to `lib` generator
//   TODO: Update `lib` generator to *not* add `build` target to workspace.json unless
//         `buildable` is true
//   FIXME: Try to avoid nx auto-running the executors for buildable deps when their
//          dependents are built, since cargo already does this (may be blocked upstream)
//   TODO: Update init generator to add "@nxrs/cargo" to nx.json > plugins
//
// Longer term:
//   TODO: Add `format` executor via rustfmt
//   TODO: Add `benchmark` generator/executor via Criterion

interface Options extends CLIOptions {
	toolchain: string;
}

export default async function (host: Tree, opts: CLIOptions) {
	let options = normalizeOptions(host, opts);
	addFiles(host, options);

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
