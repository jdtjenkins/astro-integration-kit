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

    const content = `\
import { h, createApp, Suspense } from "vue";
import Component from "${ src }";

export default {
    id: "${ id }",
    name: "${ name }",
    icon: "${ icon }",
    init: async (canvas) => {
        const app = createApp({
            name: "${ virtualModuleName }",
            render() {
                let content = h(Component, {}, {});
        
                if (isAsync(Component.setup)) {
                    content = h(Suspense, null, content);
                }
        
                return content;
            }
        });

        const myWindow = document.createElement("astro-dev-toolbar-window");

        canvas.appendChild(myWindow);
        
        app.mount(myWindow, true)
    }
}

function isAsync(fn) {
    const constructor = fn?.constructor;
    return constructor && constructor.name === "AsyncFunction";
}`;

    console.log(content)

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