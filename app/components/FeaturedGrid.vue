<template>
	<div class="flex flex-col gap-60 px-20 s:gap-160 s:px-120">
		<div
			v-for="(row, r) in ROWS"
			:key="r"
			class="grid items-start gap-60 s:gap-120"
			:class="r === 0 ? 's:grid-cols-[1fr_0.85fr]' : 's:grid-cols-[0.85fr_1fr]'"
		>
			<featured-card
				v-for="(cell, j) in row"
				:key="j"
				:ref="(c) => setCard(r * 2 + j, c)"
				:src="cell.src"
				:title="cell.title"
				:square="cell.square"
				@pointermove="track(r * 2 + j, $event)"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { SpringSet } from '@domgl/motion'

const CELLS = [
	{ src: 'project-01', title: 'Project title', square: true },
	{ src: 'project-02', title: 'Project title', square: false },
	{ src: 'project-02', title: 'Project title', square: false },
	{ src: 'project-01', title: 'Project title', square: true },
]

const ROWS = [CELLS.slice(0, 2), CELLS.slice(2, 4)]

const SHIFT = 0.07

const cards: (HTMLElement | null)[] = CELLS.map(() => null)
const media: (HTMLElement | null)[] = CELLS.map(() => null)

const setCard = (i: number, c: unknown) => {
	const card = c as { $el?: HTMLElement; media?: HTMLElement | null } | null

	cards[i] = card?.$el ?? null
	media[i] = card?.media ?? null
}

const { $write } = useNuxtApp()

const drift = useParallax()

const pos = new SpringSet(CELLS.length, 2, { response: 0.25, dampingRatio: 1 })

const settling = CELLS.map(() => false)

const applied = CELLS.map(() => 0)

const onScreen = new Set<Element>()

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

const track = (i: number, e: PointerEvent) => {
	const el = media[i] ?? cards[i]
	if (!el) return

	const box = el.getBoundingClientRect()

	pos.setTargets(i, clamp01((e.clientX - box.left) / box.width), clamp01((e.clientY - box.top) / box.height))
}

const writeCard = (i: number) => {
	const el = cards[i]
	if (!el) return

	el.style.setProperty('--gl-mx', `${pos.get(i, 0)}`)
	el.style.setProperty('--gl-my', `${pos.get(i, 1)}`)
}

const parallax = () => {
	if (!drift.value) {
		for (let i = 0; i < CELLS.length; i++) {
			if (!applied[i]) continue

			applied[i] = 0
			const el = cards[i]
			if (el) el.style.transform = ''
		}

		return
	}

	if (!onScreen.size) return

	const vh = window.innerHeight

	for (let i = 0; i < CELLS.length; i++) {
		if (CELLS[i]!.square) continue

		const el = cards[i]
		if (!el) continue

		const box = el.getBoundingClientRect()

		const mid = box.top - applied[i]! + box.height * 0.5
		const p = Math.max(-1, Math.min(1, (mid - vh * 0.5) / ((vh + box.height) * 0.5)))

		applied[i] = p * vh * SHIFT
		el.style.transform = `translate3d(0, ${applied[i]!.toFixed(2)}px, 0)`
	}
}

let unWrite: (() => void) | null = null
let io: IntersectionObserver | null = null

onMounted(() => {
	for (let i = 0; i < CELLS.length; i++) pos.snap(i, 0.5, 0.5)

	io = new IntersectionObserver((es) => {
		for (const e of es) {
			if (e.isIntersecting) onScreen.add(e.target)
			else onScreen.delete(e.target)
		}
	}, { rootMargin: '25% 0px' })

	for (const el of cards) if (el) io.observe(el)

	unWrite = $write((ratio: number) => {
		parallax()

		if (!pos.active) return

		pos.step(Math.max(ratio, 0.25) / 60)

		for (let i = 0; i < CELLS.length; i++) {
			const awake = pos.awake[i] === 1

			if (awake || settling[i]) writeCard(i)

			settling[i] = awake
		}
	})
})

onBeforeUnmount(() => {
	unWrite?.()
	io?.disconnect()
})
</script>
