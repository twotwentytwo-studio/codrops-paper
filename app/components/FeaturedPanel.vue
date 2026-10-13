<template>
	<div ref="slot" class="w-full touch:hidden" :style="{ height: height ? `${height}px` : undefined }" />

	<div
		ref="panel"
		class="fixed top-0 left-0 z-0 h-0 w-0 overflow-hidden touch:relative touch:h-auto touch:w-full touch:overflow-visible"
	>
		<gl-solid class="pointer-events-none absolute inset-0 bg-black" />

		<div ref="world" class="absolute top-0 left-0 h-screen w-screen touch:static touch:h-auto touch:w-auto">
			<div ref="content" class="absolute inset-x-0 top-0 flex flex-col gap-40 pt-80 pb-20 text-white touch:static s:gap-80 s:pt-160 s:pb-40">
				<site-marquee text="Featured projects" />
				<featured-grid />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
const props = defineProps<{ from: HTMLElement | null }>()

const { $mouse } = useNuxtApp()

const mouse = $mouse ?? true

watch(() => props.from, (el, was) => {
	if (was) unwatchSlot(was)
	if (el) watchSlot(el)

	void measure()
})

const slotWatched = (el: HTMLElement) => [el, el.parentElement, ...(el.parentElement ? [...el.parentElement.children] : [])]
	.filter((n, i, all): n is HTMLElement => n instanceof HTMLElement && all.indexOf(n) === i)

const watchSlot = (el: HTMLElement) => { for (const n of slotWatched(el)) ro?.observe(n) }
const unwatchSlot = (el: HTMLElement) => { for (const n of slotWatched(el)) ro?.unobserve(n) }

const slot = useTemplateRef<HTMLElement>('slot')
const panel = useTemplateRef<HTMLElement>('panel')
const world = useTemplateRef<HTMLElement>('world')
const content = useTemplateRef<HTMLElement>('content')

const { $write, $scrollY } = useNuxtApp()

const height = ref(0)

let last = Number.NaN

let from = { x: 0, y: 0, w: 0, h: 0 }
let to = { x: 0, y: 0, w: 0, h: 0 }

const box = { x: 0, y: 0, w: 0, h: 0 }

const docRect = (el: HTMLElement) => {
	const r = el.getBoundingClientRect()

	return { x: r.left, y: r.top + $scrollY(), w: r.width, h: r.height }
}

const measure = async () => {
	if (!mouse || !props.from || !slot.value || !content.value) return

	height.value = content.value.offsetHeight

	await nextTick()

	from = docRect(props.from)
	to = docRect(slot.value)

	last = Number.NaN
}

const write = (scroll: number) => {
	if (!panel.value || !world.value || !content.value) return

	const x = box.x
	const y = box.y - scroll

	panel.value.style.transform = `translate3d(${x}px, ${y}px, 0)`
	panel.value.style.width = `${box.w}px`
	panel.value.style.height = `${box.h}px`

	world.value.style.transform = `translate3d(${-x}px, ${-y}px, 0)`

	content.value.style.transform = `translate3d(0, ${to.y - scroll}px, 0)`
}

const onTick = () => {
	const scroll = $scrollY()

	if (scroll === last) return

	last = scroll

	const p = to.y > 0 ? Math.min(1, Math.max(0, scroll / to.y)) : 0

	box.x = from.x + (to.x - from.x) * p
	box.y = from.y + (to.y - from.y) * p
	box.w = from.w + (to.w - from.w) * p
	box.h = from.h + (to.h - from.h) * p

	write(scroll)
}

let unTick: (() => void) | null = null
let ro: ResizeObserver | null = null

onMounted(async () => {
	if (!mouse) return

	await nextTick()
	await measure()

	onTick()

	unTick = $write(onTick)

	ro = new ResizeObserver(() => { void measure() })

	if (content.value) ro.observe(content.value)
	if (props.from) watchSlot(props.from)

	document.fonts.addEventListener('loadingdone', onFonts)
	void document.fonts.ready.then(onFonts)

	window.addEventListener('resize', onResize)
})

const onFonts = () => {
	void measure()
}

const onResize = () => {
	void measure()
	last = Number.NaN
}

onBeforeUnmount(() => {
	unTick?.()
	ro?.disconnect()
	document.fonts.removeEventListener('loadingdone', onFonts)
	window.removeEventListener('resize', onResize)
})
</script>
