import {
	ExecutorContext,
	Tree,
	getWorkspaceLayout,
	names as nxNames,
} from "@nx/devkit";
import * as chalk from "chalk";
import * as cp from "child_process";
import { kebabCase } from "lodash";

import {
	CompilationOptions,
	DisplayOptions,
	EnvironmentOptions,
	FeatureSelection,
	ManifestOptions,
	OutputOptions,
} from "./schema";

import ClippyCliOptions from "../executors/clippy/schema";

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
	& EnvironmentOptions
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
	let result = nxNames(name) as Names;
	result.snakeName = result.constantName.toLowerCase();

	return result;
}

export function normalizeGeneratorOptions<T extends GeneratorCLIOptions>(
	projectType: "application" | "library",
	host: Tree,
	opts: T
): T & GeneratorOptions {
	let layout = getWorkspaceLayout(host);
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
		? `${nxNames(opts.directory).fileName}/${fileName}`
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

/**
 * @returns a tuple of `[args, env?]`
 */
export function parseCargoArgs<T extends CargoOptions>(
	target: Target,
	options: T,
	ctx: ExecutorContext,
): [string[], Record<string, string|undefined>?] {
	let opts = { ...options };
	let args = [] as string[];

	const env = extractEnv(opts);

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

	let passThroughArgs = target === Target.Clippy
		? parseClippyArgs(opts)
		: null;

	let packageName = (opts["package"] as undefined | string) ?? ctx.projectName;
	if ("package" in opts)
		delete opts["package"];

	let projects = ctx.projectsConfigurations?.projects ?? ctx.workspace?.projects;
	if (!projects) {
		throw new Error("Failed to find projects map from executor context");
	}

	if (opts.bin) {
		processArg(
			args, opts, "bin",
			"-p", packageName,
			"--bin", opts.bin,
		);
	} else if (
		target === Target.Build
		&& projects[ctx.projectName].projectType === "application"
	) {
		args.push("--bin", packageName);
	} else {
		args.push("-p", packageName);
	}

	if (opts.features) {
		let argsToAdd = opts.features === "all"
			? ["--all-features"]
			: ["--features", opts.features];

		processArg(args, opts, "features", ...argsToAdd);
	}

	if (opts.noDefaultFeatures)
		processArg(args, opts, "noDefaultFeatures", "--no-default-features");

	if (opts.target)
		processArg(args, opts, "target", "--target", opts.target);

	if (opts.release != null) {
		if (opts.release) {
			args.push("--profile", "release");

			if (opts["profile"]) {
				let label = chalk.bold.yellowBright.inverse(" WARNING ");
				console.log(
					`${label} Conflicting options found: "release" and "profile" `
						+ `-- "profile" will be overridden`
				);
				delete opts["profile"];
			}
		}
		delete opts.release;
	}

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
		if (value !== false) {
			args.push(`--${kebabCase(key)}`);

			if (value !== true)
				args.push(String(value));
		}
	}

	if (passThroughArgs) {
		args.push("--", ...passThroughArgs);
	}

	return [args, env];
}

function parseClippyArgs(opts: ClippyCliOptions): string[] {
	let args = [];

	if (opts.failOnWarnings || opts.failOnWarnings == null) {
		delete opts.failOnWarnings;
		args.push("-D", "warnings");
	}
	if (opts.noDeps || opts.noDeps == null) {
		delete opts.noDeps;
		args.push("--no-deps");
	}
	if (opts.fix) {
		delete opts.fix;
		args.push("--fix");
	}

	return args;
}

function extractEnv(opts: CargoOptions): Record<string, string|undefined> | undefined {
	if ("env" in opts && opts.env != null) {
		const env = {
			...process.env,
			...opts.env,
		};

		delete opts.env;

		return env;
	}
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

export function runCargo(
	args: string[],
	ctx: ExecutorContext,
	env?: Record<string, string|undefined>,
) {
	console.log(chalk.dim`> cargo ${
		args.map(arg => / /.test(arg) ? `"${arg}"` : arg)
			.join(" ")
	}`);

	return new Promise<void>((resolve, reject) => {
		cp.spawn("cargo", args, {
			cwd: ctx.root,
			shell: true,
			stdio: "inherit",
			env,
		})
			.on("error", reject)
			.on("close", code => {
				if (code) reject(new Error(`Cargo failed with exit code ${code}`));
				else resolve();
			});
	});
}
