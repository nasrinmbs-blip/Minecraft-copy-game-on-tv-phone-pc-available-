import {defineConfig} from 'vite';

export default defineConfig(({mode}) => {
  return {
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
