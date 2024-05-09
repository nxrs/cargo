import {
	CompilationOptions,
	DisplayOptions,
	EnvironmentOptions,
	FeatureSelection,
	ManifestOptions,
	OutputOptions,
	PackageSelection,
} from "../../common/schema";

// prettier-ignore
type Options =
	& PackageSelection
	& FeatureSelection
	& CompilationOptions
	& OutputOptions
	& DisplayOptions
	& ManifestOptions
	& EnvironmentOptions
	& { [key: string]: unknown };

export default Options;
