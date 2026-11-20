import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// base: './' — щоб сайт працював на GitHub Pages у підпапці репозиторію
export default defineConfig({
  base: './',
  plugins: [vue()]
})
