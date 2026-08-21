import { defineConfig } from 'tsdown';

export default defineConfig([
  {
    // cross platform parts
    entry: { neutral: 'src/_neutral.ts' },
    platform: 'neutral',
    dts: { sourcemap: true },
  },
  {
    // node.js parts & cross platform
    entry: { node: 'src/_node.ts' },
    platform: 'node',
    dts: { sourcemap: true },
  },
  {
    // isolated because of the optional quicktype-core peer dep
    entry: { 'type-writer': 'src/_type-writer.ts' },
    platform: 'node',
    dts: { sourcemap: true },
  },
]);
