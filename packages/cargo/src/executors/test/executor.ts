import { ExecutorContext } from "@nrwl/devkit";

import { parseCargoArgs, runCargo, Target } from "../../common";
import CLIOptions from "./schema";

export default async function (opts: CLIOptions, ctx: ExecutorContext) {
	try {
		let args = parseCargoArgs(Target.Test, opts, ctx);

		await runCargo(args, ctx);

		return { success: true };
	} catch (err) {
		return {
			success: false,
			reason: err?.message,
		};
	}
}
