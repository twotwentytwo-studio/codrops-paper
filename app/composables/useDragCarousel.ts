type Options = {
	count: MaybeRefOrGetter<number>
	step: MaybeRefOrGetter<number>
	onMotion?: (u: number) => void
}

const FLICK = 0.25

const STALE = 80

const CLICK = 10

const SETTLED = 1e-4

const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.min(1, t)

export const useDragCarousel = (options: Options) => {
	const { $write } = useNuxtApp()

	const el = useTemplateRef<HTMLElement>('drag')

	const u = ref(0)

	const target = ref(0)

	const active = ref(false)

	const visible = ref(false)

	const wrap = (i: number) => {
		const n = toValue(options.count)

		return ((Math.round(i) % n) + n) % n
	}

	let t = 0
	let tc = 0

	let id = -1
	let dragging = false

	let cx = 0
	let ox = 0
	let ot = 0

	let lx = 0
	let lt = 0
	let vx = 0

	let speed = 2

	const step = () => Math.max(1, toValue(options.step))

	const aim = () => { target.value = wrap(t) }

	const listen = () => {
		window.addEventListener('pointermove', move)
		window.addEventListener('pointerup', up)
		window.addEventListener('pointercancel', cancel)
	}

	const unlisten = () => {
		window.removeEventListener('pointermove', move)
		window.removeEventListener('pointerup', up)
		window.removeEventListener('pointercancel', cancel)
	}

	const down = (e: PointerEvent) => {
		if (active.value || !e.isPrimary || e.button !== 0) return

		active.value = true
		dragging = false
		id = e.pointerId

		speed = window.matchMedia('(width < 650px)').matches ? 3.5 : 2

		cx = e.clientX
		lx = e.clientX
		lt = e.timeStamp
		vx = 0

		ot = t
		ox = t + (e.clientX * speed) / step()

		listen()
	}

	const move = (e: PointerEvent) => {
		if (e.pointerId !== id) return

		const dt = e.timeStamp - lt
		if (dt > 0) vx = lerp(vx, (e.clientX - lx) / dt, 0.3)

		lx = e.clientX
		lt = e.timeStamp

		if (!dragging && Math.abs(e.clientX - cx) >= CLICK) {
			dragging = true

			try { el.value?.setPointerCapture(id) } catch {}
		}

		t = ox - (e.clientX * speed) / step()

		aim()
	}

	const end = () => {
		active.value = false
		id = -1

		unlisten()
	}

	const up = (e: PointerEvent) => {
		if (e.pointerId !== id) return

		end()

		if (Math.abs(e.clientX - cx) < CLICK) {
			t = ot
			aim()
			return
		}

		snap(e.timeStamp - lt < STALE ? vx : 0)
	}

	const cancel = (e: PointerEvent) => {
		if (e.pointerId !== id) return

		end()

		t = ot
		aim()
	}

	const snap = (v: number) => {
		const dir = v < 0 ? 1 : -1

		t = Math.abs(v) > FLICK
			? (dir > 0 ? Math.floor(tc) + 1 : Math.ceil(tc) - 1)
			: Math.round(tc)

		aim()
	}

	const next = () => { t += 1; aim() }
	const previous = () => { t -= 1; aim() }

	const onWrite = (ratio: number) => {
		if (!visible.value) return

		tc = Math.abs(t - tc) < SETTLED ? t : lerp(tc, t, 0.1 * ratio)

		if (tc === u.value) return

		u.value = tc
		options.onMotion?.(tc)
	}

	const noDrag = (e: DragEvent) => e.preventDefault()

	let unWrite: (() => void) | null = null
	let io: IntersectionObserver | null = null

	onMounted(() => {
		if (!el.value) return

		el.value.addEventListener('pointerdown', down)
		el.value.addEventListener('dragstart', noDrag)

		io = new IntersectionObserver(([entry]) => { visible.value = !!entry?.isIntersecting })
		io.observe(el.value)

		unWrite = $write(onWrite)
	})

	onBeforeUnmount(() => {
		el.value?.removeEventListener('pointerdown', down)
		el.value?.removeEventListener('dragstart', noDrag)

		unlisten()

		io?.disconnect()
		unWrite?.()
	})

	return { u, target, active, visible, next, previous }
}
