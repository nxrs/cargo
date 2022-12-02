import { ExecutorContext } from "@nrwl/devkit";
import { WasmPackExecutorSchema } from "./schema";
import * as chalk from "chalk";
import { spawn } from "child_process";

export default async function (opts: WasmPackExecutorSchema, ctx: ExecutorContext) {
	try {
		let args = parseWasmPackOptionsToArgs(opts, ctx);
		await runWasmPack(args, ctx);

		return { success: true };
	} catch (err) {
		console.log(err);
		return {
			success: false,
			reason: err?.message,
		};
	}
}

function parseRecordToArgs(rec: Record<string, any>): string[] {
	return Object.entries(rec).reduce((args, [key, value]) => {
		if (typeof value === "boolean") args.push(`--${key}`);

		if (typeof value === "string" || typeof value === "number")
			args.push(`--${key} ${value}`);

		return args;
	}, [] as string[]);
}

function parseWasmPackOptionsToArgs(
	options: WasmPackExecutorSchema,
	ctx: ExecutorContext
) {
	let args: string[] = [];

	if (options.globalFlags) args.push(...parseRecordToArgs(options.globalFlags));
	if (options.globalOptions) args.push(...parseRecordToArgs(options.globalOptions));

	args.push(options.commandName ?? (ctx.targetName as string));

	if (options.flags) args.push(...parseRecordToArgs(options.flags));
	if (options.options) args.push(...parseRecordToArgs(options.options));
	if (options.args) args.push(...parseRecordToArgs(options.args));

	return args;
}

function runWasmPack(args: string[], ctx: ExecutorContext) {
	console.log(chalk.dim(`> wasm-pack ${args.join(" ")}`));

	return new Promise<void>((resolve, reject) => {
		spawn("wasm-pack", args, {
			cwd: ctx.workspace.projects[ctx.projectName as string].root,
			shell: true,
			stdio: "inherit",
		})
			.on("error", reject)
			.on("close", code => {
				if (code) reject(new Error(`wasm-pack failed with exit code ${code}`));
				else resolve();
			});
	});
}
