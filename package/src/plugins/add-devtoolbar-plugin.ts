import { definePlugin } from "../core/define-plugin.js";
import {
	addDevToolbarPlugin,
	type addDevToolbarPluginUserParams,
} from "../utilities/add-devtoolbar-plugin.js";

export const addDevToolbarPluginPlugin = definePlugin({
	name: "addDevToolbarPlugin",
	hook: "astro:config:setup",
	implementation:
		({
			addDevToolbarApp,
			updateConfig,
			injectScript,
			logger,
		}) =>
		(params: addDevToolbarPluginUserParams) =>
			addDevToolbarPlugin({
				...params,
				addDevToolbarApp,
				updateConfig,
				injectScript,
				logger
			}),
});
