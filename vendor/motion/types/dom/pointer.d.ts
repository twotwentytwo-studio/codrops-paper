import type { Spring } from '../core/spring.js';
export interface PointerState {
    hover: boolean;
    press: boolean;
}
export interface PointerOptions {
    hover?: boolean;
    press?: boolean;
    touchHover?: boolean;
}
export type PointerTarget = EventTarget & {
    setPointerCapture?(id: number): void;
    releasePointerCapture?(id: number): void;
};
export declare function bindPointer(el: PointerTarget, onChange: (state: PointerState) => void, opts?: PointerOptions): () => void;
export interface StateTargets {
    rest: number;
    hover?: number;
    press?: number;
}
export declare function bindStates(el: PointerTarget, spring: Spring, targets: StateTargets, opts?: PointerOptions): () => void;
export declare function bindHover(el: PointerTarget, spring: Spring, rest: number, hover: number, opts?: PointerOptions): () => void;
export declare function bindPress(el: PointerTarget, spring: Spring, rest: number, press: number, opts?: PointerOptions): () => void;
