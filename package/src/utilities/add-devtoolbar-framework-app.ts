import { readFileSync } from "fs";
import { type HookParameters } from "astro";
import { AstroError } from "astro/errors";
import { createResolver } from "../core/create-resolver.js";
import { addVirtualImport } from "./add-virtual-import.js";
import { existsSync } from 'node:fs';
import { dirname } from 'pathe';

type SupportedFrameworks = "react" | "preact" | "vue" | "svelte" | "solid";

export type AddDevToolbarFrameworkAppParams = {
	id: string;
	name: string;
	icon: string;
	framework: SupportedFrameworks;
	src: string;
	style?: string;
} & Pick<
	HookParameters<"astro:config:setup">,
	"addDevToolbarApp" | "updateConfig" | "injectScript" | "config" | "command"
>;

const frameworkDependencies: Record<SupportedFrameworks, string[]> = {
	preact: ['preact'],
	react: ['react', 'react-dom', '@vitejs/plugin-react'],
	svelte: ['svelte'],
	solid: ['solid-js'],
	vue: ['vue'],
}

// Returns the path of the AIK folder
function getNearestPackageJson(directory: string): string {
	const { resolve } = createResolver(directory);
	const packageJsonPath = resolve('./package.json');

	if (existsSync(packageJsonPath)) {
		return resolve();
	}

	const parentDir = dirname(directory);
	if (parentDir === directory) {
		// Reached the root directory without finding a package.json
		throw new AstroError("Can't find package.json. This should never, EVER get hit. If you ever get this error, sorry we goofed.");
	}

	return getNearestPackageJson(parentDir);
}

// https://github.com/sindresorhus/callsites/blob/main/index.js
function callsites(): NodeJS.CallSite[] {
	const _prepareStackTrace = Error.prepareStackTrace;
	try {
		let result: NodeJS.CallSite[] = [];
		Error.prepareStackTrace = (_, callSites) => {
			const callSitesWithoutCurrent = callSites.slice(1);
			result = callSitesWithoutCurrent;
			return callSitesWithoutCurrent;
		};

		new Error().stack;
		return result;
	} finally {
		Error.prepareStackTrace = _prepareStackTrace;
	}
}

function getMissingFrameworkDependencies(framework: SupportedFrameworks, configRoot: string): string[] {
	const aikRoot = getNearestPackageJson(import.meta.url);
	const integrationRootDirectory = getNearestPackageJson(callsites()[3]?.getEvalOrigin()!)

	const { resolve: rootResolve } = createResolver(configRoot);
	const { resolve: aikResolve } = createResolver(aikRoot);
	const { resolve: integrationResolve } = createResolver(integrationRootDirectory);

	
	const missingDeps = frameworkDependencies[framework]
	.filter(dep =>
		!existsSync(rootResolve(`./node_modules/${ dep }`)) &&
		!existsSync(aikResolve(`./node_modules/${ dep }`)) &&
		!existsSync(integrationResolve(`./node_modules/${ dep }`))
	)
		
	return missingDeps;
}

function getDependencyPaths(framework: SupportedFrameworks, configRoot: string): Record<string, string> {
	const integrationRootDirectory = getNearestPackageJson(callsites()[2]?.getEvalOrigin()!);

	const { resolve: rootResolve } = createResolver(configRoot);
	const { resolve: integrationRootResolver } = createResolver(integrationRootDirectory);

	return frameworkDependencies[framework].reduce((prev: Record<string, string>, dep) => {
		const rootInstalledDependency = rootResolve(`./node_modules/${ dep }`);

		prev[dep] = existsSync(rootInstalledDependency) ?
			rootInstalledDependency :
			integrationRootResolver(`./node_modules/${ dep }`)
		
		

		return prev;
	}, {})
}

/**
 * Add a Dev Toolbar Plugin that uses a Framework component.
 *
 * @param {object} params
 * @param {string} params.name - The name of the toolbar plugin
 * @param {string} params.icon - This should be an inline SVG
 * @param {URL} params.framework
 * @param {URL} params.src - Path to your component
 * @param {URL} params.style - A stylesheet to pass to your plugin
 * @param {URL} params.callback - A callback function containing the canvas and window your plugin is loaded on
 * @param {import("astro").HookParameters<"astro:config:setup">["updateConfig"]} params.updateConfig
 * @param {import("astro").HookParameters<"astro:config:setup">["addDevToolbarApp"]} params.addDevToolbarApp
 * @param {import("astro").HookParameters<"astro:config:setup">["injectScript"]} params.injectScript
 * @param {import("astro").HookParameters<"astro:config:setup">["config"]} params.config
 * @param {import("astro").HookParameters<"astro:config:setup">["command"]} params.command
 *
 * @example
 * ```ts
 * addDevToolbarFrameworkApp({
 *      framework: "vue",
 *      name: "Test Vue Plugin",
 *      id: "test-vue-plugin",
 *      icon: `<svg version="1.1" viewBox="0 0 261.76 226.69" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1.3333 0 0 -1.3333 -76.311 313.34)"><g transform="translate(178.06 235.01)"><path d="m0 0-22.669-39.264-22.669 39.264h-75.491l98.16-170.02 98.16 170.02z" fill="#41b883"/></g><g transform="translate(178.06 235.01)"><path d="m0 0-22.669-39.264-22.669 39.264h-36.227l58.896-102.01 58.896 102.01z" fill="#34495e"/></g></g></svg>`,
 *      src: resolve("./Test.vue"),
 *      style: `
 *          button {
 *              background-color: rebeccapurple;
 *          }
 *      `,
 * });
 * ```
 *
 * @see https://astro-integration-kit.netlify.app/utilities/add-devtoolbar-framework-app/
 */
export const addDevToolbarFrameworkApp = ({
	id,
	name,
	icon,
	framework,
	src,
	style,
	addDevToolbarApp,
	updateConfig,
	injectScript,
	config,
	command,
}: AddDevToolbarFrameworkAppParams) => {
	const virtualModuleName = `virtual:astro-devtoolbar-app-${id}`;

	const { resolve } = createResolver(import.meta.url);

	const missingFrameworkDependencies = getMissingFrameworkDependencies(framework, config.root.pathname);

	if (missingFrameworkDependencies.length > 0) {
		throw new AstroError(`Missing dependencies for ${framework} framework: ${ missingFrameworkDependencies }`);
	}

	let content = readFileSync(
		resolve(`../stubs/add-devtoolbar-framework-app/${framework}.ts`),
		"utf8",
	);

	const escapedIcon = icon.replace("`", '${"`"}');

	content = content
		.replace("@@COMPONENT_SRC@@", src)
		.replace("@@ID@@", id)
		.replace("@@NAME@@", name)
		.replace("@@ICON@@", escapedIcon)
		.replace("@@STYLE@@", style ?? "");

	addVirtualImport({
		name: virtualModuleName,
		content,
		updateConfig,
	});

	if (framework === "react") {
		import("@vitejs/plugin-react").then((react) => {
			const FAST_REFRESH_PREAMBLE = react.default.preambleCode;
			const preamble = FAST_REFRESH_PREAMBLE.replace("__BASE__", "/");
			injectScript("page", preamble);
		});
	}

	addDevToolbarApp(virtualModuleName);

	const depRoutesObject = getDependencyPaths(framework, config.root.pathname);

	if (command === 'dev') {
		updateConfig({
			vite: {
				resolve: {
					alias: {
						...depRoutesObject,
					},
				},
			}
		})
	}
};
