import {
	CompilationOptions,
	DisplayOptions,
	FeatureSelection,
	OutputOptions,
	ManifestOptions,
} from "../../common/schema";

// prettier-ignore
type Options =
	& FeatureSelection
	& CompilationOptions
	& OutputOptions
	& DisplayOptions
	& ManifestOptions
	& { [key: string]: unknown }
& {
	/**
	 * Copy final artifacts to this directory.
	 *
	 * This option is unstable and available only on the [nightly channel](https://doc.rust-lang.org/book/appendix-07-nightly-rust.html)
	 * and requires the `-Z unstable-options` flag to enable. See https://github.com/rust-lang/cargo/issues/6790
	 * for more information.
	 */
	outDir?: string;
	/**
	 * Run `cargo run ...` instead of `cargo build ...`.
	 *
	 * @deprecated
	 * Remove this property and use the `@nxrs/cargo:run` executor instead of `@nxrs/cargo:build`.
	 */
	run?: boolean;
};

export default Options;
