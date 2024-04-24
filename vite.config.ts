import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import {join} from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
      alias: {
        ["styled-system"]: join(__dirname, "./styled-system/")
        // 'three/addons': join(__dirname, '../../node_modules/three/examples/jsm/')
      }
  }
});
