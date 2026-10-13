import type { MaterialDef } from '@lama/domgl'
import { WARP_EPOCH, paperWarp } from '~/shaders/paper'

export const warp: MaterialDef = {
	video: false,

	animated: true,

	uniforms: {
		size: '--gl-warp-size',
		speed: '--gl-warp-speed',
		hx: '--gl-px',
		hy: '--gl-py',
		pull: '--gl-pull',
		fill: { prop: '--gl-fill', type: 'color' },
	},

	frag: /* wgsl */ `
		${paperWarp}

		fn shade(s: Surface) -> vec4f {
			let size = max(abs(s.u.size), 1.0);
			let centre = vp.size * 0.5;

			let px = vec2f(s.vpx.x - centre.x, centre.y - s.vpx.y);
			let hand = vec2f(s.u.hx - centre.x, centre.y - s.u.hy);

			let uv = px / (size * 2.0);

			let near = paperHandNear(s.vpx - vec2f(s.u.hx, s.u.hy), size, s.u.pull);

			let t = 0.0625 * (s.time * s.u.speed + ${WARP_EPOCH}.0);

			let m = paperWarpField(uv, t, hand / (size * 2.0), near);

			let back = p.color.rgb;
			let front = mix(back, s.u.fill.rgb, s.u.fill.a);

			return vec4f(mix(back, front, m), 1.0);
		}
	`,
}
