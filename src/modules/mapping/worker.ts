import Router from "koa-router";
import crypto from "crypto";
import { promisify as _p } from "util";
import generatePerlin from "../../lib/perlin";
import { Perlin } from "libnoise-ts/module/generator";
import { clamp } from "../../lib/math";
import { PNG } from "pngjs";

const heights: number[] = [
    0,
    0.075,
    0.175,
    0.225,
    0.475,
    0.675,
    1.0,
];

const htmlcolor: Array<{r: number, g: number, b: number}> = [
    {r: 0, g: 0, b: 128},
    {r: 26, g: 26, b: 255},
    {r: 255, g: 255, b: 153},
    {r: 51, g: 26, b: 0},
    {r: 0, g: 51, b: 0},
    {r: 89, g: 89, b: 89},
    {r: 255, g: 255, b: 255},
];

const randomBytes = _p(crypto.randomBytes); // tslint:disable-line typedef

declare interface IWorkData {
    id: string;
    seed: string;
    color: boolean;
}

declare interface ITileData {
    x: number;
    y: number;
    type: number;
    height: number;
    gradient: number;
}

function genTiles(seed: string, size: number, height: number, start: number, end: number):
Promise<ITileData[]> {
    const perlin3D: Perlin = generatePerlin(seed);
    const tiles: ITileData[] = [];
    return new Promise((resolve, reject): void => {
        for (let x: number = start; x < end; x++) {
            for (let y: number = 0; y < size; y++) {
                const grad: number = clamp(perlin3D.getValue(x / size, y / size, 0), 1, -0.7);
                const theight: number = clamp(height * grad, height, 0);
                heights.some((el, i) => {
                    const cheight: number = el * height;
                    if (theight <= cheight) {
                        const tdata: ITileData = {
                            x,
                            y,
                            type: i,
                            height: theight,
                            gradient: grad,
                        };
                        tiles.push(tdata);
                        return true;
                    } else {
                        return false;
                    }
                });
            }
        }
        resolve(tiles);
    });
}

async function generateMap(seed: string, size: number, height: number):
Promise<ITileData[]> {
    return genTiles(seed, size, height, 0, 1024);
}

function generateMapImage(seed: string, colors: boolean = true): Promise<Buffer> {
    return new Promise(async (resolve, reject): Promise<void> => {
        const map: ITileData[] = await generateMap(seed, 1024, 1024);
        const png: PNG = new PNG({
            width: 1024,
            height: 1024,
            filterType: 4,
            bgColor: {
                red: 0,
                green: 0,
                blue: 128,
            },
        });
        for (const tile of map) {
            const {r, g, b}: {r: number, g: number, b: number} = htmlcolor[tile.type];
            let a: number = 255;
            if (!colors) {
                a = clamp(tile.gradient * 255);
            }
            const idx: number = (1024 * tile.y + tile.x) << 2; // tslint:disable-line no-bitwise
            png.data[idx] = r;
            png.data[idx + 1] = g;
            png.data[idx + 2] = b;
            png.data[idx + 3] = a;
        }
        resolve(PNG.sync.write(png));
    });
}

process.on("message", (data) => {
    // Read for start.
    if (typeof data === "object") {
        console.log("[MapGen] Starting work:", data);
        const work: IWorkData = data as IWorkData;
        generateMapImage(work.seed, work.color).then((buffer) => {
            console.log("[MapGen] Work for {", work.seed, "} complete.");
            if (process.send) {
                process.send({
                    id: work.id,
                    buffer,
                });
            }
        });
    }
});
