import * as nrwl from "@nrwl/devkit";
import { ExecutorContext, Tree } from "@nrwl/devkit";
import * as chalk from "chalk";
import * as cp from "child_process";
import { kebabCase } from "lodash";

import {
	CompilationOptions,
	DisplayOptions,
	FeatureSelection,
	ManifestOptions,
	OutputOptions,
} from "./schema";

export interface GeneratorOptions {
	projectName: string;
	moduleName: string;
	projectRoot: string;
	projectDirectory: string;
	parsedTags: string[];
	edition: number;
}

// prettier-ignore
export type CargoOptions = Partial<
	& FeatureSelection
	& CompilationOptions
	& OutputOptions
	& DisplayOptions
	& ManifestOptions
	& { [key: string]: unknown }
>;

interface GeneratorCLIOptions {
	name: string;
	directory?: string;
	tags?: string;
	edition?: number;
}

interface Names {
	name: string;
	className: string;
	propertyName: string;
	constantName: string;
	fileName: string;
	snakeName: string;
}

export enum Target {
	Build,
	Run,
	Test,
	Clippy,
}

export function cargoNames(name: string): Names {
	let result = nrwl.names(name) as Names;
	result.snakeName = result.constantName.toLowerCase();

	return result;
}

export function normalizeGeneratorOptions<T extends GeneratorCLIOptions>(
	projectType: "application" | "library",
	host: Tree,
	opts: T
): T & GeneratorOptions {
	let layout = nrwl.getWorkspaceLayout(host);
	let names = cargoNames(opts.name);
	let moduleName = names.snakeName;

	// Only convert project/file name casing if it's invalid
	let projectName = /^[-_a-zA-Z0-9]+$/.test(opts.name)
		? opts.name
		: names.snakeName;

	let fileName = /^[-_a-zA-Z0-9]+$/.test(opts.name)
		? opts.name
		: names.fileName;

	let rootDir = {
		application: layout.appsDir,
		library: layout.libsDir,
	}[projectType];

	let projectDirectory = opts.directory
		? `${nrwl.names(opts.directory).fileName}/${fileName}`
		: fileName;

	let projectRoot = `${rootDir}/${projectDirectory}`;
	let parsedTags = opts.tags?.split(",").map(s => s.trim()) ?? [];
	let edition = opts.edition ?? 2021;

	return {
		...opts,
		projectName,
		moduleName,
		projectRoot,
		projectDirectory,
		parsedTags,
		edition,
	};
}

export function updateWorkspaceMembers(host: Tree, opts: GeneratorOptions) {
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

export function parseCargoArgs<T extends CargoOptions>(
	target: Target,
	options: T,
	ctx: ExecutorContext,
): string[] {
	let opts = { ...options };
	let args = [] as string[];

	if (opts.toolchain)
		processArg(args, opts, "toolchain", `+${opts.toolchain}`);

	// prettier-ignore
	switch (target) {
		case Target.Build: args.push("build"); break;
		case Target.Test:  args.push("test");  break;
		case Target.Run: args.push("run"); break;
		case Target.Clippy: args.push("clippy"); break;
	}

	if (!ctx.projectName) {
		throw new Error("Expected project name to be non-null");
	}

	let packageName = (opts["package"] as undefined | string) ?? ctx.projectName;
	if ("package" in opts)
			delete opts["package"];

	if (opts.bin) {
		processArg(
			args, opts, "bin",
			"-p", packageName,
			"--bin", opts.bin,
		);
	} else if (
		target === Target.Build
		&& ctx.workspace.projects[ctx.projectName].projectType === "application"
	) {
		args.push("--bin", packageName);
	} else {
		args.push("-p", packageName);
	}

	if (opts.features) {
		const argsToAdd = opts.features === "all"
			? ["--all-features"]
			: ["--features", opts.features];

		processArg(args, opts, "features", ...argsToAdd);
	}

	if (opts.noDefaultFeatures)
		processArg(args, opts, "noDefaultFeatures", "--no-default-features");

	if (opts.target)
		processArg(args, opts, "target", "--target", opts.target);

	if (opts.release)
		processArg(args, opts, "release", "--release");

	if (opts.targetDir)
		processArg(args, opts, "targetDir", "--target-dir", opts.targetDir);

	if ("outDir" in opts && !!(opts as any)["outDir"]) {
		if (args[0] !== "+nightly") {
			if (args[0].startsWith("+")) {
				let label = chalk.bold.yellowBright.inverse(" WARNING ");
				let original = args[0].replace(/^\+/, "");
				let message =
					`'outDir' option can only be used with 'nightly' toolchain, ` +
					`but toolchain '${original}' was already specified. ` +
					`Overriding '${original}' => 'nightly'.`;

				console.log(`${label} ${message}`);

				args[0] = "+nightly";
			} else {
				args.unshift("+nightly");
			}
		}
		args.push("-Z", "unstable-options", "--out-dir", (opts as any)["outDir"]);
		delete (opts as any)["outDir"];
	}

	if (opts.verbose)
		processArg(args, opts, "verbose", "-v");

	if (opts.veryVerbose)
		processArg(args, opts, "veryVerbose", "-vv");

	if (opts.quiet)
		processArg(args, opts, "quiet", "-q");

	if (opts.messageFormat)
		processArg(args, opts, "messageFormat", "--message-format", opts.messageFormat);

	if (opts.locked)
		processArg(args, opts, "locked", "--locked");

	if (opts.frozen)
		processArg(args, opts, "frozen", "--frozen");

	if (opts.offline)
		processArg(args, opts, "offline", "--offline");

	// For the sake of future-proofing in the absence of updates to this plugin,
	// pass any remaining options straight through to `cargo`
	for (let [key, value] of Object.entries(opts)) {
		args.push(`--${kebabCase(key)}`);

		if (value !== true)
			args.push(String(value));
	}

	return args;
}

function processArg(
	args: string[],
	opts: CargoOptions,
	key: keyof CargoOptions,
	...argsToAdd: string[]
) {
	args.push(...argsToAdd);
	delete opts[key];
}

export function runCargo(args: string[], ctx: ExecutorContext) {
	console.log(chalk.dim`> cargo ${
		args.map(arg => / /.test(arg) ? `"${arg}"` : arg)
			.join(" ")
	}`);

	return new Promise<void>((resolve, reject) => {
		cp.spawn("cargo", args, {
			cwd: ctx.root,
			shell: true,
			stdio: "inherit",
		})
			.on("error", reject)
			.on("close", code => {
				if (code) reject(new Error(`Cargo failed with exit code ${code}`));
				else resolve();
			});
	});
}
