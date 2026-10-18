<template>
	<div
		data-curtain
		class="curtain bg-ground pointer-events-none fixed inset-0 z-50 transition-opacity duration-350 ease-out"
		:class="[up ? 'opacity-0' : 'opacity-100', { armed }]"
		aria-hidden="true"
	/>
</template>

<script setup lang="ts">
const HOLD = 4000

const up = ref(false)

const armed = ref(false)

const gl = useDomGl()

const gated = () => document.documentElement.classList.contains('has-gpu')

const settled = async () => {
	await document.fonts?.ready

	if (document.readyState !== 'complete') {
		await new Promise<void>((done) => window.addEventListener('load', () => done(), { once: true }))
	}

	if (!gated()) return

	if (!gl.value) {
		await new Promise<void>((done) => {
			const stop = watch(gl, (v) => {
				if (!v) return

				stop()
				done()
			})
		})
	}

	await gl.value?.gl.ready

	await new Promise((f) => requestAnimationFrame(() => requestAnimationFrame(f)))
}

onMounted(() => {
	const lift = () => { up.value = true }

	armed.value = true

	if (performance.now() >= HOLD) return lift()

	const cap = setTimeout(lift, HOLD)

	void settled()
		.catch(() => {})
		.then(() => {
			clearTimeout(cap)
			lift()
		})
})
</script>

<style scoped>
.curtain:not(.armed) {
	animation: lift 0.35s ease-out 4s forwards;
}

@keyframes lift {
	to {
		opacity: 0;
		visibility: hidden;
	}
}
</style>
