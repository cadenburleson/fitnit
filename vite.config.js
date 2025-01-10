import { defineConfig } from 'vite';

export default defineConfig({
    root: 'src',
    envDir: '../',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: '/index.html',
                login: '/login.html',
                signup: '/signup.html',
                resetPassword: '/reset-password.html',
                updatePassword: '/update-password.html'
            }
        }
    },
    server: {
        port: 3000, // Dev server runs on port 3000
        open: true,// Opens browser automatically when starting dev server
        historyApiFallback: true // Supports SPA routing
    },
    css: {
        postcss: './postcss.config.js',
    },
    define: {
        'process.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL),
        'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
        // 'process.env.VITE_OPENAI_API_KEY': JSON.stringify(process.env.VITE_OPENAI_API_KEY),
        // 'process.env.VITE_ANTHROPIC_API_KEY': JSON.stringify(process.env.VITE_ANTHROPIC_API_KEY),
        'process.env.VITE_SYSTEM_PROMPT': JSON.stringify(process.env.VITE_SYSTEM_PROMPT)
    }
}); 