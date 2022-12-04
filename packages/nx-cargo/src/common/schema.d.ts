export interface FeatureSelection {
	/** Space or comma separated list of features to activate, or "all". */
	features?: string;
	/** Do not activate the `default` feature of the package. */
	noDefaultFeatures?: boolean;
}

export interface CompilationOptions {
	/**
	 * Build for the given architecture. The default is the host architecture. The general
	 * format of the triple is `<arch><sub>-<vendor>-<sys>-<abi>`. Run
	 * `rustc --print target-list` for a list of supported targets.
	 *
	 * This may also be specified with the `build.target` [config value](https://doc.rust-lang.org/cargo/reference/config.html).
	 *
	 * Note that specifying this flag makes Cargo run in a different mode where the target
	 * artifacts are placed in a separate directory. See the [build cache](https://doc.rust-lang.org/cargo/guide/build-cache.html)
	 * documentation for more details.
	 */
	target?: string;
	/**
	 * Build optimized artifacts with the `release` profile. See the [PROFILES](https://doc.rust-lang.org/cargo/commands/cargo-build.html#profiles)
	 * section for details on how this affects profile selection.
	 */
	release?: boolean;
}

export interface OutputOptions {
	/**
	 * Directory for all generated artifacts and intermediate files. May also be specified
	 * with the `CARGO_TARGET_DIR` environment variable, or the `build.target-dir` [config
	 * value](https://doc.rust-lang.org/cargo/reference/config.html). Defaults to `target`
	 * in the root of the workspace.
	 */
	targetDir?: string;
}

export interface DisplayOptions {
	/**
	 * Use verbose output. May also be specified with the term.verbose [config
	 * value](https://doc.rust-lang.org/cargo/reference/config.html).
	 */
	verbose?: boolean;
	/** Include extra output such as dependency warnings and build script output. */
	veryVerbose?: boolean;
	/** No output printed to stdout. */
	quiet?: boolean;
	/**
	 * The output format for diagnostic messages. Can be specified multiple times and
	 * consists of comma-separated values. Valid values:
	 *
	 *   * `human` (default): Display in a human-readable text format. Conflicts with
	 *     `short` and `json`.
	 *   * `short`: Emit shorter, human-readable text messages. Conflicts with `human` and
	 *     `json`.
	 *   * `json`: Emit JSON messages to stdout. See [the reference](https://doc.rust-lang.org/cargo/reference/external-tools.html#json-messages)
	 *     for more details. Conflicts with `human` and `short`.
	 *   * `json-diagnostic-short`: Ensure the `rendered` field of JSON messages contains
	 *     the "short" rendering from rustc. Cannot be used with `human` or `short`.
	 *   * `json-diagnostic-rendered-ansi`: Ensure the `rendered` field of JSON messages
	 *     contains embedded ANSI color codes for respecting rustc's default color scheme.
	 *     Cannot be used with `human` or `short`.
	 *   * `json-render-diagnostics`: Instruct Cargo to not include rustc diagnostics in in
	 *     JSON messages printed, but instead Cargo itself should render the JSON
	 *     diagnostics coming from rustc. Cargo's own JSON diagnostics and others coming
	 *     from rustc are still emitted. Cannot be used with `human` or `short`.
	 */
	messageFormat?: string;
}

export interface ManifestOptions {
	/**
	 * Requires that the `Cargo.lock` file is up-to-date. If the lock file is missing, or
	 * it needs to be updated, Cargo will exit with an error.
	 */
	locked?: boolean;
	/**
	 * Like `locked`, but prevents Cargo from attempting to access the network to determine
	 * if `Cargo.lock` is out-of-date.
	 */
	frozen?: boolean;
	/**
	 * Prevents Cargo from accessing the network for any reason. Without this flag, Cargo
	 * will stop with an error if it needs to access the network and the network is not
	 * available. With this flag, Cargo will attempt to proceed without the network if
	 * possible.
	 */
	offline?: boolean;
}
