import { defineConfig } from 'vite';

/**
 * Build en "library mode" -> un seul fichier auto-exécutable (IIFE) : dist/widget.js.
 * Il s'auto-monte au chargement, sans dépendance, intégrable via une balise <script>.
 */
export default defineConfig({
  build: {
    lib: { entry: 'src/main.ts', name: 'EstimoWidget', formats: ['iife'], fileName: () => 'widget.js' },
    rollupOptions: { output: { entryFileNames: 'widget.js' } },
    cssCodeSplit: false,
    emptyOutDir: true,
  },
});
