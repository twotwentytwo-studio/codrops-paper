<template>
	<nav class="fixed inset-x-0 top-0 z-10 flex justify-center p-20 text-black s:p-40">
		<div ref="bar" class="bar flex items-center justify-between">
			<span class="shrink-0 text-16 leading-12 font-medium tracking-body">
				PaperDrops<span class="stop">.</span>
			</span>

			<div class="flex items-center gap-20 s:gap-60">
				<div class="hidden items-start gap-30 s:flex">
					<a
						v-for="link in LINKS"
						:key="link"
						href="#"
						class="shrink-0 text-16 leading-12 font-medium tracking-body"
					>{{ link }}</a>
				</div>

				<site-button label="Get in touch" />
			</div>
		</div>
	</nav>
</template>

<script setup lang="ts">
import { Spring } from '@domgl/motion'

const LINKS = ['Projects', 'Culture', 'Contact']

const ON = 60
const OFF = 20

const bar = useTemplateRef<HTMLElement>('bar')

const { $write, $scrollY } = useNuxtApp()

const stick = new Spring(0, { response: 0.5, dampingRatio: 1 })

let stuck = false

let unWrite: (() => void) | null = null

onMounted(() => {
	unWrite = $write((ratio: number) => {
		const y = $scrollY()

		if (!stuck && y > ON) {
			stuck = true
			stick.setTarget(1)
		} else if (stuck && y < OFF) {
			stuck = false
			stick.setTarget(0)
		}

		if (stick.sleeping) return

		stick.step(Math.max(ratio, 0.25) / 60)

		bar.value?.style.setProperty('--stick', `${stick.value}`)
	})
})

onBeforeUnmount(() => unWrite?.())
</script>

<style scoped>
.bar {
	--wide: 100%;
	--tight: 80rem;

	--pad-x: 2rem;
	--pad-r: 1rem;
	--pad-y: 1rem;

	width: min(100%, calc(var(--wide) + var(--stick) * (var(--tight) - var(--wide))));

	padding-left: calc(var(--stick) * var(--pad-x));
	padding-right: calc(var(--stick) * var(--pad-r));
	padding-block: calc(var(--stick) * var(--pad-y));

	background-color: color-mix(in srgb, var(--color-raised) calc(var(--stick) * 100%), transparent);

	border: 1px solid color-mix(in srgb, var(--color-line) calc(var(--stick) * 100%), transparent);
}

.stop {
	opacity: var(--stick);
}
</style>
