import { defineConfig } from 'vite';

export default defineConfig({
    root: 'src',
    envDir: '../',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        assetsDir: 'assets',
        rollupOptions: {
            input: {
                main: '/index.html',
                app: '/app.html',
                about: '/about.html',
                // contact: '/contact.html',
                login: '/login.html',
                signup: '/signup.html',
                account: '/account.html',
                resetPassword: '/reset-password.html',
                updatePassword: '/update-password.html'
            },
            output: {
                assetFileNames: (assetInfo) => {
                    const info = assetInfo.name.split('.');
                    const ext = info[info.length - 1];
                    if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
                        return `assets/[name][extname]`;
                    }
                    return `assets/[name]-[hash][extname]`;
                }
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
    base: '/',
    define: {
        'process.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL),
        'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY),
        'process.env.VITE_SYSTEM_PROMPT': JSON.stringify(process.env.VITE_SYSTEM_PROMPT),
        'process.env.VITE_SITE_URL': JSON.stringify(process.env.VITE_SITE_URL)
    }
}); 