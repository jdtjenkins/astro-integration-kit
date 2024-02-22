import { type AstroIntegration, type HookParameters } from "astro";
import { hasIntegration } from "./has-integration.js";

export type addIntegrationUserOptionalParams = {
	ensureUnique?: boolean;
};

export type addIntegrationUserParams = {
	integration: AstroIntegration;
	options?: addIntegrationUserOptionalParams
}

type AddIntegrationParams = addIntegrationUserParams & {
	updateConfig: HookParameters<"astro:config:setup">["updateConfig"];
	config: HookParameters<"astro:config:setup">["config"];
	logger: HookParameters<"astro:config:setup">["logger"];
};

/**
 * Easily add an integration from within an integration.
 *
 * @param {import("astro").AstroIntegration} integration
 * @param {import("astro").HookParameters<"astro:config:setup">["updateConfig"]} params.updateConfig
 * @param {import("astro").HookParameters<"astro:config:setup">["config"]} params.config
 * @param {import("astro").HookParameters<"astro:config:setup">["logger"]} params.logger
 *
 * @example
 * ```ts
 * import Vue from "@astrojs/vue";
 *
 * addIntegration(Vue())
 * ```
 *
 * @see https://astro-integration-kit.netlify.app/utilities/add-integration/
 */
export const addIntegration = ({
	integration,
	options,
	updateConfig,
	config,
	logger,
}: AddIntegrationParams) => {
	const ensureUnique = options?.ensureUnique ?? true;

	if (
		ensureUnique &&
		hasIntegration({
			name: integration.name,
			config,
		})
	) {
		logger.warn(
			`Integration "${integration.name}" has already been added by the user or another integration. Skipping.`,
		);

		return;
	}

	updateConfig({
		integrations: [integration],
	});
};
