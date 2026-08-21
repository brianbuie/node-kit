import { defineConfig } from 'tsdown';

export default defineConfig([
  {
    // full Node-facing API: node/ + core/, used for the "node" condition
    entry: { index: 'src/_index.ts' },
    platform: 'node',
    dts: { sourcemap: true },
  },
  {
    // runtime-agnostic pieces only, used for the "default" condition + "./core" subpath
    entry: { core: 'src/core/_index.ts' },
    platform: 'neutral',
    dts: { sourcemap: true },
  },
  {
    // isolated because of the optional quicktype-core peer dep
    entry: { 'type-writer': 'src/type-writer/type-writer.ts' },
    platform: 'node',
    dts: { sourcemap: true },
  },
]);
