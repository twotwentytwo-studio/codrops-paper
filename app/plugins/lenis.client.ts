import Lenis from 'lenis'

declare module '#app' {
	interface NuxtApp {
		$mouse: boolean
		$scroller: () => HTMLElement | null
		$scrollY: () => number
		$velocity: () => number
		$tick: (fn: (ratio: number) => void) => () => void
		$write: (fn: (ratio: number) => void) => () => void
		$scrollTo: (target: HTMLElement | 'bottom') => void
	}
}

const POINTER = '(hover: hover) and (pointer: fine)'

const MAX_RATIO = 4

export default defineNuxtPlugin({
	name: 'lenis',

	setup() {
		const html = document.documentElement

		if (!html.classList.contains('mouse') && !html.classList.contains('touch')) {
			html.classList.add(window.matchMedia(POINTER).matches ? 'mouse' : 'touch')
		}

		const mouse = html.classList.contains('mouse')

		const lenis = mouse ? new Lenis({ lerp: 0.11 }) : null

		if (lenis) (lenis as unknown as { updateClassName: () => void }).updateClassName = () => {}

		let root: HTMLElement | null = null

		const scroller = () => {
			if (mouse) return document.scrollingElement as HTMLElement | null

			root ??= document.querySelector<HTMLElement>('.scroll-root')
			return root
		}

		const scrollY = () => (lenis ? lenis.scroll : scroller()?.scrollTop ?? 0)

		const scrollTo = (target: HTMLElement | 'bottom') => {
			if (lenis) {
				lenis.scrollTo(target, { duration: 1, easing: snappy })
				return
			}

			const root = scroller()
			if (!root) return

			if (target === 'bottom') root.scrollTo({ top: root.scrollHeight, behavior: 'smooth' })
			else target.scrollIntoView({ behavior: 'smooth', block: 'start' })
		}

		const writers = new Set<(ratio: number) => void>()
		const listeners = new Set<(ratio: number) => void>()

		let prev = 0

		const frame = (time: number) => {
			requestAnimationFrame(frame)

			const ratio = prev ? Math.min((time - prev) / (1000 / 60), MAX_RATIO) : 1
			prev = time

			lenis?.raf(time)

			for (const fn of writers) fn(ratio)
			for (const fn of listeners) fn(ratio)
		}

		requestAnimationFrame(frame)

		return {
			provide: {
				mouse,
				scroller,
				scrollY,
				scrollTo,
				velocity: () => lenis?.velocity ?? 0,
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
