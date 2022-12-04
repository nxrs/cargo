import {
	CompilationOptions,
	DisplayOptions,
	FeatureSelection,
	OutputOptions,
} from "../../common/schema";

// prettier-ignore
type Options =
	& FeatureSelection
	& CompilationOptions
	& OutputOptions
	& DisplayOptions
	& ManifestOptions
& {
	/**
	 * Copy final artifacts to this directory.
	 *
	 * This option is unstable and available only on the [nightly channel](https://doc.rust-lang.org/book/appendix-07-nightly-rust.html)
	 * and requires the `-Z unstable-options` flag to enable. See https://github.com/rust-lang/cargo/issues/6790
	 * for more information.
	 */
	outDir?: string;
};

export default Options;
