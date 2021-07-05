import { Tree } from "@nrwl/devkit";

import cargoNew from "../new/generator";
import CLIOptions from "./schema";

export default async function (host: Tree, opts: CLIOptions) {
	await cargoNew(host, {
		...opts,
		projectType: "application",
	});
}
