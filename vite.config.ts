import { PluginOption, UserConfig, defineConfig } from 'vite';
// import react from '@vitejs/plugin-react-swc';
import { partytownVite } from '@builder.io/partytown/utils';
import react from '@vitejs/plugin-react';
import { join } from 'path';
import {
  vitePlugin as remix,
  cloudflareDevProxyVitePlugin as remixCloudflareDevProxy
} from '@remix-run/dev';
import { cjsInterop } from 'vite-plugin-cjs-interop';

const ReactCompilerConfig = {
  // compilationMode: 'annotation'
};

// https://vitejs.dev/config/
export default defineConfig({
  ssr: {
    // external: ['react', 'react-dom']
  },
  plugins: [
    partytownVite({
      dest: join(__dirname, 'dist', '~partytown')
    }),
    remix(),
    cjsInterop({ dependencies: ['path-browserify', 'react', 'react-dom'] })
    // react({
    //   babel: {
    //     plugins: [['babel-plugin-react-compiler', ReactCompilerConfig]]
    //   }
    // }) as PluginOption
  ],
  base: process.env.BASE_URL,
  resolve: {
    alias: {
      ['react']: join(__dirname, './node_modules/react'),
      ['react-dom']: join(__dirname, './node_modules/react-dom'),
      ['styled-system']: join(__dirname, './styled-system/'),
      ['~']: join(__dirname, './app/src/')
      // 'three/addons': join(__dirname, '../../node_modules/three/examples/jsm/')
    }
  }
});
