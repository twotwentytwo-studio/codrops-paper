import type { MaterialDef } from '@lama/domgl'
import { WARP_EPOCH, paperWarp } from '~/shaders/paper'

const FULL = 60

const SOFT = 0.012

const DRAG = 0.55

const KIND = 1
const DITHER = 0

const RULE = 2

export const seam: MaterialDef = {
	video: false,

	animated: true,

	uniforms: {
		noise: '--gl-seam-noise',
		cell: '--gl-seam-cell',
		wsize: '--gl-warp-size',
		wspeed: '--gl-warp-speed',
		mask: '--gl-seam-mask',
		hx: '--gl-px',
		hy: '--gl-py',
		pull: '--gl-pull',
		light: { prop: '--gl-seam-light', type: 'color' },
		stroke: { prop: '--gl-seam-stroke', type: 'color' },
	},

	frag: /* wgsl */ `
		${paperWarp}

		fn ditherHash(q: vec2f) -> f32 {
			var v = fract(q * vec2f(0.3183099, 0.3678794)) + 0.1;
			v = v + vec2f(dot(v, v + 19.19));
			return fract(v.x * v.y);
		}

		fn bayer2(cell: vec2f) -> f32 {
			var m = array<f32, 4>(0.0, 2.0, 3.0, 1.0);
			let q = vec2i(fract(cell / 2.0) * 2.0);
			return m[q.y * 2 + q.x] / 4.0;
		}

		fn bayer4(cell: vec2f) -> f32 {
			var m = array<f32, 16>(
				0.0, 8.0, 2.0, 10.0,
				12.0, 4.0, 14.0, 6.0,
				3.0, 11.0, 1.0, 9.0,
				15.0, 7.0, 13.0, 5.0,
			);
			let q = vec2i(fract(cell / 4.0) * 4.0);
			return m[q.y * 4 + q.x] / 16.0;
		}

		fn bayer8(cell: vec2f) -> f32 {
			var m = array<f32, 64>(
				0.0, 32.0, 8.0, 40.0, 2.0, 34.0, 10.0, 42.0,
				48.0, 16.0, 56.0, 24.0, 50.0, 18.0, 58.0, 26.0,
				12.0, 44.0, 4.0, 36.0, 14.0, 46.0, 6.0, 38.0,
				60.0, 28.0, 52.0, 20.0, 62.0, 30.0, 54.0, 22.0,
				3.0, 35.0, 11.0, 43.0, 1.0, 33.0, 9.0, 41.0,
				51.0, 19.0, 59.0, 27.0, 49.0, 17.0, 57.0, 25.0,
				15.0, 47.0, 7.0, 39.0, 13.0, 45.0, 5.0, 37.0,
				63.0, 31.0, 55.0, 23.0, 61.0, 29.0, 53.0, 21.0,
			);
			let q = vec2i(fract(cell / 8.0) * 8.0);
			return m[q.y * 8 + q.x] / 64.0;
		}

		fn dither(px: vec2f, cell: f32) -> f32 {
			let block = floor(px / max(cell, 1.0));

			if (${KIND}.0 < 1.5) { return ditherHash(block); }
			if (${KIND}.0 < 2.5) { return bayer2(block); }
			if (${KIND}.0 < 3.5) { return bayer4(block); }
			return bayer8(block);
		}

		fn shade(s: Surface) -> vec4f {
			let size = max(abs(s.u.wsize), 1.0);
			let centre = vp.size * 0.5;
			let handPx = vec2f(s.u.hx, s.u.hy);

			let px = vec2f(s.vpx.x - centre.x, centre.y - s.vpx.y);
			let hand = vec2f(handPx.x - centre.x, centre.y - handPx.y);

			let near = paperHandNear(s.vpx - handPx, size, s.u.pull);
			let t = 0.0625 * (s.time * s.u.wspeed + ${WARP_EPOCH}.0);

			let field = paperWarpField(px / (size * 2.0), t, hand / (size * 2.0), near);

			var ragged = s.uv.y + field * s.u.noise;

			let crossing = 0.5 - field * s.u.noise;
			let handUv = (handPx - s.rect.xy) / max(s.rect.zw, vec2f(1.0));

			ragged = ragged + (crossing - handUv.y) * near * ${DRAG};

			let soft = clamp(${SOFT} + abs(s.velocity) / ${FULL.toFixed(1)}, 0.001, 0.5);

			var over = smoothstep(0.5 - soft, 0.5 + soft, ragged);

			if (${DITHER}.0 > 0.5) {
				over = step(dither(s.vpx, s.u.cell), over);
			}

			let crossed = mix(p.color.rgb, s.u.light.rgb, over);

			let d = abs(ragged - 0.5) / max(fwidth(ragged), 1e-5);
			let rule = 1.0 - smoothstep(${RULE}.0 * 0.5, ${RULE}.0 * 0.5 + 1.0, d);

			let rgb = mix(crossed, s.u.stroke.rgb, rule * s.u.stroke.a);

			let cut = mix(1.0, max(over, rule * s.u.stroke.a), clamp(s.u.mask, 0.0, 1.0));

			return vec4f(rgb, cut);
		}
	`,
}
