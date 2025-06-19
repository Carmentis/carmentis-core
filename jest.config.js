import { createDefaultPreset } from "ts-jest";

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
export default {
  testEnvironment: "node",
  rootDir: '.',
  testMatch: ['<rootDir>/src/**/*.spec.ts'],
  transform: {
    ...tsJestTransformCfg,
    /*
    '^\.src\/.+\\.(ts|tsx|js)$': [
        'ts-jest', { isolatedModules: true, useESM: true,  tsconfig: '<rootDir>/tsconfig.json' }
    ],

     */
  },
  transformIgnorePatterns: [
      `<rootDir>/node_modules/(?!@noble\/(secp256k1|post-quantum(?!\/ml-dsa)))`,
      '/node_modules/(?!@noble/(post-quantum|secp256k1)/).*\\.(ts|js)$',
    '/node_modules/@noble/(post-quantum|secp256k1)/',
      '<rootDir>/node_modules/'

  ],
  //transformIgnorePatterns: [`<rootDir>/node_modules/(?!@noble)/`, `<rootDir>/node_modules/@noble/post-quantum/`, `<rootDir>/node_modules/@noble/secp256k1/`],
};