import {
	CompilationOptions,
	DisplayOptions,
	FeatureSelection,
	ManifestOptions,
	OutputOptions,
} from "../../common/schema";

// prettier-ignore
type Options =
	& FeatureSelection
	& CompilationOptions
	& OutputOptions
	& DisplayOptions
	& ManifestOptions
	& { [key: string]: unknown };

export default Options;
