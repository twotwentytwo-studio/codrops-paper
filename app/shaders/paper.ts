const f = (n: number) => (Number.isInteger(n) ? n.toFixed(1) : String(n))

const DISTORTION = 0.25
const SWIRL = 0.8
const SWIRL_ITERATIONS = 10
const SHAPE_SCALE = 0.5

const PROPORTION = 0.28

const BIAS = 0.48 * Math.sign(PROPORTION - 0.5) * Math.sqrt(Math.abs(PROPORTION - 0.5))

const TWIST = 2.1
const REACH = 2.4
const DRAW_IN = 0.3

export const WARP_EPOCH = 118

/*
 * Ported from `warpFragmentShader` in @paper-design/shaders 0.0.80
 * (Apache-2.0) and modified: rewritten in WGSL, fixed to the stripes shape,
 * and given a hand that twists the field. See THIRD-PARTY-NOTICES.md.
 */
export const paperWarp = /* wgsl */ `
	fn hash21(p: vec2f) -> f32 {
		var p3 = fract(vec3f(p.xyx) * 0.1031);
		p3 = p3 + vec3f(dot(p3, p3.yzx + 33.33));
		return fract((p3.x + p3.y) * p3.z);
	}

	fn valueNoise(st: vec2f) -> f32 {
		let i = floor(st);
		let fr = fract(st);

		let a = hash21(i);
		let b = hash21(i + vec2f(1.0, 0.0));
		let c = hash21(i + vec2f(0.0, 1.0));
		let d = hash21(i + vec2f(1.0, 1.0));

		let u = fr * fr * (3.0 - 2.0 * fr);

		return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
	}

	fn spin2(v: vec2f, a: f32) -> vec2f {
		let c = cos(a);
		let s = sin(a);
		return vec2f(v.x * c - v.y * s, v.x * s + v.y * c);
	}

	fn paperHandNear(d: vec2f, size: f32, pull: f32) -> f32 {
		let r = max(size * ${f(REACH)}, 1.0);
		return clamp(pull, 0.0, 1.0) * exp(-dot(d, d) / (r * r));
	}

	fn paperWarpField(uv0: vec2f, t: f32, hand: vec2f, near: f32) -> f32 {
		var uv = uv0;

		let n1 = valueNoise(uv * 1.0 + t);
		let n2 = valueNoise(uv * 2.0 - t);
		let angle = n1 * 6.28318530718;

		uv.x = uv.x + 4.0 * ${f(DISTORTION)} * n2 * cos(angle);
		uv.y = uv.y + 4.0 * ${f(DISTORTION)} * n2 * sin(angle);

		uv = hand + spin2(uv - hand, near * ${f(TWIST)}) * (1.0 - near * ${f(DRAW_IN)});

		for (var i = 1.0; i <= ${f(SWIRL_ITERATIONS)}; i = i + 1.0) {
			uv.x = uv.x + ${f(SWIRL)} / i * cos(t + i * 1.5 * uv.y);
			uv.y = uv.y + ${f(SWIRL)} / i * cos(t + i * 1.0 * uv.x);
		}

		let fy = fract(uv.y * (2.0 * ${f(SHAPE_SCALE)}));
		let shape = smoothstep(0.0, 0.55, fy) * (1.0 - smoothstep(0.45, 1.0, fy)) + (${f(BIAS)});

		return clamp(shape, 0.0, 1.0);
	}
`

/*
 * Ported from `paperTextureFragmentShader` in @paper-design/shaders 0.0.80
 * (Apache-2.0) and modified: rewritten in WGSL and reduced to the folds and
 * crumples. See THIRD-PARTY-NOTICES.md.
 */
export const paperSheet = /* wgsl */ `
	fn sheetHash(p: vec2f) -> vec3f {
		let q = vec3f(
			dot(p, vec2f(127.1, 311.7)),
			dot(p, vec2f(269.5, 183.3)),
			dot(p, vec2f(419.2, 371.9)),
		);

		return fract(sin(q) * 43758.5453);
	}

	fn sheetJitter(p: vec2f) -> vec2f { return sheetHash(p).yz; }

	fn sheetRot(v: vec2f, a: f32) -> vec2f {
		let c = cos(a);
		let s = sin(a);

		return vec2f(v.x * c - v.y * s, v.x * s + v.y * c);
	}

	fn crumpled(t: vec2f, pw: f32) -> f32 {
		let p = floor(t);

		var wsum = 0.0;
		var cl = 0.0;

		for (var y = -1; y < 2; y = y + 1) {
			for (var x = -1; x < 2; x = x + 1) {
				let q = vec2f(f32(x), f32(y)) + p;

				let q2 = q - floor(q / 8.0) * 8.0;

				let c = q + sheetJitter(q2);
				let r = c - t;

				let w = pow(smoothstep(0.0, 1.0, 1.0 - abs(r.x)), pw)
					* pow(smoothstep(0.0, 1.0, 1.0 - abs(r.y)), pw);

				cl = cl + (0.5 + 0.5 * sin((q2.x + q2.y * 5.0) * 8.0)) * w;
				wsum = wsum + w;
			}
		}

		return pow(select(0.0, cl / max(wsum, 1e-6), wsum > 0.0), 0.5) * 2.0;
	}

	fn crumplesShape(uv: vec2f) -> f32 {
		return crumpled(uv * 0.25, 16.0) * crumpled(uv * 0.5, 2.0);
	}

	fn sheetFolds(uv: vec2f, count: f32, seed: f32) -> vec2f {
		var best = vec2f(0.0);
		var near = 9.0;

		for (var i = 0.0; i < 15.0; i = i + 1.0) {
			if (i >= count) { break; }

			let rand = sheetJitter(vec2f(i, i * seed));
			let an = rand.x * 6.28318530718;
			let p = vec2f(cos(an), sin(an)) * rand.y;

			let d = distance(uv, p);

			if (d < near) {
				near = d;
				best = uv - p;
			}
		}

		return mix(best, vec2f(0.0), pow(near, 0.25));
	}
`
