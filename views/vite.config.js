import { resolve } from "path";
import { defineConfig } from "vite";
export default defineConfig({
	build: {
		root: resolve(__dirname, ""),
		// These are dev options only:
		assetsInlineLimit: 0,
		minify: false,
		lib: {
			entry: "./transform/main.js",
			name: "PC-UI",
			fileName: "scripts",
			formats: ["es"],
		},
		outDir: resolve(__dirname, "assets/"),
	},
});
