import { type SpringConfig, type SpringParams } from './spring.js';
export declare class SpringSet {
    readonly count: number;
    readonly channels: number;
    readonly values: Float32Array;
    readonly velocities: Float32Array;
    readonly targets: Float32Array;
    readonly awake: Uint8Array;
    config: SpringConfig;
    private coefDt;
    private coef;
    private activeCount;
    constructor(count: number, channels: number, params: SpringParams, rest?: Partial<Pick<SpringConfig, 'restVelocity' | 'restDisplacement'>>);
    get active(): number;
    setParams(params: SpringParams): this;
    private wake;
    setTarget(i: number, channel: number, target: number): void;
    setTargets(i: number, ...targets: number[]): void;
    addVelocity(i: number, channel: number, dv: number): void;
    snap(i: number, ...values: number[]): void;
    get(i: number, channel: number): number;
    step(dt: number): number;
}
