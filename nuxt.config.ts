import tailwindcss from '@tailwindcss/vite'

const base = process.env.NUXT_APP_BASE_URL ?? '/'

export default defineNuxtConfig({
	compatibilityDate: '2026-09-01',
	devtools: { enabled: false },

	modules: ['@lama/domgl/nuxt'],

	domgl: { gate: { touch: true } },

	css: ['~/assets/css/main.css'],

	vite: {
		plugins: [
			tailwindcss(),
			// Prefix the media paths with the base URL, so the site also works from a subfolder
			{
				name: 'media-base',
				enforce: 'pre',
				transform(code, id) {
					if (base === '/' || !id.endsWith('generated/media.json')) return
					return code.replaceAll('"/img/', `"${base}img/`).replaceAll('"/tx/', `"${base}tx/`)
				},
			},
		],
	},

	app: {
		head: {
			htmlAttrs: { lang: 'en' },
			script: [
				{
					innerHTML: "document.documentElement.classList.add(matchMedia('(hover: hover) and (pointer: fine)').matches ? 'mouse' : 'touch')",
					tagPosition: 'head',
				},
			],
			noscript: [{ innerHTML: '<style>[data-curtain]{display:none}</style>' }],
			title: 'Paper × domgl',
			meta: [
				{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
				{ name: 'description', content: 'A small site to test the Paper pipeline: design on the canvas, hand the file to code, drive the shaders with scroll.' },
			],
			link: [`${base}fonts/HostGrotesk-Regular.woff2`, `${base}fonts/HostGrotesk-Medium.woff2`].map((href) => ({
				rel: 'preload' as const,
				as: 'font' as const,
				type: 'font/woff2',
				href,
				crossorigin: 'anonymous' as const,
			})),
		},
	},
})
