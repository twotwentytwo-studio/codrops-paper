import type { NuxtModule } from '@nuxt/schema'

export type GateSpec = { touch?: boolean; minWidth?: number }

export interface ModuleOptions {
	gate?: 'desktop' | 'all' | GateSpec
	stamp?: boolean
	assets?: boolean
	materials?: string | false
	media?: string | false
}

declare const module: NuxtModule<ModuleOptions>
export default module
