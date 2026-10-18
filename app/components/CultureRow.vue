<template>
	<div ref="track" class="flex h-180 w-max shrink-0 gap-15 will-change-transform s:h-250">
		<div
			v-for="(cell, i) in cells"
			:key="i"
			class="relative h-full w-auto shrink-0"
			:class="cell.ratio"
		>
			<gl-media :src="cell.src" material="lens" alt="" />
		</div>
	</div>
</template>

<script setup lang="ts">
const SET = [
	{ src: 'culture-01', ratio: 'aspect-square' },
	{ src: 'culture-02', ratio: 'aspect-[6/5]' },
	{ src: 'culture-03', ratio: 'aspect-[2/3]' },
]

const props = defineProps<{ sets?: number }>()

const cells = computed(() => Array.from({ length: props.sets ?? 5 }, () => SET).flat())

const track = useTemplateRef<HTMLElement>('track')

const span = () => {
	const kids = track.value?.children
	if (!kids || kids.length <= SET.length) return 0

	return (kids[SET.length] as HTMLElement).offsetLeft - (kids[0] as HTMLElement).offsetLeft
}

const write = (x: number) => {
	const el = track.value
	if (!el) return

	const w = span()
	const wrapped = w > 0 ? (((x % w) + w) % w) - w : x

	el.style.transform = `translate3d(${wrapped}px, 0, 0)`
}

defineExpose({ write })
</script>
