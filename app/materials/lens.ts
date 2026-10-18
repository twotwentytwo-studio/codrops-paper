import type { MaterialDef } from '@lama/domgl'

/*
 * Ported from `lensDistortionFragmentShader` in @paper-design/shaders 0.0.80
 * (Apache-2.0) and modified: rewritten in WGSL, reduced to the dispersion fan,
 * and centred on the pointer. See THIRD-PARTY-NOTICES.md.
 */
export const lens: MaterialDef = {
	uniforms: {
		hover: '--gl-hover',
		mx: '--gl-mx',
		my: '--gl-my',
		spread: '--gl-spread',
		swirl: '--gl-swirl',
		radius: '--gl-lens',
		bulge: '--gl-bulge',
		zoom: '--gl-zoom',
		warp: '--gl-warp',
	},

	tess: 12,

	vert: /* wgsl */ `
		if (p.clip.z > 0.5 && u.warp > 0.0001) {
			let c = p.clip.xy + p.clip.zw * 0.5;
			let h = max(p.clip.zw * 0.5, vec2f(1.0));

			let n = (px - c) / h;
			let t = clamp(1.0 - dot(n, n) * 0.5, 0.0, 1.0);

			px = c + (px - c) * (1.0 - u.warp * t);
		}
	`,

	frag: /* wgsl */ `
		fn gmod3(x: vec3f, y: f32) -> vec3f {
			return x - y * floor(x / y);
		}

		fn hueColor(hue: f32) -> vec3f {
			var rgb = clamp(abs(gmod3(vec3f(hue * 6.0) + vec3f(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, vec3f(0.0), vec3f(1.0));
			return rgb * rgb * (3.0 - 2.0 * rgb);
		}

		fn spin(v: vec2f, th: f32) -> vec2f {
			let c = cos(th);
			let s = sin(th);
			return vec2f(v.x * c - v.y * s, v.x * s + v.y * c);
		}

		fn shade(s: Surface) -> vec4f {
			let src = sample(s, s.uv);

			if (uniforms().hover < 0.01) { return src; }

			let h = clamp(s.u.hover, 0.0, 1.0);

			let aspect = s.rect.z / max(s.rect.w, 1.0);
			let skew = vec2f(aspect, 1.0);

			let centre = vec2f(s.u.mx, s.u.my);
			let d = (s.uv - centre) * skew;
			let r = length(d);
			let rn = r / max(s.u.radius, 1e-4);

			let focus = mix(1.0, smoothstep(0.0, 1.0, rn), 0.8);

			let edge = 1.0 - smoothstep(0.85, 1.0, max(abs(s.uv.x - 0.5), abs(s.uv.y - 0.5)) * 2.0);

			let strength = focus * edge * h;

			let bulge = max(s.u.bulge * h, 1e-4);
			let map = tan(min(rn * bulge, 1.53)) / max(tan(bulge), 1e-4);
			let warped = centre + (d * (map / max(rn, 1e-4))) / skew;

			let dir = select(vec2f(1.0, 0.0), d / max(r, 1e-5), r > 1e-5) / skew;
			let reach = s.u.spread * 0.05 * strength;

			let turn = s.u.swirl * 0.4 * 3.14159265 * strength * s.u.spread;

			let zoom = 1.0 + s.u.zoom * h;

			var col = vec3f(0.0);
			var wsum = vec3f(0.0);

			for (var i = 0; i < 17; i++) {
				let t = f32(i) / 16.0;
				let fan = 1.0 - 2.0 * t;

				let off = warped + dir * reach * fan;
				let tap = centre + spin((off - centre) * skew, turn * fan) / skew;

				let read = 0.5 + (tap - 0.5) / zoom;
				let sampled = sample(s, clamp(read, vec2f(0.0), vec2f(1.0)));
				let w = 1.0 - hueColor(0.60 + t);

				col += sampled.rgb * w;
				wsum += w;
			}

			return vec4f(col / max(wsum, vec3f(1e-4)), src.a);
		}
	`,
}
