import type { MaterialDef } from '@lama/domgl'
import { DOT_PITCH, paperDotBand, paperDotTake } from '~/shaders/paper'

export const halftone: MaterialDef = {
	video: false,

	animated: false,

	frag: /* wgsl */ `
		fn shade(s: Surface) -> vec4f {
			let band = ${paperDotBand(`${DOT_PITCH}.0`)};
			let take = ${paperDotTake('band', 's.vpx.x')};

			let c = p.color;

			let dotted = paperDot(s.vpx, band.x, take, 2.4);

			let a = mix(c.a, c.a * dotted, smoothstep(0.0, 0.15, take));

			return vec4f(c.rgb, clamp(a, 0.0, 1.0));
		}
	`,
}
