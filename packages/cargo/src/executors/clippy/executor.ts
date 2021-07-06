import { ExecutorContext } from "@nrwl/devkit";
import { runCargo } from "../../common";
import CLIOptions from "./schema";

export default async function (opts: CLIOptions, ctx: ExecutorContext) {
	try {
		let args = parseArgs(opts, ctx);
		await runCargo(args, ctx);

		return { success: true };
	} catch (err) {
		return {
			success: false,
			reason: err?.message,
		};
	}
}

function parseArgs(opts: CLIOptions, ctx: ExecutorContext): string[] {
	let args = ["clippy"];

	if (!ctx.projectName) {
		throw new Error("Expected project name to be non-null");
	}
	args.push("-p", ctx.projectName);
	args.push("--");

	if (opts.failOnWarnings || opts.failOnWarnings == null) {
		args.push("-D", "warnings");
	}
	if (opts.noDeps || opts.noDeps == null) {
		args.push("--no-deps");
	}

	if (opts.fix) args.push("--fix");

	return args;
}
