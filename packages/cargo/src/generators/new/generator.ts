import {
	addProjectConfiguration,
	formatFiles,
	getWorkspaceLayout,
	names,
	Tree,
} from "@nrwl/devkit";
import * as cp from "child_process";
import { promises as fs } from "fs";
import * as path from "path";

import cargoInit from "../init/generator";
import CLIOptions from "./schema";

interface Options extends CLIOptions {
	projectName: string;
	projectRoot: string;
	projectDirectory: string;
	parsedTags: string[];
	cliFlag: "--bin" | "--lib";
}

export default async function (host: Tree, opts: CLIOptions) {
	let options = normalizeOptions(host, opts);
	console.log("options:", options);

	addProjectConfiguration(host, options.projectName, {
		root: options.projectRoot,
		projectType: options.projectType,
		sourceRoot: `${options.projectRoot}/src`,
		targets: {
			build: {
				executor: "@nxrs/cargo:build",
			},
			test: {
				executor: "@nxrs/cargo:test",
			},
			lint: {
				executor: "@nxrs/cargo:clippy",
			},
		},
		tags: options.parsedTags,
	});

	await addFiles(host, options);
	await formatFiles(host);
}

function normalizeOptions(host: Tree, opts: CLIOptions): Options {
	let layout = getWorkspaceLayout(host);
	let name = names(opts.name).fileName;
	let projectName = name;

	let { rootDir, cliFlag } = {
		application: { rootDir: layout.appsDir, cliFlag: "--bin" },
		library: { rootDir: layout.libsDir, cliFlag: "--lib" },
	}[opts.projectType];

	let projectDirectory = opts.directory
		? `${names(opts.directory).fileName}/${name}`
		: name;

	let projectRoot = `${rootDir}/${projectDirectory}`;
	let parsedTags = opts.tags ? opts.tags.split(",").map(s => s.trim()) : [];

	return {
		...opts,
		cliFlag: cliFlag as "--bin" | "--lib",
		projectName,
		projectRoot,
		projectDirectory,
		parsedTags,
	};
}

async function addFiles(host: Tree, opts: Options) {
	if (!host.exists("Cargo.toml")) {
		await cargoInit(host, {});
	}

	await generateCargoProject(host, opts);
	updateWorkspaceMembers(host, opts);
}

async function generateCargoProject(host: Tree, opts: Options) {
	let cwd = path.resolve(host.root, opts.projectRoot, "..");
	try {
		await fs.stat(cwd);
	} catch (err) {
		await fs.mkdir(cwd, { recursive: true });
	}

	return new Promise<void>((resolve, reject) => {
		cp.spawn("cargo", ["new", opts.cliFlag, opts.projectName, "--vcs=none"], {
			cwd,
			shell: true,
			stdio: "inherit",
		})
			.on("error", reject)
			.on("close", code => {
				if (code) reject();
				else resolve();
			});
	});
}

function updateWorkspaceMembers(host: Tree, opts: Options) {
	let updated = host
		.read("Cargo.toml")!
		.toString()
		.split("\n")
		.reduce((accum, line) => {
			let trimmed = line.trim();
			let match: RegExpMatchArray | null;

			if ((match = trimmed.match(/^members\s*=\s*\[(.*)\]$/))) {
				let members = match[1]
					.split(",")
					.map(m => m.trim())
					.filter(Boolean);

				members.push(`"${opts.projectRoot}"`);
				accum.push(`members = [`, ...members.map(m => "    " + m), `]`);
			} else if ((match = trimmed.match(/^members\s*=\s*\[$/))) {
				accum.push(line, `    "${opts.projectRoot}",`);
			} else {
				accum.push(line);
			}

			return accum;
		}, [] as string[])
		.join("\n");

	host.write("Cargo.toml", updated);
}
