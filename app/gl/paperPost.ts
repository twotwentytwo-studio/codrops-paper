import type { Post } from '@lama/domgl'
import { paperSheet } from '~/shaders/paper'

const f = (n: number) => (Number.isInteger(n) ? n.toFixed(1) : String(n))

const SCALE = 0.51
const CONTRAST = 0.26
const FOLD_COUNT = 5
const CRUMPLE_SIZE = 0.28
const SEED = 0.37
const FOLD_EDGE = 0.06

const FLOOR = 0.004

/*
 * The relief and lighting are ported from `paperTextureFragmentShader` in
 * @paper-design/shaders 0.0.80 (Apache-2.0) and modified: rewritten in WGSL
 * and masked by the fluid's ink. See THIRD-PARTY-NOTICES.md.
 */
const SHADER = /* wgsl */ `
	struct C {
		size: vec2f,
		scroll: f32,
		relief: f32,
		gain: f32,
		folds: f32,
		crumples: f32,
		lift: f32,
	}

	@group(0) @binding(0) var<uniform> c: C;
	@group(0) @binding(1) var lin: sampler;
	@group(0) @binding(2) var page: texture_2d<f32>;
	@group(0) @binding(3) var dye: texture_2d<f32>;

	${paperSheet}

	struct VOut {
		@builtin(position) pos: vec4f,
		@location(0) uv: vec2f,
	}

	@vertex fn vs(@builtin(vertex_index) i: u32) -> VOut {
		let uv = vec2f(f32((i << 1u) & 2u), f32(i & 2u));

		var o: VOut;
		o.pos = vec4f(uv * vec2f(2.0, -2.0) + vec2f(-1.0, 1.0), 0.0, 1.0);
		o.uv = uv;
		return o;
	}

	@fragment fn fs(in: VOut) -> @location(0) vec4f {
		let ink = textureSampleLevel(dye, lin, in.uv, 0.0);
		let near = clamp(max(max(ink.r, ink.g), ink.b) * c.gain, 0.0, 1.0);

		if (near < ${f(FLOOR)}) {
			return textureSampleLevel(page, lin, in.uv, 0.0);
		}

		let aspect = c.size.x / max(c.size.y, 1.0);
		let px = (in.uv - 0.5) * c.size + vec2f(0.0, c.scroll);
		let pat = vec2f(px.x / max(c.size.x, 1.0) * aspect, -px.y / max(c.size.y, 1.0)) * ${f(5 / SCALE)};

		let seed = ${f(SEED)};

		let cuv = fract(pat * ${f(0.02 / CRUMPLE_SIZE)} - seed) * 32.0;
		let crumples = c.crumples * (crumplesShape(cuv + vec2f(0.05, 0.0)) - crumplesShape(cuv));

		let f1 = sheetRot(pat * 0.12, 4.0 * seed);
		let f2 = sheetRot(f1 + 0.007 * cos(seed), 0.01 * sin(seed));

		let e = vec2f(${f(FOLD_EDGE)}, 0.0);

		let at = sheetFolds(f1, ${f(FOLD_COUNT)}, seed) + sheetFolds(f2, ${f(FOLD_COUNT)}, seed);
		let off = sheetFolds(f1 + e, ${f(FOLD_COUNT)}, seed) + sheetFolds(f2 + e, ${f(FOLD_COUNT)}, seed);

		let creases = clamp((off - at) * ${f((1 / FOLD_EDGE) * 0.02)}, vec2f(-1.0), vec2f(1.0));

		var normal = c.folds * ${f(Math.min(5 * CONTRAST, 1))} * 4.0 * creases;
		normal = normal + crumples;

		normal = normal * near;

		let uv = in.uv + normal * c.lift * 0.02;
		let src = textureSampleLevel(page, lin, uv, 0.0);

		let z = ${f(9.5 - 9 * Math.pow(CONTRAST, 0.1))};

		let lit = normalize(vec3f(1.0, 2.0, 1.0));
		let res = dot(normalize(vec3f(normal, z)), lit);

		let lightness = 1.0 + (res - lit.z) * c.relief;

		return vec4f(src.rgb * lightness, src.a);
	}
`

type Gpu = {
	pipeline: GPURenderPipeline
	uniforms: GPUBuffer
	sampler: GPUSampler
}

type Core = {
	device: GPUDevice | null
	format: GPUTextureFormat
	width: number
	height: number
	canvasWidth: number
	canvasHeight: number
	originX: number
	originY: number
	dye: GPUTextureView | null
}

export class PaperPost implements Post {
	relief = 0.5
	gain = 2.4
	folds = 0.65
	crumples = 0.61

	lift = 0.6

	private core: Core
	private gpu: Gpu | null = null

	private scroll: () => number

	constructor(core: Core, scroll: () => number = () => window.scrollY) {
		this.core = core
		this.scroll = scroll
	}

	get active() {
		return !!this.core.dye
	}

	reset() {
		this.gpu?.uniforms.destroy()
		this.gpu = null
	}

	private build(device: GPUDevice): Gpu {
		const module = device.createShaderModule({ label: 'paper post', code: SHADER })

		return {
			pipeline: device.createRenderPipeline({
				label: 'paper post',
				layout: 'auto',
				vertex: { module, entryPoint: 'vs' },
				fragment: { module, entryPoint: 'fs', targets: [{ format: this.core.format }] },
				primitive: { topology: 'triangle-list' },
			}),
			uniforms: device.createBuffer({ size: 32, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST }),
			sampler: device.createSampler({ magFilter: 'linear', minFilter: 'linear' }),
		}
	}

	composite(encoder: GPUCommandEncoder, src: GPUTextureView, dst: GPUTextureView) {
		const device = this.core.device
		if (!device) return

		this.gpu ??= this.build(device)

		const dye = this.core.dye
		const gain = dye ? this.gain : 0

		const u = new Float32Array(8)

		u[0] = this.core.canvasWidth
		u[1] = this.core.canvasHeight
		u[2] = this.scroll() + this.core.originY
		u[3] = this.relief
		u[4] = gain
		u[5] = this.folds
		u[6] = this.crumples
		u[7] = this.lift

		device.queue.writeBuffer(this.gpu.uniforms, 0, u)

		const group = device.createBindGroup({
			layout: this.gpu.pipeline.getBindGroupLayout(0),
			entries: [
				{ binding: 0, resource: { buffer: this.gpu.uniforms } },
				{ binding: 1, resource: this.gpu.sampler },
				{ binding: 2, resource: src },
				{ binding: 3, resource: dye ?? src },
			],
		})

		const pass = encoder.beginRenderPass({
			label: 'paper post',
			colorAttachments: [{ view: dst, loadOp: 'clear', clearValue: { r: 0, g: 0, b: 0, a: 0 }, storeOp: 'store' }],
		})

		pass.setPipeline(this.gpu.pipeline)
		pass.setBindGroup(0, group)
		pass.draw(3)
		pass.end()
	}
}
