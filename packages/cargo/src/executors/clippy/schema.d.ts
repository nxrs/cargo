import {
	CompilationOptions,
	DisplayOptions,
	EnvironmentOptions,
	FeatureSelection,
	ManifestOptions,
	PackageSelection,
} from "../../common/schema";

type Options =
	& PackageSelection
	& FeatureSelection
	& CompilationOptions
	& DisplayOptions
	& ManifestOptions
	& EnvironmentOptions
	& { [key: string]: unknown }
& {
	/** Automatically fix code where possible. */
	fix?: boolean;
	/**
	 * Return with a non-zero exit code when lint warnings are encountered.
	 * @default true
	 */
	failOnWarnings?: boolean;
	/**
	 * By default, Clippy will run on the selected project **and** any dependencies that
	 * are members of the workspace. To run Clippy **only** on this project, use this flag.
	 * @default true
	 */
	noDeps?: boolean;
};

export default Options;
