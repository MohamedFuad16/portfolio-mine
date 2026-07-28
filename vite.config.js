import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The React plugin is what gives the dev server Fast Refresh. Without a config
// file Vite still transformed JSX through esbuild, so the build worked and the
// omission was invisible — but every edit forced a full page reload, which also
// tears down the GSAP/ScrollSmoother state you are usually trying to inspect.
export default defineConfig({
  plugins: [react()],
});
