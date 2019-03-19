export function clamp(val: number, max: number = 1, min: number = 0): number {
    return val > max ? val : val < min ? min : val;
}
