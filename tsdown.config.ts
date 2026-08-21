import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    TypeWriter: 'src/TypeWriter/index.ts',
  },
  platform: 'node',
  dts: {
    sourcemap: true,
  },
});
