import { Perlin } from "libnoise-ts/module/generator";

export default function(seed: string): Perlin {
    const s: number = seed.split("").map((e) => Number(e.codePointAt(0))).reduce((a, b) => a + b);
    return new Perlin(1, 3, 12, 0.4, s);
}
