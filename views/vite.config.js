import { resolve } from "path";
import { defineConfig } from "vite";
export default defineConfig({
	build: {
		root: resolve(__dirname, ""),
		// These are dev options only:
		minify: false,
		emitAssets: true,

		lib: {
			entry: "./transform/main.js",
			name: "PC-UI",
			fileName: "scripts",
			cssFileName: "style",
			formats: ["es"],
		},
		outDir: resolve(__dirname, "assets/"),
	},
});
