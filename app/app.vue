<template>
	<dom-gl
		:options="{ velocity: $velocity, host, scroll, glyphs: `${base}glyphs/`, textures: { minCompressed: 800 } }"
		:basis="`${base}_domgl/basis/`"
		:pad="pad"
		:tick="$tick"
	>
		<gl-fluid v-if="fluid" mode="text" :size="0.08" />

		<site-paper />

		<site-dummy />

		<div ref="scrollRoot" class="scroll-root">
			<div ref="content" class="scroll-content">
				<site-nav />

				<site-curtain />

				<main class="relative [--gl-warp-size:14rem] [--gl-warp-speed:1]">
					<gl-solid ground class="bg-ground" />

					<hero-block ref="hero" />

					<featured-panel :from="band" />

					<seam-band />
					<culture-section />

					<testimonials-section />

					<site-footer />
				</main>
			</div>
		</div>
	</dom-gl>
</template>

<script setup lang="ts">
const { $mouse, $velocity, $tick, $write, $scrollY } = useNuxtApp()

// The app's base URL, so glyphs and the transcoder also load from a subfolder
const base = useRuntimeConfig().app.baseURL

const mouse = $mouse ?? true

const fluid = ref(false)

onMounted(() => { fluid.value = mouse })

const pad = ref(0)

if (import.meta.client) pad.value = mouse ? 0 : Math.round(window.innerHeight * 0.25)

const gl = useDomGl()

const stage = import.meta.client && !mouse ? document.createElement('div') : null

if (stage) {
	stage.setAttribute('aria-hidden', 'true')
	stage.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;will-change:transform'
}

const host = stage ?? undefined

const scroll = mouse ? undefined : () => ({ x: 0, y: $scrollY() })

let unWrite: (() => void) | null = null

const scrollRoot = useTemplateRef<HTMLElement>('scrollRoot')
const content = useTemplateRef<HTMLElement>('content')

onMounted(() => {
	if (!stage) return

	content.value?.prepend(stage)

	let base = 0

	const measure = () => {
		pad.value = Math.round(window.innerHeight * 0.25)
		scrollRoot.value?.style.setProperty('--pad', `${pad.value}px`)

		const el = content.value
		base = el ? el.getBoundingClientRect().top + $scrollY() : 0
	}

	const place = () => {
		const el = content.value
		const core = gl.value?.gl.core
		if (!el) return

		const w = window.innerWidth
		const h = window.innerHeight
		const ch = h + pad.value * 2

		const top = $scrollY()
		const y = Math.min(Math.max(top - pad.value, 0), Math.max(0, el.offsetHeight - ch))

		stage.style.width = `${w}px`
		stage.style.height = `${ch}px`
		stage.style.transform = `translate3d(0, ${Math.round(y - base)}px, 0)`

		if (core) core.originY = Math.round(y) - top
	}

	measure()
	place()
	unWrite = $write(place)

	window.addEventListener('resize', measure)

	onScopeDispose(() => window.removeEventListener('resize', measure))
})

onBeforeUnmount(() => unWrite?.())

const hero = useTemplateRef<{ band: HTMLElement | null }>('hero')
const band = computed(() => hero.value?.band ?? null)
</script>
