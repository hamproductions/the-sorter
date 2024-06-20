import { PluginOption, UserConfig, defineConfig } from 'vite';
// import react from '@vitejs/plugin-react-swc';
import { partytownVite } from '@builder.io/partytown/utils';
import react from '@vitejs/plugin-react';
import { join, resolve } from 'path';
import vike from 'vike/plugin';
import { cjsInterop } from 'vite-plugin-cjs-interop';
import tsconfigPaths from 'vite-tsconfig-paths';

const ReactCompilerConfig = {
  // compilationMode: 'annotation'
};

const isProduction = process.env.NODE_ENV === 'production';
// https://vitejs.dev/config/
export default defineConfig({
  ssr: {
    // noExternal: ['react']
  },
  plugins: [
    tsconfigPaths(),
    partytownVite({
      dest: join(__dirname, 'dist', 'client', '~partytown')
    }),
    cjsInterop({
      dependencies: ['path-browserify', 'lz-string', 'react-helmet-async']
    }),
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', ReactCompilerConfig]]
      }
    }) as PluginOption,
    vike({ prerender: true })
  ],
  base: process.env.PUBLIC_ENV__BASE_URL,
  resolve: {
    alias: {
      '~': new URL('./src/', import.meta.url).pathname
      // ['styled-system']: join(__dirname, './styled-system/'),
      // 'three/addons': join(__dirname, '../../node_modules/three/examples/jsm/')
    }
  },
  build: {
    sourcemap: isProduction,
    cssMinify: isProduction,
    minify: isProduction,
    commonjsOptions: {
      exclude: ['react/cjs', 'react-dom/cjs']
    }
  }
});
