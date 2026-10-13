import type { Spring, SpringParams } from '../core/spring.js';
import type { PointerTarget } from './pointer.js';
export interface DragBounds {
    minX?: number;
    maxX?: number;
    minY?: number;
    maxY?: number;
}
export interface DragOptions {
    x?: Spring;
    y?: Spring;
    bounds?: DragBounds;
    rubberband?: number;
    fling?: boolean | number;
    release?: (axis: 'x' | 'y', position: number, velocity: number) => number;
    threshold?: number;
    accept?: (e: PointerEvent) => boolean;
    lock?: boolean | ((dx: number, dy: number) => 'x' | 'y');
    axisScale?: {
        x?: number;
        y?: number;
    };
    maxVelocity?: number;
    dragParams?: SpringParams;
    onStart?(axis: 'x' | 'y' | null): void;
    onMove?(dx: number, dy: number): void;
    onEnd?(vx: number, vy: number): void;
    now?: () => number;
}
export declare function bindDrag(el: PointerTarget & {
    style?: CSSStyleDeclaration | Record<string, string>;
}, opts: DragOptions): () => void;
