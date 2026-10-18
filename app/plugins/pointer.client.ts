import { Spring } from '@domgl/motion'

type Hand = { x: number; y: number; pull: number }

declare module '#app' {
	interface NuxtApp {
		$hand: () => Readonly<Hand>
	}
}

export default defineNuxtPlugin({
	name: 'pointer',
	dependsOn: ['lenis'],

	setup(nuxtApp) {
		const HAND = { response: 0.28, dampingRatio: 1 }

		const x = new Spring(0, HAND)
		const y = new Spring(0, HAND)
		const pull = new Spring(0, { response: 0.35, dampingRatio: 1 })

		const hand: Hand = { x: 0, y: 0, pull: 0 }

		let primed = false

		const onMove = (e: PointerEvent) => {
			if (e.pointerType !== 'mouse') return

			if (!primed) {
				x.snap(e.clientX)
				y.snap(e.clientY)
				primed = true
			}

			x.setTarget(e.clientX)
			y.setTarget(e.clientY)
			pull.setTarget(1)
		}

		const onLeave = () => pull.setTarget(0)

		const onWrite = (ratio: number) => {
			if (x.sleeping && y.sleeping && pull.sleeping) return

			const dt = Math.max(ratio, 0.25) / 60

			x.step(dt)
			y.step(dt)
			pull.step(dt)

			hand.x = x.value
			hand.y = y.value
			hand.pull = pull.value
		}

		window.addEventListener('pointermove', onMove, { passive: true })
		document.documentElement.addEventListener('pointerleave', onLeave)

		nuxtApp.$write(onWrite)

		return {
			provide: {
				hand: () => hand as Readonly<Hand>,
			},
		}
	},
})
