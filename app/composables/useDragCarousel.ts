type Options = {
	count: MaybeRefOrGetter<number>
	step: MaybeRefOrGetter<number>
	onMotion?: (u: number) => void
}

const FLICK = 4

const SETTLED = 0.005

const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.min(1, t)

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)

export const useDragCarousel = (options: Options) => {
	const { $write } = useNuxtApp()

	const el = useTemplateRef<HTMLElement>('drag')

	const u = ref(0)

	const wrap = (i: number) => {
		const n = toValue(options.count)

		return ((Math.round(i) % n) + n) % n
	}

	const target = ref(0)

	const index = computed(() => wrap(u.value))

	const active = ref(false)

	let t = 0
	let tc = 0

	let ox = 0
	let cx = 0
	let ot = 0

	let vx = 0
	let lx = 0

	let speed = 2

	const visible = ref(false)

	const step = () => Math.max(1, toValue(options.step))

	const aim = () => { target.value = wrap(t / step()) }

	const down = (e: PointerEvent) => {
		active.value = true

		cx = e.clientX
		lx = e.clientX
		vx = 0

		ot = t
		ox = t + e.clientX * speed
	}

	const move = (e: PointerEvent) => {
		if (!active.value) return

		vx = lerp(vx, e.clientX - lx, 0.3)
		lx = e.clientX

		t = ox - e.clientX * speed

		aim()
	}

	const up = (e: PointerEvent) => {
		if (!active.value) return
		active.value = false

		if (Math.abs(e.clientX - cx) < 10) {
			t = ot
			aim()
			return
		}

		snap()
	}

	const snap = () => {
		const at = tc / step()

		const dir = vx < 0 ? 1 : -1

		const to = Math.abs(vx) > FLICK
			? (dir > 0 ? Math.floor(at) + 1 : Math.ceil(at) - 1)
			: Math.round(at)

		t = to * step()
		aim()
	}

	const next = () => { t += step(); aim() }
	const previous = () => { t -= step(); aim() }

	const onWrite = (ratio: number) => {
		if (!visible.value) return

		const to = lerp(tc, t, 0.1 * ratio)

		tc = Math.round(to * 100) / 100

		const at = tc / step()

		if (!active.value && Math.abs(at - Math.round(at)) > SETTLED && Math.abs(t - tc) < 0.05) {
			t = Math.round(at) * step()
			aim()
		}

		if (at === u.value) return

		u.value = at
		options.onMotion?.(at)
	}

	let unWrite: (() => void) | null = null
	let io: IntersectionObserver | null = null

	onMounted(() => {
		if (!el.value) return

		speed = window.matchMedia('(width < 650px)').matches ? 3.5 : 2

		el.value.addEventListener('pointerdown', down)
		el.value.addEventListener('pointermove', move)

		window.addEventListener('pointerup', up)
		window.addEventListener('pointercancel', up)

		io = new IntersectionObserver(([entry]) => { visible.value = !!entry?.isIntersecting })
		io.observe(el.value)

		unWrite = $write(onWrite)
	})

	onBeforeUnmount(() => {
		el.value?.removeEventListener('pointerdown', down)
		el.value?.removeEventListener('pointermove', move)

		window.removeEventListener('pointerup', up)
		window.removeEventListener('pointercancel', up)

		io?.disconnect()
		unWrite?.()
	})

	return { el, u, index, target, active, visible, next, previous }
}
