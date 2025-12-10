
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import dts from "rollup-plugin-dts";
import typescript from "@rollup/plugin-typescript";

export default [
    {
        input: "src/server/sdk.ts", // main entry point
        output: [
            {
                file: "dist/server/index.mjs", // ESM output file (ES Module)
                format: "esm",
                sourcemap: true, // generate source map files
            },
            {
                file: "dist/server/index.cjs", // CJS output file (CommonJS)
                format: "cjs",
                sourcemap: true, // generate source map files
            }
        ],
        plugins: [
            resolve({
                preferBuiltins: true,
                exportConditions: ['import', 'module', 'default']
            }), // resolve 3rd-party module imports
            typescript({
                compilerOptions: {
                    target: 'es6',
                },
                sourceMap: true,
                allowJs: true, // Autoriser les fichiers .js
                include: ["src/**/*.ts", "src/**/*.js"], // Inclure JS et TS,
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
        input: "dist/server/sdk.d.ts", // This path depends on your TypeScript configuration
        output: [{ file: "dist/server/index.d.ts", format: "es" }],
        plugins: [dts()],
    }
];
