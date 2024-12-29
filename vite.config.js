import { defineConfig } from 'vite';

export default defineConfig({
    // Base public path when served in development or production
    base: '/',

    // Development server configuration
    server: {
        port: 3000,
        open: true // Open browser on server start
    },

    // Configure env file loading
    envDir: './',

    // Build configuration
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: true
    }
}); 