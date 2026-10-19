# Paper × domgl

_A one-page site designed in [Paper](https://paper.design/), with Paper's shaders ported to WebGPU and run through [domgl](https://domgl.jesperlandberg.com/) so they work on the page's own elements instead of sitting in a background canvas._

![Paper × domgl](https://tympanus.net/codrops/wp-content/uploads/2026/10/paperdrops_frame_featured.jpg)

[Article on Codrops](https://tympanus.net/codrops/?p=124140)

[Demo](https://tympanus.net/Demos/PaperDrops/)

## Installation

This project uses [pnpm](https://pnpm.io/).

```bash
pnpm install
pnpm dev
```

The dev server runs on [http://localhost:3300](http://localhost:3300). To build for production:

```bash
pnpm build
```

The shaders run on WebGPU, so use a browser that supports it.

## Tech Stack

- [Nuxt](https://nuxt.com/) and [Vue](https://vuejs.org/)
- WebGPU and WGSL
- [domgl](https://domgl.jesperlandberg.com/) (`@lama/domgl`), which syncs WebGPU planes to DOM elements, and `@domgl/motion`
- [Tailwind CSS](https://tailwindcss.com/)
- [Lenis](https://github.com/darkroomengineering/lenis)
- [@lama/split](https://github.com/jesperlandberg/lama)

## Credits

- Parts of the WGSL are ported from [Paper Shaders](https://github.com/paper-design/shaders) (`@paper-design/shaders` 0.0.80) by Paper, under the Apache License 2.0. Every port was rewritten from GLSL to WGSL, reduced to the parts the site uses and re-parameterised:
  - `app/shaders/paper.ts`: `paperWarp`, from `warpFragmentShader`, and `paperSheet`, from `paperTextureFragmentShader`
  - `app/gl/paperPost.ts`: the relief and lighting of `paperTextureFragmentShader`
  - `app/materials/lens.ts`: from `lensDistortionFragmentShader`
  - `vendor/domgl/index.js`: `paperDot`, from the classic type of `halftoneDotsFragmentShader`
- `vendor/domgl/assets/basis` redistributes the [Basis Universal](https://github.com/BinomialLLC/basis_universal) transcoder by Binomial LLC, unmodified, under the Apache License 2.0.

Powered by Paper Shaders: [shaders.paper.design](https://shaders.paper.design)

## License

This repository contains code under different terms:

- **domgl (`vendor/domgl`) and `@domgl/motion` (`vendor/motion`)** are proprietary and not open source. Copyright (c) 2026 Jesper Landberg, all rights reserved. They're included in compiled form only so that this site can be built. No license to use, copy, modify or distribute them, in whole or in part, in this project or any other, is granted. See [vendor/domgl/LICENSE](vendor/domgl/LICENSE) and [vendor/motion/LICENSE](vendor/motion/LICENSE). `vendor/domgl/assets/basis/worker.js` is part of domgl and falls under the same terms.
- **The Paper Shaders ports** listed under Credits, including `paperDot` in `vendor/domgl/index.js`, are under the Apache License 2.0. See [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
- **The Basis Universal transcoder** (`basis_transcoder.js` and `basis_transcoder.wasm` in `vendor/domgl/assets/basis`) is under the Apache License 2.0. See the [LICENSE](vendor/domgl/assets/basis/LICENSE) and [NOTICE](vendor/domgl/assets/basis/NOTICE) beside it.
