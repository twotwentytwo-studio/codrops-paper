<template>
	<div ref="layer" class="pointer-events-none fixed inset-0 z-40 overflow-hidden contain-strict">
		<span class="sr-only" role="status">{{ said }}</span>
	</div>
</template>

<script setup lang="ts">
const LLAMA = '🦙'

const COUNT = 18

const SAMPLES = 24

const layer = useTemplateRef<HTMLElement>('layer')

const said = ref('')

let quiet = 0

const rand = (min: number, max: number) => min + Math.random() * (max - min)

const burst = (x: number, y: number) => {
	const box = layer.value
	if (!box) return

	const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
	const gravity = rem * 180

	for (let i = 0; i < COUNT; i++) {
		const angle = rand(-Math.PI * 0.95, -Math.PI * 0.05)
		const speed = rem * rand(25, 60)
		const vx = Math.cos(angle) * speed
		const vy = Math.sin(angle) * speed
		const spin = rand(-360, 360)
		const life = rand(0.9, 1.4)

		const frames: Keyframe[] = []

		for (let k = 0; k <= SAMPLES; k++) {
			const p = k / SAMPLES
			const t = p * life

			frames.push({
				transform: `translate(${x + vx * t}px, ${y + vy * t + 0.5 * gravity * t * t}px) translate(-50%, -50%) rotate(${spin * t}deg) scale(${Math.min(1, 0.3 + p * 5)})`,
				opacity: p < 0.65 ? 1 : 1 - (p - 0.65) / 0.35,
			})
		}

		const el = document.createElement('span')
		el.className = 'absolute top-0 left-0 leading-10 select-none'
		el.style.fontSize = `${rand(1.4, 2.4)}rem`
		el.setAttribute('aria-hidden', 'true')
		el.textContent = LLAMA

		box.appendChild(el)

		const remove = () => el.remove()
		el.animate(frames, { duration: life * 1000, easing: 'linear', fill: 'forwards' }).finished.then(remove, remove)
	}

	said.value = 'This is just a demo'

	clearTimeout(quiet)
	quiet = window.setTimeout(() => { said.value = '' }, 1500)
}

const onClick = (e: MouseEvent) => {
	const target = e.target instanceof Element ? e.target.closest('[data-dummy]') : null
	if (!target) return

	e.preventDefault()

	if (e.detail === 0) {
		const r = target.getBoundingClientRect()
		burst(r.left + r.width / 2, r.top + r.height / 2)
	} else {
		burst(e.clientX, e.clientY)
	}
}

onMounted(() => document.addEventListener('click', onClick))

onBeforeUnmount(() => {
	document.removeEventListener('click', onClick)
	clearTimeout(quiet)
})
</script>
