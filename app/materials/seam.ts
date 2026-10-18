import type { MaterialDef } from '@lama/domgl'
import { WARP_EPOCH, paperWarp } from '~/shaders/paper'

const FULL = 60

const SOFT = 0.012

const DRAG = 0.55

const RULE = 2

export const seam: MaterialDef = {
	video: false,

	animated: true,

	uniforms: {
		noise: '--gl-seam-noise',
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

			let over = smoothstep(0.5 - soft, 0.5 + soft, ragged);

			let crossed = mix(p.color.rgb, s.u.light.rgb, over);

			let d = abs(ragged - 0.5) / max(fwidth(ragged), 1e-5);
			let rule = 1.0 - smoothstep(${RULE}.0 * 0.5, ${RULE}.0 * 0.5 + 1.0, d);

			let rgb = mix(crossed, s.u.stroke.rgb, rule * s.u.stroke.a);

			let cut = mix(1.0, max(over, rule * s.u.stroke.a), clamp(s.u.mask, 0.0, 1.0));

			return vec4f(rgb, cut);
		}
	`,
}
