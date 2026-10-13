<template>
	<section class="flex flex-col gap-30 pt-20 pb-40 s:pt-40 s:pb-80">
		<div class="flex flex-col gap-30 px-20 s:px-120">
			<div class="flex items-center gap-40">
				<gl-text tag="span" class="shrink-0 font-mono text-12 leading-10 font-normal tracking-label uppercase">Culture</gl-text>

				<div class="bg-line h-px w-full" />
			</div>

			<div class="flex flex-col items-start justify-between gap-30 pb-40 s:flex-row">
				<gl-text
					tag="h2"
					class="shrink-0 text-50 leading-9 font-medium tracking-display s:text-80 s:leading-10"
				>Ping pong tables<br>and stuff.</gl-text>

				<div class="flex w-full max-w-[50rem] flex-col items-start gap-30 s:pt-5">
					<gl-text tag="p" class="text-ink/60 w-full pb-15 text-20 leading-125 tracking-lede capitalize">
						build brands with depth, dimension, and a point of view. Not just logos or guidelines, but full brand systems designed to help ambitious companies stand out, scale, and become instantly recognizable.
					</gl-text>

					<site-button label="Join the team" />
				</div>
			</div>
		</div>

		<div ref="frame" class="w-full">
			<div
				ref="area"
				class="w-full cursor-grab overflow-hidden will-change-transform select-none active:cursor-grabbing [&_img]:pointer-events-none"
			>
				<div class="flex flex-col gap-15">
					<culture-row ref="left" />
					<culture-row ref="right" />
				</div>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
import { Spring } from '@domgl/motion'
import { bindDrag } from '@domgl/motion/dom'

const LAG = 900
const LAG_MAX = 0.8

const DRIFT = 18

const FULL = 34

const PRESS = 0.35

const WARP = 0.16

const frame = useTemplateRef<HTMLElement>('frame')
const area = useTemplateRef<HTMLElement>('area')
const left = useTemplateRef<{ write: (x: number) => void }>('left')
const right = useTemplateRef<{ write: (x: number) => void }>('right')

const { $write } = useNuxtApp()

const drag = new Spring(0, { response: 0.4, dampingRatio: 1 })

const open = new Spring(0, { response: 0.25, dampingRatio: 1 })

let pressed = false

let idle = 0
let last = 0

let visible = false

const paint = () => {
	const x = idle + drag.value

	left.value?.write(x)
	right.value?.write(-x)

	const speed = Math.abs(x - last)
	last = x

	open.setTarget(Math.max(pressed ? PRESS : 0, Math.min(1, speed / FULL)))

	area.value?.style.setProperty('--gl-hover', `${open.value}`)
	area.value?.style.setProperty('--gl-warp', `${open.value * WARP}`)
}

const lag = () => {
	const box = frame.value
	const el = area.value
	if (!box || !el) return

	const vh = window.innerHeight
	const cap = Math.min(LAG, vh * LAG_MAX)

	const b = box.getBoundingClientRect()

	const p = Math.max(0, Math.min(1, (vh - b.top) / (b.height + vh + cap)))

	el.style.transform = `translate3d(0, ${p * p * cap}px, 0)`
}

const onWrite = (ratio: number) => {
	if (!visible) return

	lag()

	const dt = Math.max(ratio, 0.25) / 60

	idle += DRIFT * dt
	if (!drag.sleeping) drag.step(dt)
	if (!open.sleeping) open.step(dt)

	paint()
}

const onPress = () => { pressed = true }
const onRelease = () => { pressed = false }

let release: (() => void) | null = null
let unWrite: (() => void) | null = null
let io: IntersectionObserver | null = null

onMounted(async () => {
	await nextTick()

	paint()

	if (area.value) {
		release = bindDrag(area.value, { x: drag, lock: true })

		area.value.addEventListener('pointerdown', onPress)
		window.addEventListener('pointerup', onRelease)
		window.addEventListener('pointercancel', onRelease)

		io = new IntersectionObserver(([e]) => { visible = !!e?.isIntersecting }, { rootMargin: '50% 0px' })
		io.observe(area.value)
	}

	unWrite = $write(onWrite)
})

onBeforeUnmount(() => {
	release?.()
	unWrite?.()
	io?.disconnect()
	area.value?.removeEventListener('pointerdown', onPress)
	window.removeEventListener('pointerup', onRelease)
	window.removeEventListener('pointercancel', onRelease)
})
</script>
