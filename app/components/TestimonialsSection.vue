<template>
	<section class="relative">
		<gl-solid class="bg-ground pointer-events-none absolute inset-x-0 top-300 bottom-0 -mt-px" />

		<seam-band to="rule" />

		<div class="relative flex flex-col gap-30 pt-40 pb-80 s:pt-80 s:pb-160">
			<div class="flex items-center gap-40 px-20 s:px-120">
				<gl-text tag="span" class="shrink-0 font-mono text-12 leading-10 font-normal tracking-label uppercase">Testimonials</gl-text>

				<div class="bg-line h-px w-full" />
			</div>

			<site-marquee text="Client Confessions" />

			<div class="mt-30 px-20 s:px-120">
				<article
					ref="drag"
					class="flex w-full touch-pan-y flex-col select-none s:h-550 s:flex-row has-hover:cursor-grab has-hover:active:cursor-grabbing"
				>
					<div ref="crop" class="relative aspect-[4/5] w-full shrink-0 overflow-hidden s:h-full s:w-auto">
						<gl-media
							v-for="(item, i) in QUOTES"
							:key="i"
							:ref="(el: unknown) => setFrame(i, el)"
							class="will-change-transform"
							material="slide"
							:src="item.image"
							:eager="i === 0"
							alt=""
						/>
					</div>

					<div class="bg-raised relative flex w-full flex-1 flex-col justify-between gap-60 p-20 gpu:bg-transparent s:h-full s:p-60">
						<gl-solid class="bg-raised pointer-events-none absolute inset-0" />

						<div class="flex items-center gap-30">
							<span class="w-50 shrink-0 font-mono text-12 leading-10 font-normal tracking-label uppercase tabular-nums">{{ counter }}</span>

							<div class="bg-line relative h-px w-full overflow-hidden">
								<div ref="fill" class="bg-ink absolute inset-y-0 left-0 w-full origin-left" />
								<div ref="flush" class="bg-ink absolute inset-y-0 left-0 w-full origin-right" />
							</div>

							<div class="flex shrink-0 items-center gap-10">
								<button
									type="button"
									class="bg-ink flex size-20 items-center justify-center text-raised transition-opacity duration-350 ease-out has-hover:cursor-pointer has-hover:hover:opacity-70"
									aria-label="Previous testimonial"
									@click="previous"
								>
									<svg viewBox="0 0 5 8" fill="none" stroke="currentColor" stroke-width="1.2" class="h-8 w-auto rotate-180">
										<path d="M1 1 4 4 1 7" />
									</svg>
								</button>

								<button
									type="button"
									class="bg-ink flex size-20 items-center justify-center text-raised transition-opacity duration-350 ease-out has-hover:cursor-pointer has-hover:hover:opacity-70"
									aria-label="Next testimonial"
									@click="next"
								>
									<svg viewBox="0 0 5 8" fill="none" stroke="currentColor" stroke-width="1.2" class="h-8 w-auto">
										<path d="M1 1 4 4 1 7" />
									</svg>
								</button>
							</div>
						</div>

						<div class="grid w-full items-end">
							<div
								v-for="(item, i) in QUOTES"
								:key="i"
								class="flex flex-col gap-30 [grid-area:1/1]"
							>
								<p
									:ref="(el: unknown) => setBlock(i, 0, el)"
									class="w-full max-w-[60rem] text-28 leading-12 font-medium text-pretty tracking-h2 text-ink capitalize"
								>{{ item.quote }}</p>

								<p
									:ref="(el: unknown) => setBlock(i, 1, el)"
									class="font-mono text-12 leading-10 font-normal tracking-label text-ink uppercase"
								>{{ item.name }}</p>
							</div>
						</div>
					</div>
				</article>
			</div>
		</div>
	</section>
</template>

<script setup lang="ts">
import { LamaSplit, type Line } from '@lama/split'

