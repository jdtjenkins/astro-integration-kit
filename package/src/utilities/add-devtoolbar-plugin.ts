import { readFileSync } from "fs";
import { type HookParameters } from "astro";
import { createResolver } from "../core/create-resolver.js";
import { addVirtualImport } from "./add-virtual-import.js";

export type SupportedFrameworks = "react" | "preact" | "vue" | "svelte" | "solid"

export type addDevToolbarPluginUserParams = {
	id: string;
	name: string;
	icon: string;
	framework: SupportedFrameworks;
	src: string;
	style?: string;
	callback?: (canvas: ShadowRoot, window: HTMLElement) => void;
};

export type addDevToolbarPluginParams = addDevToolbarPluginUserParams & {
	addDevToolbarApp: HookParameters<"astro:config:setup">["addDevToolbarApp"];
	updateConfig: HookParameters<"astro:config:setup">["updateConfig"];
	injectScript: HookParameters<"astro:config:setup">["injectScript"];
	logger: HookParameters<"astro:config:setup">["logger"];
};

const frameworkRequiredDeps: { [key in SupportedFrameworks]: string[] } = {
    react: ["@vitejs/plugin-react", "react", "react-dom"],
    preact: ["preact"],
    solid: ["solid-js"],
    vue: ["vue"],
    svelte: ["svelte"],
};

const capitalized = (word: string) =>
    word.charAt(0).toUpperCase()
    + word.slice(1)

const checkFrameworkDepsAreInstalled = async (framework: SupportedFrameworks): Promise<void> => {
    const requiredDeps = frameworkRequiredDeps[framework]
    const promises = requiredDeps.map(dependency => new Promise(async (resolve, reject) => {
        try {
            resolve(await import(/* @vite-ignore */dependency))
        } catch {
            reject({
                dependency,
            })
        }
    }));

    const allSettled = await Promise.allSettled(promises);

    const rejectedPromises = allSettled.filter(promise => promise.status === "rejected");

    const missingDependencies = rejectedPromises.map((promiseError) => (promiseError as unknown as {
        reason: {
            dependency: string;
        };
    }).reason.dependency);

    if (rejectedPromises.length > 0) {
        throw new Error(`${ capitalized(framework) } Dev Toolbar Plugins requires the following dependencies to be installed: [${ requiredDeps.join(", ") }] - Missing dependencies: [${ missingDependencies.join(', ') }]`)
    }
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
 * @param {import("astro").HookParameters<"astro:config:setup">["logger"]} params.logger
 *
 * @example
 * ```ts
 * addDevToolbarPlugin({
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
 *      callback: (canvas, window) => {},
 * });
 * ```
 *
 * @see https://astro-integration-kit.netlify.app/utilities/add-devtoolbar-plugin/
 */
export const addDevToolbarPlugin = ({
	id,
	name,
	icon,
	framework,
	src,
	style,
	callback,
	addDevToolbarApp,
	updateConfig,
	injectScript,
    logger,
}: addDevToolbarPluginParams) => {
    (async () => {
        try {
            await checkFrameworkDepsAreInstalled(framework);
        } catch (error) {
            logger.error(`addDevToolbarPlugin - ${ name } - ${ error }`)

            return;
        }

        switch (framework) {
            case "react":
                const react = await import("@vitejs/plugin-react")
                const FAST_REFRESH_PREAMBLE = react.default.preambleCode;
                const preamble = FAST_REFRESH_PREAMBLE.replace("__BASE__", "/");
                injectScript("page", preamble);
    
                break;
        }
    
        const virtualModuleName = `virtual:astro-devtoolbar-app-${id}`;
    
        const { resolve } = createResolver(import.meta.url);
    
        let content = readFileSync(
            resolve(`./addDevToolbarPluginStubs/${framework}.ts`),
            "utf8",
        );
    
        content = content
            .replace("@@COMPONENT_SRC@@", src)
            .replace("@@ID@@", id)
            .replace("@@NAME@@", name)
            .replace("@@ICON@@", icon)
            .replace("@@STYLE@@", style || "")
            .replace(
                "((canvas, window) => {})(canvas, myWindow); //@@CALLBACK@@",
                !!callback ? `(${ callback?.toString() })(canvas, myWindow)` : "()=>{}",
            );

        console.log(virtualModuleName)
    
        addVirtualImport({
            name: virtualModuleName,
            content,
            updateConfig,
        });
    
        updateConfig({
            vite: {
                optimizeDeps: {
                    exclude: [virtualModuleName],
                },
            },
        });
    
        addDevToolbarApp(virtualModuleName);
    })()
    
};
