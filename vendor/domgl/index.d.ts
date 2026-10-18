import type { DefineComponent, Ref, ShallowRef } from 'vue'

export type UniformType = 'number' | 'color'
export type UniformDef = string | { css?: string; prop?: string; type?: UniformType }

export type MaterialDef = {
	frag: string
	uniforms?: Record<string, UniformDef>
	raw?: boolean
	animated?: boolean
	video?: boolean
	vert?: string
	tess?: number
}

export type RevealUnit = 'glyph' | 'line' | 'word'
export type RevealDef = { code: string; unit?: RevealUnit }

export type Post = {
	active: boolean
	sim?: (encoder: GPUCommandEncoder, ratio: number) => void
	composite: (encoder: GPUCommandEncoder, src: GPUTextureView, dst: GPUTextureView) => void
	reset: () => void
}

export type DomGl = {
	readonly core: { originY: number; post: Post | null }
	readonly ready: Promise<unknown>
	defineReveal(name: string, def: string | RevealDef): void
}

export type DomGlContext = { gl: DomGl; media: unknown }

export declare function useDomGl(): ShallowRef<DomGlContext | null>
export declare function fontsReady(cap?: number): Promise<unknown>
export declare const DomGl: DefineComponent<any>
export declare const GlFluid: DefineComponent<any>
export declare const GlMedia: DefineComponent<any>
export declare const GlSolid: DefineComponent<any>
export declare const GlText: DefineComponent<any>
