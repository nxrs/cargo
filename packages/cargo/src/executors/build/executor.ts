import { ExecutorContext } from "@nrwl/devkit";
import * as cp from "child_process";

import CLIOptions from "./schema";

export default async function (opts: CLIOptions, ctx: ExecutorContext) {
	try {
		let args = parseArgs(opts, ctx);
		await cargoBuild(args, ctx);

		return { success: true };
	} catch (err) {
		return {
			success: false,
			reason: err?.message,
		};
	}
}

function parseArgs(opts: CLIOptions, ctx: ExecutorContext): string[] {
	let args = ["build"];

	if (!ctx.projectName) {
		throw new Error("Could not determine project to build");
	}
	if (ctx.workspace.projects[ctx.projectName].projectType === "application") {
		args.push("--bin");
	} else {
		args.push("--lib");
	}
	args.push(ctx.projectName);

	if (opts.features) {
		if (opts.features === "all") {
			args.push("--all-features");
		} else {
			args.push("--features", opts.features);
		}
	}

	if (opts.noDefaultFeatures) args.push("--no-default-features");
	if (opts.release) args.push("--release");
	if (opts.targetDir) args.push("--target-dir", opts.targetDir);
	if (opts.outDir) {
		args.push("+nightly", "-Z", "unstable-options", "--out-dir", opts.outDir);
	}
	if (opts.verbose) args.push("-v");
	if (opts.veryVerbose) args.push("-vv");
	if (opts.quiet) args.push("-q");
	if (opts.messageFormat) args.push("--message-format", opts.messageFormat);
	if (opts.locked) args.push("--locked");
	if (opts.frozen) args.push("--frozen");
	if (opts.offline) args.push("--offline");
	if (opts.toolchain) args.push(`+${opts.toolchain}`);

	return args;
}

function cargoBuild(args: string[], ctx: ExecutorContext) {
	return new Promise<void>((resolve, reject) => {
		cp.spawn("cargo", args, {
			cwd: ctx.root,
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
