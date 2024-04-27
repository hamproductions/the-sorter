import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { join } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.BASE_URL,
  resolve: {
    alias: {
      ['styled-system']: join(__dirname, './styled-system/'),
      ['~']: join(__dirname, './src/')
      // 'three/addons': join(__dirname, '../../node_modules/three/examples/jsm/')
    }
  }
});
