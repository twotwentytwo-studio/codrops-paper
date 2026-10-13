import type { MaterialDef } from '@lama/domgl'

export const dots: MaterialDef = {
	video: false,

	uniforms: {
		size: '--gl-dot-size',
		gap: '--gl-dot-gap',
		sizeRange: '--gl-size-range',
		opacityRange: '--gl-opacity-range',
		hx: '--gl-px',
		hy: '--gl-py',
		pull: '--gl-pull',
		reach: '--gl-reach',
		antenna: '--gl-antenna',
		fill: { prop: '--gl-fill', type: 'color' },
	},

	frag: /* wgsl */ `
		fn gmod3(x: vec3f, y: f32) -> vec3f {
			return x - y * floor(x / y);
		}

		fn permute3(x: vec3f) -> vec3f {
			return gmod3(((x * 34.0) + 1.0) * x, 289.0);
		}

		fn snoise(v: vec2f) -> f32 {
			let C = vec4f(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);

			var i = floor(v + dot(v, C.yy));
			let x0 = v - i + dot(i, C.xx);

			var i1 = vec2f(0.0, 1.0);
			if (x0.x > x0.y) { i1 = vec2f(1.0, 0.0); }

			var x12 = vec4f(x0, x0) + vec4f(C.x, C.x, C.z, C.z);
			x12 = vec4f(x12.xy - i1, x12.zw);

			i = i - 289.0 * floor(i / 289.0);

			let pp = permute3(permute3(vec3f(i.y) + vec3f(0.0, i1.y, 1.0)) + vec3f(i.x) + vec3f(0.0, i1.x, 1.0));

			var m = max(vec3f(0.5) - vec3f(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), vec3f(0.0));
			m = m * m;
			m = m * m;

			let x = 2.0 * fract(pp * C.www) - 1.0;
			let h = abs(x) - 0.5;
			let a0 = x - floor(x + 0.5);

			m = m * (1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h));

			let gyz = a0.yz * x12.xz + h.yz * x12.yw;
			let g = vec3f(a0.x * x0.x + h.x * x0.y, gyz.x, gyz.y);

			return 130.0 * dot(m, g);
		}

		fn shade(s: Surface) -> vec4f {
			let hand = s.vpx - vec2f(s.u.hx, s.u.hy);
			let reach = max(s.u.reach, 1.0);
			let k = clamp(s.u.pull, 0.0, 1.0) * exp(-dot(hand, hand) / (reach * reach));

			let lensed = s.vpx - hand * 0.32 * k;

			let px = vec2f(lensed.x - vp.size.x * 0.5, vp.size.y * 0.5 - lensed.y);

			let gap = max(abs(s.u.gap), 1e-6);
			let cell = px / gap;

			let grid = fract(cell) + 1e-4;
			let idx = floor(cell);

			let sizeRnd = 0.5 + 0.8 * snoise(2.0 * vec2f(idx.x * 100.0, idx.y));
			let fadeRnd = 0.5 + 0.7 * snoise(2.0 * vec2f(idx.y, idx.x));

			let q = (grid - (vec2f(0.5) - 1e-3)) * gap;

			let dir = hand / max(length(hand), 1e-4);
			let aim = vec2f(dir.x, -dir.y);

			let along = dot(q, aim);
			let across = q - aim * along;
			let draw = 1.0 + s.u.antenna * k;

			let dist = length(vec2f(along / draw, length(across)));

			let radius = s.u.size * (1.0 - sizeRnd * s.u.sizeRange) * (1.0 + 0.6 * k);

			let edge = fwidth(dist);
			let cov = (1.0 - smoothstep(radius - edge, radius + edge, dist))
				* max(0.0, 1.0 - fadeRnd * s.u.opacityRange)
				* s.u.fill.a;

			let back = p.color;
			let a = cov + (1.0 - cov) * back.a;
			let lit = s.u.fill.rgb * cov + back.rgb * back.a * (1.0 - cov);

			return vec4f(lit / max(a, 1e-4), a);
		}
	`,
}
