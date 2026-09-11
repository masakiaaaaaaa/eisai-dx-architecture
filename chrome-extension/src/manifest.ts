import { defineManifest } from '@crxjs/vite-plugin'

export default defineManifest({
    name: 'Jukmane Extension',
    description: 'Jukmane Chrome Extension for seating charts and student profiles',
    version: '1.3.88',
    manifest_version: 3,
    permissions: ['storage'],
    options_ui: {
        page: 'options.html',
        open_in_tab: true,
    },
    content_scripts: [
        {
            matches: ['http://localhost:3000/*', 'https://*/*', 'http://*/*'],
            exclude_matches: [
                '*://*.vercel.app/*',  // Exclude all Vercel deployments (main app)
                '*://eisai-api.vercel.app/*',
                '*://*.youtube.com/*',
                '*://*.google.com/*'
            ],
            js: ['src/content/index.ts'],
        },
    ],
    background: {
        service_worker: 'src/background/index.ts',
        type: 'module',
    },
    host_permissions: [
        'http://localhost:3000/*',
        '*://*/*'
    ],
})
