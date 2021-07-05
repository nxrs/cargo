import { formatFiles, generateFiles, Tree } from "@nrwl/devkit";
import * as path from "path";

import CLIOptions from "./schema";

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
}
