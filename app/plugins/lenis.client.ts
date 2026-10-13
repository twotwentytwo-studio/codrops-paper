import Lenis from 'lenis'

declare module '#app' {
	interface NuxtApp {
		$mouse: boolean
		$lenis: Lenis | null
		$scroller: () => HTMLElement | null
		$scrollY: () => number
		$velocity: () => number
		$tick: (fn: (ratio: number) => void) => () => void
		$write: (fn: (ratio: number) => void) => () => void
	}
}

export default defineNuxtPlugin({
	name: 'lenis',

	setup() {
		const mouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches

		const lenis = mouse ? new Lenis({ lerp: 0.11 }) : null

		let root: HTMLElement | null = null

		const scroller = () => {
			if (mouse) return document.scrollingElement as HTMLElement | null

			root ??= document.querySelector<HTMLElement>('.scroll-root')
			return root
		}

		const scrollY = () => (lenis ? lenis.scroll : scroller()?.scrollTop ?? 0)

		let last = 0
		let speed = 0

		const writers = new Set<(ratio: number) => void>()
		const listeners = new Set<(ratio: number) => void>()

		let prev = 0

		const frame = (time: number) => {
			requestAnimationFrame(frame)

			const ratio = prev ? (time - prev) / (1000 / 60) : 1
			prev = time

			if (lenis) lenis.raf(time)
			else {
				const y = scrollY()
				speed = y - last
				last = y
			}

			for (const fn of writers) fn(ratio)
			for (const fn of listeners) fn(ratio)
		}

		requestAnimationFrame(frame)

		return {
			provide: {
				mouse,
				lenis,
				scroller,
				scrollY,
				velocity: () => (lenis ? lenis.velocity : speed),
				tick: (fn: (ratio: number) => void) => {
					listeners.add(fn)
					return () => { listeners.delete(fn) }
				},
				write: (fn: (ratio: number) => void) => {
					writers.add(fn)
					return () => { writers.delete(fn) }
				},
			},
		}
	},
})
