import { resolve } from "path";
import { defineConfig } from "vite";
import tailwindcss from "tailwindcss";

export default defineConfig({
	mode: "development",
	css: {
		postcss: {
			plugins: [tailwindcss],
		},
	},
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
