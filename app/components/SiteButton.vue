<template>
	<component
		:is="to ? 'a' : 'button'"
		:href="to"
		:type="to ? undefined : 'button'"
		class="btn relative flex h-40 w-fit shrink-0 items-center justify-center gap-60 overflow-hidden bg-black px-15"
	>
		<span class="font-mono text-12 leading-10 font-normal tracking-label uppercase text-white">{{ label }}</span>

		<span class="glyph flex size-15 shrink-0 items-center justify-center font-mono text-12 leading-10 font-normal tracking-label uppercase text-black">+</span>

		<span class="face absolute inset-0 bg-white" aria-hidden="true">
			<span class="rider absolute inset-0 flex items-center justify-center gap-60 px-15 text-black">
				<span class="font-mono text-12 leading-10 font-normal tracking-label uppercase">{{ label }}</span>
				<span class="glyph flex size-15 shrink-0 items-center justify-center font-mono text-12 leading-10 font-normal tracking-label uppercase">+</span>
			</span>
		</span>

		<span class="pointer-events-none absolute inset-0 border border-black" />
	</component>
</template>

<script setup lang="ts">
defineProps<{
	label: string
	to?: string
}>()
</script>

<style scoped>
.btn {
	--open: 0;

	--inset-x: 1.5rem;
	--inset-y: 1.25rem;

	--over: 0.3rem;

	--nudge: 0.47rem;

	--pivot: calc((1 - var(--open)) * (100% - 2.25rem) + var(--open) * 50%);

	transition: --open 700ms var(--ease-expo);
}

.btn:hover,
.btn:focus-visible {
	--open: 1;
}

.face {
	clip-path: inset(
		calc((1 - var(--open)) * var(--inset-y) - var(--open) * var(--over))
		calc((1 - var(--open)) * var(--inset-x) - var(--open) * var(--over))
		calc((1 - var(--open)) * var(--inset-y) - var(--open) * var(--over))
		calc((1 - var(--open)) * (100% - var(--inset-x) * 2) - var(--open) * var(--over))
	);
	transform: rotate(calc(var(--open) * 180deg));
	transform-origin: var(--pivot) 50%;
}

.rider {
	transform: rotate(calc(var(--open) * -180deg));
	transform-origin: var(--pivot) 50%;
}

.glyph {
	transform: translateX(calc(var(--open) * var(--nudge)));
}
</style>
