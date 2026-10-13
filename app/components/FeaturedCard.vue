<template>
	<article class="group card flex flex-col gap-10">
		<div
			class="relative overflow-hidden transition-[--gl-hover] duration-350 ease-out group-hover:[--gl-hover:1]"
			:class="square ? 'aspect-square' : 'aspect-[9/8]'"
		>
			<gl-media :src="src" material="lens" alt="" />

			<div class="rise absolute inset-x-0 bottom-0 p-15">
				<div class="relative flex items-center justify-between gap-15 py-10 pr-10 pl-15">
					<div class="plate absolute bg-white" />
					<span class="shift-in relative text-16 leading-12 font-medium tracking-body text-black">{{ title }}</span>
					<span class="shift-out relative flex size-20 shrink-0 items-center justify-center bg-black text-16 leading-12 font-medium tracking-body text-white">+</span>
				</div>
			</div>
		</div>

		<div class="overflow-hidden">
			<div class="fall flex items-center justify-between gap-15">
				<span class="shift-in text-16 leading-12 font-medium tracking-body text-white">{{ title }}</span>
				<span class="shift-out flex size-20 shrink-0 items-center justify-center bg-white text-16 leading-12 font-medium tracking-body text-black">+</span>
			</div>
		</div>
	</article>
</template>

<script setup lang="ts">
defineProps<{
	src: string
	title: string
	square?: boolean
}>()
</script>

<style scoped>
.card {
	--open: 0;
	--travel: 5.5rem;
	--gutter: 1.5rem;
	--pad: 1rem;
	--shift-in: 3rem;
	--shift-out: 2.5rem;

	transition: --open 700ms var(--ease-expo);
}

.card:hover {
	--open: 1;
}

.rise {
	transform: translateY(calc((1 - var(--open)) * var(--travel)));
}

.fall {
	transform: translateY(calc(var(--open) * var(--travel) * -1));
}

.plate {
	left: calc((var(--open) - 1) * var(--gutter));
	right: calc((var(--open) - 1) * var(--gutter));
	top: calc((1 - var(--open)) * var(--pad));
	bottom: calc((1 - var(--open)) * var(--pad));
}

.shift-in {
	transform: translateX(calc((var(--open) - 1) * var(--shift-in)));
}

.shift-out {
	transform: translateX(calc((1 - var(--open)) * var(--shift-out)));
}

.fall .shift-in {
	transform: translateX(calc(var(--open) * var(--shift-in)));
}

.fall .shift-out {
	transform: translateX(calc(var(--open) * var(--shift-out) * -1));
}
</style>
