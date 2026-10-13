<template>
	<div
		ref="slot"
		class="relative -mt-px h-300 w-full gpu:bg-transparent"
		:class="to === 'dark' ? 'bg-ground' : to === 'light' ? 'bg-black' : ''"
	>
		<gl-solid
			v-if="near"
			class="absolute inset-0 [--gl-seam-cell:0.8rem] [--gl-seam-noise:0.18]"
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

const near = ref(false)

let io: IntersectionObserver | null = null

onMounted(() => {
	if (!slot.value) return

	io = new IntersectionObserver(([e]) => { near.value = !!e?.isIntersecting }, { rootMargin: '100% 0px' })
	io.observe(slot.value)
})

onBeforeUnmount(() => io?.disconnect())
</script>
