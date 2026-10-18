<template>
	<div
		ref="slot"
		class="relative -mt-px h-300 w-full gpu:bg-transparent"
		:class="to === 'dark' ? 'bg-ground' : to === 'light' ? 'bg-black' : ''"
	>
		<gl-solid
			v-if="near"
			class="absolute inset-0 [--gl-seam-noise:0.18]"
			:class="{
				'bg-ground [--gl-seam-light:var(--color-black)]': to === 'dark',
				'bg-black [--gl-seam-light:var(--color-ground)]': to === 'light',
				'bg-ground [--gl-seam-light:var(--color-ground)] [--gl-seam-stroke:var(--color-ink)] [--gl-seam-mask:1]': to === 'rule',
			}"
			material="seam"
		/>
	</div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
	to?: 'light' | 'dark' | 'rule'
}>(), { to: 'light' })

const slot = useTemplateRef<HTMLElement>('slot')

const { $write, $hand, $mouse, $scroller } = useNuxtApp()

const near = ref(false)

const last = { x: Number.NaN, y: Number.NaN, pull: Number.NaN }

const follow = () => {
	const el = slot.value
	if (!near.value || !el) return

	const hand = $hand()
	if (hand.x === last.x && hand.y === last.y && hand.pull === last.pull) return

	last.x = hand.x
	last.y = hand.y
	last.pull = hand.pull

	el.style.setProperty('--gl-px', `${hand.x}px`)
	el.style.setProperty('--gl-py', `${hand.y}px`)
	el.style.setProperty('--gl-pull', `${hand.pull}`)
}

let io: IntersectionObserver | null = null
let unWrite: (() => void) | null = null

onMounted(() => {
	if (!slot.value) return

	io = new IntersectionObserver(([e]) => { near.value = !!e?.isIntersecting }, {
		root: $mouse ? null : $scroller(),
		rootMargin: '100% 0px',
	})
	io.observe(slot.value)

	unWrite = $write(follow)
})

onBeforeUnmount(() => {
	io?.disconnect()
	unWrite?.()
})
</script>
