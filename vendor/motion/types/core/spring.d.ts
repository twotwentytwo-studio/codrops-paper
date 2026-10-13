export interface PhysicalParams {
    stiffness: number;
    damping: number;
    mass: number;
}
export interface PerceptualParams {
    response: number;
    dampingRatio?: number;
    bounce?: number;
    mass?: number;
}
export type SpringParams = PhysicalParams | PerceptualParams;
export interface SpringConfig extends PhysicalParams {
    restVelocity: number;
    restDisplacement: number;
}
export declare const DEFAULT_REST_VELOCITY = 0.001;
export declare const DEFAULT_REST_DISPLACEMENT = 0.001;
export declare function isPerceptual(p: SpringParams): p is PerceptualParams;
export declare function toPhysical(p: SpringParams): PhysicalParams;
export declare function resolveConfig(p: SpringParams, rest?: Partial<Pick<SpringConfig, 'restVelocity' | 'restDisplacement'>>): SpringConfig;
export interface StepCoefficients {
    a: number;
    b: number;
    c: number;
    d: number;
}
export declare function computeCoefficients(p: PhysicalParams, dt: number): StepCoefficients;
export interface SpringState {
    value: number;
    velocity: number;
    target: number;
}
export declare function stepSpring(s: SpringState, cfg: SpringConfig, dt: number, coef?: StepCoefficients): boolean;
export declare class Spring implements SpringState {
    value: number;
    velocity: number;
    target: number;
    config: SpringConfig;
    sleeping: boolean;
    constructor(initial: number, params: SpringParams, rest?: Partial<Pick<SpringConfig, 'restVelocity' | 'restDisplacement'>>);
    setParams(params: SpringParams): this;
    setTarget(target: number): this;
    addVelocity(dv: number): this;
    snap(value: number): this;
    step(dt: number, coef?: StepCoefficients): boolean;
}
