import { Spring } from '@domgl/motion'

export default defineNuxtPlugin({
	name: 'pointer',
	dependsOn: ['lenis'],

	setup(nuxtApp) {
		const HAND = { response: 0.28, dampingRatio: 1 }

		const x = new Spring(0, HAND)
		const y = new Spring(0, HAND)
		const pull = new Spring(0, { response: 0.35, dampingRatio: 1 })

		let primed = false

		const root = document.documentElement

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

			root.style.setProperty('--gl-px', `${x.value}px`)
			root.style.setProperty('--gl-py', `${y.value}px`)
			root.style.setProperty('--gl-pull', `${pull.value}`)
		}

		window.addEventListener('pointermove', onMove, { passive: true })
		document.addEventListener('pointerleave', onLeave)

		nuxtApp.$write(onWrite)
	},
})
