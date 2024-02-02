import tailwind from "@astrojs/tailwind";
import { defineConfig } from "astro/config";
import testIntegration from "./integration";
import Vue from "@astrojs/vue";

// https://astro.build/config
export default defineConfig({
	integrations: [
		tailwind(),
		Vue(),
		testIntegration({ name: "ced" }),
		{ name: "integration-a", hooks: {} },
		{ name: "integration-b", hooks: {} },
	],
});
