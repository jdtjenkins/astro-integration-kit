import { type HookParameters } from "astro"
import { addVirtualImport } from "./add-virtual-import.js"
import { readFileSync } from 'fs';
import { createResolver } from './create-resolver.js';

export const addDevToolbarPlugin = ({
    id,
    name,
    icon,
    framework,
    src,
    addDevToolbarApp,
    updateConfig,
}: {
    id: string,
    name: string,
    icon: string,
    framework: "react" | "preact" | "vue" | "svelte" | "solid",
    src: string,
    addDevToolbarApp: HookParameters<"astro:config:setup">["addDevToolbarApp"],
    updateConfig: HookParameters<"astro:config:setup">["updateConfig"],
}) => {
    const virtualModuleName = `virtual:astro-devtoolbar-app-${ id }`;

    const { resolve } = createResolver(import.meta.url);

    let content = readFileSync(resolve(`./stubs/${ framework }.ts`), 'utf-8');

    content = content
        .replace('@@COMPONENT_SRC@@', src)
        .replace('@@ID@@', id)
        .replace('@@NAME@@', name)
        .replace('@@ICON@@', icon)

    addVirtualImport({
        name: virtualModuleName,
        content,
        updateConfig,
    });

    updateConfig({
        vite: {
            optimizeDeps: {
                exclude: [virtualModuleName],
            }
        }
    })

    addDevToolbarApp(virtualModuleName)
}