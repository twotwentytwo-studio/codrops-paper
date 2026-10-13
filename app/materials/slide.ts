import type { MaterialDef } from '@lama/domgl'

const f = (n: number) => (Number.isInteger(n) ? n.toFixed(1) : String(n))

const ZOOM = 1.5
const LAG = 0.16

export const slide: MaterialDef = {
	uniforms: {
		slide: '--gl-slide',
	},

	animated: false,

	frag: /* wgsl */ `
		fn shade(s: Surface) -> vec4f {
			var uv = 0.5 + (s.uv - 0.5) / ${f(ZOOM)};

			uv.x = uv.x - s.u.slide * ${f(LAG)};

			return sample(s, uv);
		}
	`,
}