const QUOTES = [
	{
		quote: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. In elementum, sapien vel faucibus sollicitudin, arcu risus pharetra mauris, ornare feugiat eros diam non risus. Quisque fermentum dolor sapien, sed lacinia arcu gravida sit amet.',
		name: '- Bruce Lee, CEO',
		image: 'testimonial-01',
	},
	{
		quote: 'In elementum, sapien vel faucibus sollicitudin, arcu risus pharetra mauris, ornare feugiat eros diam non risus. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
		name: '- Grace Hopper, CTO',
		image: 'culture-01',
	},
	{
		quote: 'Quisque fermentum dolor sapien, sed lacinia arcu gravida sit amet. Lorem ipsum dolor sit amet, consectetur adipiscing elit. In elementum, sapien vel faucibus sollicitudin, arcu risus pharetra mauris, ornare feugiat eros diam non risus.',
		name: '- Ada Lovelace, Founder',
		image: 'project-01',
	},
	{
		quote: 'Arcu risus pharetra mauris, ornare feugiat eros diam non risus. Quisque fermentum dolor sapien, sed lacinia arcu gravida sit amet, consectetur adipiscing elit.',
		name: '- Alan Turing, Director',
		image: 'culture-02',
	},
	{
		quote: 'Sed lacinia arcu gravida sit amet. Lorem ipsum dolor sit amet, consectetur adipiscing elit. In elementum, sapien vel faucibus sollicitudin, arcu risus pharetra mauris, ornare feugiat eros diam non risus. Quisque fermentum dolor sapien.',
		name: '- Hedy Lamarr, Partner',
		image: 'project-02',
	},
	{
		quote: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ornare feugiat eros diam non risus, arcu risus pharetra mauris, sed lacinia arcu gravida sit amet.',
		name: '- Grace Jones, Head of Brand',
		image: 'culture-03',
	},
]

const IN = { at: 0.15, dur: 0.65, step: 0.075, from: 105 }
const OUT = { dur: 0.3 }

const power1Out = (t: number) => 1 - (1 - t) ** 2
const power2Out = (t: number) => 1 - (1 - t) ** 3

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

const dom = (el: unknown): HTMLElement | null => {
	const node = el && typeof el === 'object' && '$el' in el ? (el as { $el: unknown }).$el : el

	return node instanceof HTMLElement ? node : null
}

const fill = useTemplateRef<HTMLElement>('fill')
const flush = useTemplateRef<HTMLElement>('flush')
const crop = useTemplateRef<HTMLElement>('crop')

const blocks: (HTMLElement | null)[][] = QUOTES.map(() => [null, null])
const frames: (HTMLElement | null)[] = QUOTES.map(() => null)

const setBlock = (i: number, j: number, el: unknown) => { blocks[i]![j] = dom(el) }
const setFrame = (i: number, el: unknown) => { frames[i] = dom(el) }

let lines: Line[][] = []

let split: LamaSplit | null = null

type Phase = 'gone' | 'in' | 'out'

const phase: Phase[] = QUOTES.map((_, i) => (i === 0 ? 'in' : 'gone'))
const clock: number[] = QUOTES.map(() => 999)
const alpha: number[] = QUOTES.map((_, i) => (i === 0 ? 1 : 0))

const paint = (j: number, a: number) => {
	const el = blocks[j]?.[0]?.parentElement
	if (el) el.style.opacity = `${a}`
}

const park = (j: number) => {
	lines[j]?.forEach((line) => { line.el.style.transform = `translate3d(0, ${IN.from}%, 0)` })
}

const swap = (to: number) => {
	QUOTES.forEach((_, j) => {
		if (j === to) {
			if (phase[j] !== 'in') {
				phase[j] = 'in'
				clock[j] = 0
				park(j)
			}

			return
		}

		if (phase[j] === 'gone') return

		phase[j] = 'out'
		clock[j] = 0
	})
}

const words = (dt: number) => {
	QUOTES.forEach((_, j) => {
		const run = lines[j]
		if (!run?.length) return

		if (phase[j] === 'gone') return

		const at = (clock[j] = (clock[j] ?? 0) + dt)

		if (phase[j] === 'in') {
			if (alpha[j] !== 1) { alpha[j] = 1; paint(j, 1) }

			const done = IN.at + IN.dur + (run.length - 1) * IN.step
			if (at > done + dt) return

			run.forEach((line, k) => {
				const t = power2Out(clamp01((at - IN.at - k * IN.step) / IN.dur))
				line.el.style.transform = `translate3d(0, ${IN.from * (1 - t)}%, 0)`
			})

			return
		}

		const a = 1 - power1Out(clamp01(at / OUT.dur))

		if (a !== alpha[j]) { alpha[j] = a; paint(j, a) }

		if (at >= OUT.dur) {
			phase[j] = 'gone'
			park(j)
		}
	})
}

