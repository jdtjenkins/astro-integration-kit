import { type HookParameters } from "astro"
import { addVirtualImport } from "./add-virtual-import.js"

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

    addVirtualImport({
        name: virtualModuleName,
        content: `\
import createRenderer from "@astrojs/vue/client.js";
import Component from "${ src }";

export default {
    id: "${ id }",
    name: "${ name }",
    icon: "${ icon }",
    init: async (canvas) {
        const render = createRenderer(canvas)

        await render(Component)
    }
}
`,
        updateConfig,
    })

    addDevToolbarApp(virtualModuleName)
}