<template>
	<div>
		<div ref="viewport" class="w-full overflow-hidden">
			<div ref="track" class="flex w-max items-center gap-80 pl-20 s:pl-120">
				<template v-for="i in COPIES" :key="i">
					<gl-text
						tag="span"
						:reveal="false"
						class="shrink-0 text-50 leading-9 font-medium tracking-display whitespace-nowrap capitalize s:text-80 s:leading-10"
					>{{ text }}</gl-text>

					<gl-solid class="size-10 shrink-0 bg-current" />
				</template>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
defineProps<{ text: string }>()

const SPEED = 0.055

const COPIES = 5

const viewport = useTemplateRef<HTMLElement>('viewport')
const track = useTemplateRef<HTMLElement>('track')

const { $write, $mouse, $scroller } = useNuxtApp()

let unit = 0
let offset = 0

let visible = false

const measure = () => {
	const kids = track.value?.children
	if (!kids || kids.length < 3) return

	unit = (kids[2] as HTMLElement).offsetLeft - (kids[0] as HTMLElement).offsetLeft
	if (unit > 0) offset %= unit
}

const write = () => {
	if (!track.value) return

	track.value.style.transform = `translate3d(${offset}px, 0, 0)`
}

const onTick = (ratio: number) => {
	if (!visible || unit <= 0) return

	offset -= unit * SPEED * (Math.max(ratio, 0.25) / 60)

	offset %= unit

	write()
}

let unTick: (() => void) | null = null
let io: IntersectionObserver | null = null
let ro: ResizeObserver | null = null

onMounted(async () => {
	await nextTick()

	measure()
	write()

	unTick = $write(onTick)

	if (track.value) {
		ro = new ResizeObserver(() => {
			measure()
			write()
		})
		ro.observe(track.value)
	}

	if (viewport.value) {
		io = new IntersectionObserver(([e]) => { visible = !!e?.isIntersecting }, {
			root: $mouse ? null : $scroller(),
			rootMargin: '100px',
		})
		io.observe(viewport.value)
	}
})

onBeforeUnmount(() => {
	unTick?.()
	io?.disconnect()
	ro?.disconnect()
})
</script>
