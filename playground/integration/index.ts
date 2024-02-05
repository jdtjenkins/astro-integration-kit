import { readFileSync } from "node:fs";
import {
	addVirtualImport,
	createResolver,
	defineIntegration,
} from "astro-integration-kit";
import Vue from '@astrojs/vue';
import React from '@astrojs/react';

const testIntegration = defineIntegration<{ name?: string | undefined }>({
	name: "test-integration",
	defaults: {
		name: "abc",
	},
	setup: ({ options }) => {
		const { resolve } = createResolver(import.meta.url);

		const pluginPath = resolve("./plugin.ts");
		console.log({ options, pluginPath });

		return {
			"astro:config:setup": ({
				updateConfig,
				watchIntegration,
				hasIntegration,
				addDts,
				addDevToolbarPlugin,
				addIntegration,
				injectScript,
			}) => {
				watchIntegration(resolve());

				addDts({
					name: "test-integration",
					content: readFileSync(resolve("./virtual.d.ts"), "utf-8"),
				});

				addVirtualImport({
					name: "virtual:astro-integration-kit-playground/config",
					content: `export default ${JSON.stringify({ foo: "bar" })}`,
					updateConfig,
				});

				if (hasIntegration("@astrojs/tailwind")) {
					console.log("Tailwind is installed");
				}

				if (hasIntegration("@astrojs/tailwind", "before")) {
					console.log("Tailwind is installed before this");
				}

				if (hasIntegration("integration-a", "after")) {
					console.log("Integration A is installed after this");
				}

				if (hasIntegration("integration-a", "before", "integration-b")) {
					console.log("Integration A is installed before Integration B");
				}

				if (hasIntegration("integration-b", "after", "integration-a")) {
					console.log("Integration B is installed after Integration A");
				}

				updateConfig({
					vite: {
						optimizeDeps: {
							exclude: ["virtual:@astrojs/vue/app"]
						}
					}
				})

				addIntegration(Vue())
				addIntegration(React())

				addDevToolbarPlugin({
					framework: "vue",
					name: "Test Vue Plugin",
					id: "test-vue-plugin",
					icon: `<svg version="1.1" viewBox="0 0 261.76 226.69" xmlns="http://www.w3.org/2000/svg"><g transform="matrix(1.3333 0 0 -1.3333 -76.311 313.34)"><g transform="translate(178.06 235.01)"><path d="m0 0-22.669-39.264-22.669 39.264h-75.491l98.16-170.02 98.16 170.02z" fill="#41b883"/></g><g transform="translate(178.06 235.01)"><path d="m0 0-22.669-39.264-22.669 39.264h-36.227l58.896-102.01 58.896 102.01z" fill="#34495e"/></g></g></svg>`,
					src: resolve("./devToolbarPlugins/Test.vue"),
				});

				addDevToolbarPlugin({
					framework: "react",
					name: "Test React Plugin",
					id: "test-react-plugin",
					icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-11.5 -10.23174 23 20.46348"><title>React Logo</title><circle cx="0" cy="0" r="2.05" fill="#61dafb"/><g stroke="#61dafb" stroke-width="1" fill="none"><ellipse rx="11" ry="4.2"/><ellipse rx="11" ry="4.2" transform="rotate(60)"/><ellipse rx="11" ry="4.2" transform="rotate(120)"/></g></svg>`,
					src: resolve("./devToolbarPlugins/TestReact.jsx"),
				});
			},
		};
	},
});

export default testIntegration;
