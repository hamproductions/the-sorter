import { PluginOption, UserConfig, defineConfig } from 'vite';
// import react from '@vitejs/plugin-react-swc';
import { partytownVite } from '@builder.io/partytown/utils';
import react from '@vitejs/plugin-react';
import { join, resolve } from 'path';
import vike from 'vike/plugin';
import { cjsInterop } from 'vite-plugin-cjs-interop';

const ReactCompilerConfig = {
  // compilationMode: 'annotation'
};

// https://vitejs.dev/config/
export default defineConfig({
  ssr: {
    // noExternal: ['react']
  },
  plugins: [
    partytownVite({
      dest: join(__dirname, 'dist', '~partytown')
    }),
    cjsInterop({
      dependencies: ['path-browserify']
    }),
    vike({ prerender: true }),
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', ReactCompilerConfig]]
      }
    }) as PluginOption
  ],
  base: process.env.BASE_URL,
  resolve: {
    alias: {
      ['styled-system']: join(__dirname, './styled-system/'),
      ['~']: join(__dirname, './src/')
      // 'three/addons': join(__dirname, '../../node_modules/three/examples/jsm/')
    }
  }
});
