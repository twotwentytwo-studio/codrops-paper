<template>
	<footer id="contact" class="relative flex w-full flex-col items-start overflow-hidden px-20 s:px-120">
		<div class="bg-line h-px w-full shrink-0" />

		<div ref="inner" class="flex w-full flex-col items-start will-change-transform">
		<div class="flex w-full flex-col items-start justify-between gap-60 pt-80 pb-40 s:flex-row s:pt-120 s:pb-80">
			<div class="flex flex-wrap items-start gap-x-60 gap-y-40 s:flex-nowrap s:gap-x-120">
				<div v-for="group in GROUPS" :key="group.title" class="flex flex-col items-start gap-30">
					<gl-text
						tag="span"
						class="shrink-0 font-mono text-12 leading-10 font-normal tracking-label text-ink/60 uppercase"
					>{{ group.title }}</gl-text>

					<div class="flex flex-col items-start gap-15">
						<gl-text
							v-for="link in group.links"
							:key="link.label"
							tag="a"
							:href="link.id ? `#${link.id}` : '#'"
							:data-dummy="link.id ? undefined : ''"
							class="text-ink shrink-0 font-mono text-12 leading-10 font-normal tracking-label uppercase transition-opacity duration-350 ease-out has-hover:hover:opacity-60"
							@click="go($event, link.id)"
						>{{ link.label }}</gl-text>
					</div>
				</div>
			</div>

			<div class="flex w-full max-w-[40rem] shrink-0 flex-col items-start gap-20">
				<gl-text tag="p" class="font-mono text-12 leading-125 font-normal tracking-label uppercase">
					2026 © PaperDrops. All rights reserved. A test bed for Paper and domgl, built in the open.
				</gl-text>

				<gl-text tag="p" class="font-mono text-12 leading-125 font-normal tracking-label uppercase">
					Design and build by Jesper Landberg.
				</gl-text>
			</div>
		</div>

		<gl-text
			ref="mark"
			tag="span"
			reveal="enter"
			mode="mark"
			:duration="1.5"
			:stagger="0.1"
			class="w-full shrink-0 text-80 leading-10 font-medium tracking-display whitespace-pre s:text-290"
		>PaperDrops</gl-text>
		</div>
	</footer>
</template>

<script setup lang="ts">
type Link = { label: string; id?: string }

const GROUPS: { title: string; links: Link[] }[] = [
	{ title: 'Navigation', links: [{ label: 'Projects', id: 'projects' }, { label: 'Culture', id: 'culture' }, { label: 'Join the team' }] },
	{ title: 'Legal', links: [{ label: 'Privacy' }, { label: 'Cookies' }, { label: 'Terms' }] },
	{ title: 'Contact', links: [{ label: 'hello@paperdrops.com' }] },
]

const { $scrollTo, $write } = useNuxtApp()

const go =(e: MouseEvent, id?: string) => {
	if (!id) return

	e.preventDefault()

	const el = document.getElementById(id)
	if (el) $scrollTo(el)
}

const MARK = /* wgsl */ `
	let t = expo(seq(g, g.at, g.index * 0.6));
	let lh = g.lineBottom - g.lineTop;

	r.offset = vec2f(0.0, (1.0 - t) * lh);

	let open = smoothstep(0.85, 1.0, t) * lh;
	r.mask = vec2f(g.lineTop - open, g.lineBottom + open);
`

const gl = useDomGl()

const mark = useTemplateRef<{ $el: HTMLElement } | HTMLElement>('mark')
const inner = useTemplateRef<HTMLElement>('inner')

const LIFT = 50

const lift = () => {
	const el = inner.value
	const box = el?.parentElement
	if (!el || !box) return

	const rect = box.getBoundingClientRect()
	const vh = window.innerHeight

	if (!rect.height) return

	const p = Math.min(1, Math.max(0, (vh - rect.top) / rect.height))

	el.style.transform = `translate3d(0, ${-(1 - p) * LIFT}%, 0)`
}

const fit = () => {
	const node = mark.value
	const el = (node && '$el' in node ? node.$el : node) as HTMLElement | null

	const box = el?.parentElement
	if (!el || !box) return

	const pad = getComputedStyle(box)
	const target = box.clientWidth
		- Number.parseFloat(pad.paddingLeft)
		- Number.parseFloat(pad.paddingRight)

	const text = el.textContent?.trim()
	if (!target || !text) return

	const css = getComputedStyle(el)
	const at = Number.parseFloat(css.fontSize) || 1

	const ctx = document.createElement('canvas').getContext('2d')
	if (!ctx) return

	ctx.font = `${css.fontWeight} ${at}px ${css.fontFamily}`

	if ('letterSpacing' in ctx) ctx.letterSpacing = css.letterSpacing

	const m = ctx.measureText(text)

	const bearing = -m.actualBoundingBoxLeft
	const ink = m.actualBoundingBoxRight + m.actualBoundingBoxLeft

	if (!(ink > 0)) return

	const size = (at * target) / ink

	el.style.fontSize = `${size}px`
	el.style.marginLeft = `${(-bearing * size) / at}px`
}

let frame = 0

const onResize = () => {
	cancelAnimationFrame(frame)
	frame = requestAnimationFrame(fit)
}

let unWrite: (() => void) | null = null

let unReveal: (() => void) | null = null

let alive = true

onMounted(async () => {
	await nextTick()

	if (!alive) return

	unReveal = watch(gl, (ctx) => {
		ctx?.gl.defineReveal('mark', { unit: 'glyph', code: MARK })
	}, { immediate: true })

	lift()
	unWrite = $write(lift)

	await fontsReady()

	if (!alive) return

	fit()

	window.addEventListener('resize', onResize)
	document.fonts?.addEventListener('loadingdone', onResize)
})

onBeforeUnmount(() => {
	alive = false

	cancelAnimationFrame(frame)
	window.removeEventListener('resize', onResize)
	document.fonts?.removeEventListener('loadingdone', onResize)
	unWrite?.()
	unReveal?.()
})
</script>
