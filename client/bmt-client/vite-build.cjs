(async () => {
const { build } = await import('vite');
await build({
  configFile: './vite.config.ts',
  build: { outDir: './dist' }
});
console.log('Build complete!');
})();