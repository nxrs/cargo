import { ExecutorContext } from "@nrwl/devkit";
import { parseCargoArgs, runCargo, Target } from "../../common";
import CLIOptions from "./schema";

export default async function (opts: CLIOptions, ctx: ExecutorContext) {
	try {
		let args = [
			...parseCargoArgs(Target.Clippy, opts, ctx),
			...parseClippyArgs(opts),
		];
		await runCargo(args, ctx);

		return { success: true };
	} catch (err) {
		return {
			success: false,
			reason: err?.message,
		};
	}
}

function parseClippyArgs(opts: CLIOptions): string[] {
	let args = ["--"];

	if (opts.failOnWarnings || opts.failOnWarnings == null) {
		args.push("-D", "warnings");
	}
	if (opts.noDeps || opts.noDeps == null) {
		args.push("--no-deps");
	}
	if (opts.fix) {
		args.push("--fix");
	}

	return args;
}
