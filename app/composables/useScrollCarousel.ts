type Options = {
	ease?: number
	speed?: number
	snap?: boolean
	track?: boolean
	loop?: boolean
	paged?: boolean
	resistance?: number
	threshold?: number
	count?: number
	onMotion?: (diff: number, velocity: number, ratio: number) => void
}

const clamp = (min: number, max: number, v: number) => Math.min(max, Math.max(min, v))

const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp(0, 1, t)

export function useScrollCarousel(options: Options = {}) {
	const {
		ease = 0.125,
		speed = 1.5,
		snap = true,
		track = false,
		loop = false,
		paged = false,
		resistance = 1,
		threshold = 0.5,
		count = 0,
		onMotion,
	} = options

	const { $write } = useNuxtApp()

	const el = ref<HTMLElement | null>(null)

	const index = ref(0)
	const copies = ref(loop ? 2 : 1)

	const mouse = ref(false)

	let active = false
	let running = false
	let dragged = false
	let committed = false

	let startX = 0
	let startScroll = 0
	let target = 0

	let pos = 0

	let needsIndex = false
	let setWidth = 0

	let last = 0
	let velocity = 0

	let inView = false
	let io: IntersectionObserver | null = null

	const maxScroll = (s: HTMLElement) => s.scrollWidth - s.clientWidth

	const restoreSnap = () => {
		if (el.value) el.value.style.scrollSnapType = ''
	}

	const padLeft = (s: HTMLElement) => {
		const cs = getComputedStyle(s)
		const v = parseFloat(cs.scrollPaddingLeft)

		return Number.isNaN(v) ? parseFloat(cs.paddingLeft) || 0 : v
	}

	const positions = (s: HTMLElement) => {
		const pad = padLeft(s)
		const left = s.getBoundingClientRect().left
		const base = s.scrollLeft
		const max = maxScroll(s)

		return Array.from(s.children).map((child) =>
			clamp(0, max, base + ((child as HTMLElement).getBoundingClientRect().left - left) - pad),
		)
	}

	const nearestSnap = (s: HTMLElement, to: number) => {
		let best = to
		let dist = Infinity

		positions(s).forEach((p) => {
			const d = Math.abs(p - to)
			if (d < dist) { dist = d; best = p }
		})

		return best
	}

	const neighborSnap = (s: HTMLElement, from: number, dir: 1 | -1) => {
		let best = from
		let dist = Infinity

		positions(s).forEach((p) => {
			const d = (p - from) * dir
			if (d > 0.5 && d < dist) { dist = d; best = p }
		})

		return best
	}

	const down = (e: PointerEvent) => {
		const s = el.value
		if (!s) return

		if (!loop && !paged && e.pointerType !== 'mouse') return

		const from = running ? target : s.scrollLeft

		active = true
		running = true
		dragged = false
		committed = false

		pos = s.scrollLeft

		startX = e.clientX
		startScroll = s.scrollLeft
		target = s.scrollLeft

		if (paged) {
			startScroll = nearestSnap(s, from)
			target = startScroll
		}

		s.style.scrollSnapType = 'none'
		s.setPointerCapture(e.pointerId)
	}

	const move = (e: PointerEvent) => {
		const s = el.value
		if (!active || !s) return

		if (paged) {
			if (committed) return

			const dx = (e.clientX - startX) * resistance
			if (Math.abs(dx) > 3) dragged = true

			const dest = neighborSnap(s, startScroll, dx < 0 ? 1 : -1)
			const dist = Math.abs(dest - startScroll)

			if (dist > 0 && Math.abs(dx) > dist * threshold) {
				committed = true
				target = dest

				return
			}

			target = clamp(
				neighborSnap(s, startScroll, -1),
				neighborSnap(s, startScroll, 1),
				startScroll - dx,
			)

			return
		}

		const dx = (e.clientX - startX) * speed
		if (Math.abs(dx) > 3) dragged = true

		target = clamp(0, maxScroll(s), startScroll - dx)
	}

	const up = (e: PointerEvent) => {
		const s = el.value
		if (!active || !s) return

		active = false

		try { s.releasePointerCapture(e.pointerId) } catch {}

		if (paged) {
			if (!committed) target = startScroll

			return
		}

		if (snap) target = nearestSnap(s, target)
	}

	const click = (e: MouseEvent) => {
		if (!dragged) return

		e.preventDefault()
		e.stopPropagation()
		dragged = false
	}

	const measure = () => {
		const s = el.value
		if (!s || !loop || !count) return

		const first = s.children[0] as HTMLElement | undefined
		const boundary = s.children[count] as HTMLElement | undefined
		if (!first || !boundary) return

		const w = boundary.offsetLeft - first.offsetLeft
		if (w <= 0) return

		setWidth = w
		copies.value = Math.max(3, Math.ceil(s.clientWidth / w) + 2)
	}

	const recenter = () => {
		const s = el.value
		if (!s || !loop || !setWidth) return

		s.scrollLeft = setWidth
		target = setWidth
		pos = setWidth
		last = setWidth
	}

	const shift = (s: HTMLElement, delta: number) => {
		s.scrollLeft += delta
		target += delta
		startScroll += delta
		pos += delta
		last += delta
	}

	const wrap = (s: HTMLElement) => {
		if (!loop || !setWidth) return

		if (s.scrollLeft < setWidth) shift(s, setWidth)
		else if (s.scrollLeft >= 2 * setWidth) shift(s, -setWidth)
	}

	const scroll = () => {
		needsIndex = true

		const s = el.value
		if (s) wrap(s)
	}

	const readIndex = (s: HTMLElement) => {
		const pad = padLeft(s)
		let best = 0
		let dist = Infinity

		Array.from(s.children).forEach((child, i) => {
			const d = Math.abs((child as HTMLElement).offsetLeft - pad - s.scrollLeft)
			if (d < dist) { dist = d; best = i }
		})

		index.value = loop && count ? best % count : best
	}

	const tick = (ratio: number) => {
		const s = el.value
		if (!s) return

		if (!inView) return

		if (running) {
			const direct = paged && active && !committed

			pos = direct ? target : lerp(pos, target, ease * ratio)
			s.scrollLeft = pos

			if (!active && Math.abs(pos - target) < 0.5) {
				pos = target
				s.scrollLeft = target
				running = false
				restoreSnap()
			}
		}

		if (needsIndex) {
			needsIndex = false
			readIndex(s)
		}

		const diff = s.scrollLeft - last
		last = s.scrollLeft
		velocity = lerp(velocity, diff, 0.15 * ratio)

		onMotion?.(diff, velocity, ratio)
	}

	const to = (i: number) => {
		const s = el.value
		if (!s) return

		if (loop && count && setWidth) {
			const wrapped = ((i % count) + count) % count
			const child = s.children[wrapped] as HTMLElement | undefined
			if (!child) return

			const at = child.offsetLeft - padLeft(s)
			const cur = running ? target : s.scrollLeft
			const dir = Math.sign(i - index.value)
			const steps = (cur - at) / setWidth

			const k = dir > 0
				? Math.floor(steps + 0.001) + 1
				: dir < 0
					? Math.ceil(steps - 0.001) - 1
					: Math.round(steps)

			target = at + k * setWidth
		} else {
			const child = s.children[i] as HTMLElement | undefined
			if (!child) return

			target = clamp(0, maxScroll(s), child.offsetLeft - padLeft(s))
		}

		if (!running) pos = s.scrollLeft

		running = true
		s.style.scrollSnapType = 'none'
	}

	let unTick: (() => void) | null = null
	let media: MediaQueryList | null = null

	const onMedia = () => { mouse.value = !!media?.matches }

	onMounted(() => {
		const s = el.value
		if (!s) return

		unTick = $write(tick)

		io = new IntersectionObserver(([e]) => { inView = !!e?.isIntersecting }, { rootMargin: '25% 0px' })
		io.observe(s)

		media = window.matchMedia('(hover: hover) and (pointer: fine)')
		onMedia()
		media.addEventListener('change', onMedia)

		if (track || loop) s.addEventListener('scroll', scroll, { passive: true })

		if (loop) {
			window.addEventListener('resize', measure)
			measure()
			recenter()
		}
	})

	onBeforeUnmount(() => {
		const s = el.value

		unTick?.()
		io?.disconnect()
		media?.removeEventListener('change', onMedia)

		if (s && (track || loop)) s.removeEventListener('scroll', scroll)
		if (loop) window.removeEventListener('resize', measure)
	})

	return {
		el,
		index,
		copies,
		to,
		draggable: computed(() => loop || paged || mouse.value),
		handlers: {
			onPointerdown: down,
			onPointermove: move,
			onPointerup: up,
			onPointercancel: up,
			onClickCapture: click,
			onDragstart: (e: DragEvent) => e.preventDefault(),
		},
	}
}
