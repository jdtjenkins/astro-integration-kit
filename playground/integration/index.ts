import { readFileSync } from "node:fs";
import {
	addVirtualImport,
	createResolver,
	defineIntegration,
} from "astro-integration-kit";


import Vue from '@astrojs/vue';
import React from '@astrojs/react';
import Preact from '@astrojs/preact';

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
				addIntegration(React({
					include: ['**/*.react.jsx'],
				}));
				addIntegration(Preact({
					include: ['**/*.preact.jsx'],
				}));

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
					src: resolve("./devToolbarPlugins/Test.react.jsx"),
				});

				addDevToolbarPlugin({
					framework: "preact",
					name: "Test Preact Plugin",
					id: "test-preact-plugin",
					icon: `<svg xmlns="http://www.w3.org/2000/svg" width="0.87em" height="1em" viewBox="0 0 256 296"><path fill="#673AB8" d="m128 0l128 73.9v147.8l-128 73.9L0 221.7V73.9z"/><path fill="#FFF" d="M34.865 220.478c17.016 21.78 71.095 5.185 122.15-34.704c51.055-39.888 80.24-88.345 63.224-110.126c-17.017-21.78-71.095-5.184-122.15 34.704c-51.055 39.89-80.24 88.346-63.224 110.126m7.27-5.68c-5.644-7.222-3.178-21.402 7.573-39.253c11.322-18.797 30.541-39.548 54.06-57.923c23.52-18.375 48.303-32.004 69.281-38.442c19.922-6.113 34.277-5.075 39.92 2.148c5.644 7.223 3.178 21.403-7.573 39.254c-11.322 18.797-30.541 39.547-54.06 57.923c-23.52 18.375-48.304 32.004-69.281 38.441c-19.922 6.114-34.277 5.076-39.92-2.147"/><path fill="#FFF" d="M220.239 220.478c17.017-21.78-12.169-70.237-63.224-110.126C105.96 70.464 51.88 53.868 34.865 75.648c-17.017 21.78 12.169 70.238 63.224 110.126c51.055 39.889 105.133 56.485 122.15 34.704m-7.27-5.68c-5.643 7.224-19.998 8.262-39.92 2.148c-20.978-6.437-45.761-20.066-69.28-38.441c-23.52-18.376-42.74-39.126-54.06-57.923c-10.752-17.851-13.218-32.03-7.575-39.254c5.644-7.223 19.999-8.261 39.92-2.148c20.978 6.438 45.762 20.067 69.281 38.442c23.52 18.375 42.739 39.126 54.06 57.923c10.752 17.85 13.218 32.03 7.574 39.254"/><path fill="#FFF" d="M127.552 167.667c10.827 0 19.603-8.777 19.603-19.604c0-10.826-8.776-19.603-19.603-19.603c-10.827 0-19.604 8.777-19.604 19.603c0 10.827 8.777 19.604 19.604 19.604"/></svg>`,
					src: resolve("./devToolbarPlugins/Test.preact.jsx"),
				});
			},
		};
	},
});

export default testIntegration;
