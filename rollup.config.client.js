import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import dts from "rollup-plugin-dts";
import typescript from "@rollup/plugin-typescript";

export default [
    {
        input: "src/client/sdk.js", // main entry point
        output: [
            {
                file: "dist/client/index.mjs", // ESM output file (ES Module)
                format: "esm",
                sourcemap: true // generate source map files
            },
            {
                file: "dist/client/index.cjs", // CJS output file (CommonJS)
                format: "cjs",
                sourcemap: true // generate source map files
            },
            {
                file: "dist/client/index.js", // IIFE output file
                format: "iife",
                name: "Carmentis",
                sourcemap: false
            }
        ],
        plugins: [
            resolve({
                preferBuiltins: false,
                browser: true,
                exportConditions: ['import', 'module', 'default']
            }), // resolve 3rd-party module imports
            typescript({
                compilerOptions: {
                    target: 'es6',
                },
                allowJs: true, // authorize .js files
                include: ["src/**/*.ts", "src/**/*.js"], // includes .js and .ts
                exclude: ['node_modules/**'],
                declaration: false,
            }),
            commonjs(), // converts CommonJS to ESM
            json() // supports JSON imports
        ],
        external: (id) => {
            // Marquer les dépendances comme externes si elles posent problème
            return /node_modules/.test(id) && id.includes('.ts') && !id.includes('src/');
        },
        onLog(level, log, handler) {
            if(log.code == "MISSING_EXPORT") {
                handler("error", log); // turn missing exports into errors
            }
            else {
                handler(level, log); // use the default handler for anything else
            }
        }
    },
    // Build for TypeScript definitions
    {
        input: "dist/client/sdk.d.ts", // This path depends on your TypeScript configuration
        output: [{ file: "dist/client/index.d.ts", format: "es" }],
        plugins: [dts()]
    }
];
