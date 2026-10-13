<template><span data-site-paper hidden /></template>

<script setup lang="ts">
import { PaperPost } from '~/gl/paperPost'

const gl = useDomGl()

const { $scrollY } = useNuxtApp()

let post: PaperPost | null = null
let stop: (() => void) | null = null

onMounted(() => {
	stop = watch(gl, (ctx) => {
		if (!ctx || post) return

		const core = ctx.gl.core as unknown as ConstructorParameters<typeof PaperPost>[0] & { post: unknown }

		post = new PaperPost(core, $scrollY)
		core.post = post
	}, { immediate: true })
})

onBeforeUnmount(() => {
	stop?.()

	const core = gl.value?.gl.core as unknown as { post: unknown } | undefined

	if (core && core.post === post) core.post = null

	post?.reset()
	post = null
})
</script>
