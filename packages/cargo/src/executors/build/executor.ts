import { ExecutorContext } from "@nrwl/devkit";

import { Target, parseCargoArgs, runCargo } from "../../common";
import CLIOptions from "./schema";

export default async function (opts: CLIOptions, ctx: ExecutorContext) {
	try {
		let args = opts.run
			? parseCargoArgs(Target.Run, opts, ctx)
			: parseCargoArgs(Target.Build, opts, ctx);

		await runCargo(args, ctx);

		return { success: true };
	} catch (err) {
		return {
			success: false,
			reason: err?.message,
		};
	}
}
