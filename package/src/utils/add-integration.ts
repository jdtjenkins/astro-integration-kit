import { type AstroIntegration, type HookParameters } from "astro"
import { hasIntegration } from './has-integration.js';

export const addIntegration = ({
    integration,
    updateConfig,
    config,
    logger,
}: {
    integration: AstroIntegration,
    updateConfig: HookParameters<"astro:config:setup">["updateConfig"],
    config: HookParameters<"astro:config:setup">["config"],
    logger: HookParameters<"astro:config:setup">["logger"],
}) => {
    if (hasIntegration({
        name: integration.name,
        config
    })) {
        logger.warn(`Trying to add integration "${ integration.name }. Already added to Astro."`)
    };

    updateConfig({
        vite: {
            plugins: [integration],
        },
    });
}