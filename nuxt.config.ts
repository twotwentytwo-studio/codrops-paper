import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
	compatibilityDate: '2026-09-01',
	devtools: { enabled: false },

	modules: ['@lama/domgl/nuxt'],

	domgl: { gate: { touch: true } },

	css: ['~/assets/css/main.css'],

	vite: {
		plugins: [tailwindcss()],
	},

	app: {
		head: {
			title: 'Paper × domgl',
			meta: [
				{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
				{ name: 'description', content: 'A small site to test the Paper pipeline: design on the canvas, hand the file to code, drive the shaders with scroll.' },
			],
			link: ['/fonts/HostGrotesk-Regular.woff2', '/fonts/HostGrotesk-Medium.woff2'].map((href) => ({
				rel: 'preload' as const,
				as: 'font' as const,
				type: 'font/woff2',
				href,
				crossorigin: 'anonymous' as const,
			})),
		},
	},
})
