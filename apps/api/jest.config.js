/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testMatch: ['**/*.spec.ts'],
  transform: {
    // TS151002: aviso do ts-jest sobre "hybrid module kind" (module: node16) que não se aplica
    // aqui — o projeto sempre emite CommonJS puro (package.json sem "type": "module").
    '^.+\\.tsx?$': ['ts-jest', { diagnostics: { ignoreCodes: [151002] } }],
  },
};
