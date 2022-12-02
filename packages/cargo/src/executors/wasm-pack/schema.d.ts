export interface GlobalFlags {
	/*
  Prints help information
  */
	help?: boolean;

	/*
  No output printed to stdout
   */
	quiet?: boolean;

	/*
  Prints version information
   */
	version?: boolean;

	/*
  Log verbosity is based off the number of v used
   */
	verbose?: number;
}

export interface GlobalOptions {
	/*
  The maximum level of messages that should be logged by wasm-pack. [possible values:
                                   info, warn, error] [default: info]
   */
	"log-level": "info" | "warn" | "error";
}

interface WasmPackCommand<
	N extends string,
	F extends Record<string, any>,
	O extends Record<string, any>,
	A extends Record<string, any>
> {
	commandName: N;
	flags: F;
	options: O;
	args: A;
}

export interface BuildCommandFlags {
	/*
  Create a development build. Enable debug info, and disable optimizations
   */
	dev?: boolean;

	/*
  By default, a *.d.ts file is generated for the generated JS file, but this flag will disable
                           generating this TypeScript file
   */
	"no-typescript"?: boolean;

	/*
  Prints help information
   */
	help?: boolean;

	/*
  Create a profiling build. Enable optimizations and debug info
   */
	profiling?: boolean;

	/*
  Create a release build. Enable optimizations and disable debug info
   */
	release?: boolean;

	/*
  Prints version information
   */
	version?: boolean;
}

export interface BuildCommandOptions {
	/*
  Sets steps to be run. [possible values: no-install, normal, force] [default: normal]
   */
	mode?: "no-install" | "normal" | "force";

	/*
  Sets the output directory with a relative path [default: pkg]
   */
	"out-dir"?: string;

	/*
  Sets the output file names. Defaults to package name
   */
	"out-name"?: string;

	/*
  The npm scope to use in package.json, if any
   */
	scope?: string;

	/*
  Sets the target environment. [possible values: bundler, nodejs, web, no-modules]
                                 [default: bundler]
   */
	target?: "bundler" | "nodejs" | "web" | "no-modules";
}

export interface BuildCommandArgs {
	/*
  The path to the Rust crate. If not set, searches up the path from the current directory
   */
	path: string;

	/*
  List of extra options to pass to `cargo build`
   */
	extraOptions?: string[];
}

export type BuildCommand = WasmPackCommand<
	"build",
	BuildCommandFlags,
	BuildCommandOptions,
	BuildCommandArgs
>;

export interface BuildCommandFlags {
	/*
  Create a development build. Enable debug info, and disable optimizations
   */
	dev?: boolean;

	/*
  By default, a *.d.ts file is generated for the generated JS file, but this flag will disable
                           generating this TypeScript file
   */
	"no-typescript"?: boolean;

	/*
  Prints help information
   */
	help?: boolean;

	/*
  Create a profiling build. Enable optimizations and debug info
   */
	profiling?: boolean;

	/*
  Create a release build. Enable optimizations and disable debug info
   */
	release?: boolean;

	/*
  Prints version information
   */
	version?: boolean;
}

export interface BuildCommandOptions {
	/*
  Sets steps to be run. [possible values: no-install, normal, force] [default: normal]
   */
	mode?: "no-install" | "normal" | "force";

	/*
  Sets the output directory with a relative path [default: pkg]
   */
	"out-dir"?: string;

	/*
  Sets the output file names. Defaults to package name
   */
	"out-name"?: string;

	/*
  The npm scope to use in package.json, if any
   */
	scope?: string;

	/*
  Sets the target environment. [possible values: bundler, nodejs, web, no-modules]
                                 [default: bundler]
   */
	target?: "bundler" | "nodejs" | "web" | "no-modules";
}

export interface BuildCommandArgs {
	/*
  The path to the Rust crate. If not set, searches up the path from the current directory
   */
	path: string;

	/*
  List of extra options to pass to `cargo build`
   */
	extraOptions?: string[];
}

export type TestCommand = WasmPackCommand<
	"test",
	BuildCommandFlags,
	BuildCommandOptions,
	BuildCommandArgs
>;

export type WasmPackCommands = BuildCommand | TestCommand;

export type WasmPackExecutorSchema = Partial<WasmPackCommands> & {
	globalFlags?: GlobalFlags;
	globalOptions?: GlobalOptions;
};