const track = (u: number) => {
	const w = width.value
	const span = QUOTES.length * w

	frames.forEach((el, j) => {
		if (!el) return

		const x = ((((j - u) * w + w) % span) + span) % span - w

		el.style.transform = `translate3d(${x}px, 0, 0)`
		el.style.setProperty('--gl-slide', `${x / w}`)
	})
}

const width = ref(1)

const { el: drag, u, target, active, visible, next, previous } = useDragCarousel({
	count: QUOTES.length,
	step: width,
	onMotion: track,
})

const counter = computed(() => `${String(target.value + 1).padStart(2, '0')}/${String(QUOTES.length).padStart(2, '0')}`)

watch(target, swap)

const measure = () => {
	const box = crop.value
	if (box) width.value = Math.max(1, box.getBoundingClientRect().width)
}

const cut = () => {
	const targets = blocks.flat().filter((el): el is HTMLElement => !!el)
	if (!targets.length) return

	split = new LamaSplit(targets, { type: 'lines', mask: 'lines', pad: '.5em' })

	lines = blocks.map(([quote, name]) => [
		...(quote ? split!.linesOf(quote) : []),
		...(name ? split!.linesOf(name) : []),
	])

	QUOTES.forEach((_, j) => {
		if (j === target.value) return

		park(j)
		paint(j, 0)
	})
}

const again = () => {
	measure()
	track(u.value)

	split?.revert()
	split = null

	cut()
}

let frame = 0

const onResize = () => {
	cancelAnimationFrame(frame)
	frame = requestAnimationFrame(again)
}

const HOLD = 5
const SWEEP = 0.5

const SNAPPY = [0, 0.0191, 0.062, 0.1566, 0.3378, 0.5335, 0.6892, 0.8, 0.8686, 0.912, 0.9469, 0.964, 0.9741, 0.981, 0.9859, 0.9896, 0.9923, 0.9946, 0.9961, 0.9976, 0.9984, 0.9991, 0.9996, 0.9998, 1]

const snappy = (t: number) => {
	const x = clamp01(t) * (SNAPPY.length - 1)
	const i = Math.min(Math.floor(x), SNAPPY.length - 2)

	return SNAPPY[i]! + (SNAPPY[i + 1]! - SNAPPY[i]!) * (x - i)
}

type Beat = 'hold' | 'finish' | 'clear'

let beat: Beat = 'hold'
let tick = 0

let held = 0

let drawn = [-1, -1]

const rule = (a: number, b: number) => {
	if (fill.value && drawn[0] !== a) fill.value.style.transform = `scaleX(${a})`
	if (flush.value && drawn[1] !== b) flush.value.style.transform = `scaleX(${b})`

	drawn = [a, b]
}

const begin = (to: Beat) => {
	beat = to
	tick = 0

	if (to === 'clear') rule(0, 1)
	if (to === 'hold') rule(0, 0)
}

const finish = () => {
	if (beat !== 'hold') return

	held = clamp01(tick / HOLD)
	begin('finish')
}

watch(target, finish)

const onWrite = (ratio: number) => {
	const dt = Math.max(ratio, 0.25) / 60

	words(dt)

	if (beat === 'hold') {
		if (!visible.value || active.value) return

		tick += dt

		if (tick < HOLD) return rule(clamp01(tick / HOLD), 0)

		rule(1, 0)
		next()
		begin('clear')

		return
	}

	tick += dt

	const t = snappy(tick / SWEEP)

	if (beat === 'finish') {
		rule(held + (1 - held) * t, 0)

		if (tick >= SWEEP) begin('clear')
		return
	}

	rule(0, 1 - t)

	if (tick >= SWEEP) begin('hold')
}

const { $write } = useNuxtApp()

let unWrite: (() => void) | null = null

onMounted(async () => {
	await nextTick()

	rule(0, 0)
	unWrite = $write(onWrite)

	await document.fonts?.ready

	measure()

	track(u.value)
	cut()

	window.addEventListener('resize', onResize)
})

onBeforeUnmount(() => {
	cancelAnimationFrame(frame)
	window.removeEventListener('resize', onResize)
	unWrite?.()

	split?.revert()
})
</script>
