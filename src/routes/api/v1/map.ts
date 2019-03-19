import Router from "koa-router";
import crypto from "crypto";
import { promisify as _p } from "util";
import generatePerlin from "../../../lib/perlin";
import { Perlin } from "libnoise-ts/module/generator";
import { clamp } from "../../../lib/math";
import { PNG } from "pngjs";

const heights = [
    0,
    0.075,
    0.175,
    0.225,
    0.475,
    0.675,
    1.0,
];

const htmlcolor = [
    {r: 0, g: 0, b: 128},
    {r: 26, g: 26, b: 255},
    {r: 255, g: 255, b: 153},
    {r: 51, g: 26, b: 0},
    {r: 0, g: 51, b: 0},
    {r: 89, g: 89, b: 89},
    {r: 255, g: 255, b: 255},
];

const randomBytes = _p(crypto.randomBytes);

declare interface ITileData {
    x: number;
    y: number;
    type: number;
    height: number;
    gradient: number;
}

function genTiles(perlin3D: Perlin, size: number, height: number, start: number, end: number):
Promise<ITileData[]> {
    const tiles: ITileData[] = [];
    return new Promise((resolve, reject) => {
        for (let x = start; x < end; x++) {
            for (let y = 0; y < size; y++) {
                const grad = clamp(perlin3D.getValue(x / size, y / size, 0), 1, -0.7);
                const theight = clamp(height * grad, height, 0);
                heights.some((el, i) => {
                    const cheight = el * height;
                    if (theight <= cheight) {
                        const tdata = {
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
    const perlin3D = generatePerlin(seed);
    return await genTiles(perlin3D, size, height, 0, 1024);
}

async function randomGen(len: number = 16): Promise<string> {
    return (await randomBytes(len * 2)).toString("hex");
}

function generateMapImage(seed: string, colors: boolean = true): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
        const map = await generateMap(seed, 1024, 1024);
        const png = new PNG({
            width: 1024,
            height: 1024,
            filterType: 4,
            bgColor: {
                red: 0,
                green: 0,
                blue: colors ? 128 : 0,
            },
        });
        for (const tile of map) {
            let {r, g, b} = htmlcolor[tile.type];
            if (!colors) {
                const gray = clamp(tile.gradient * 255);
                r = gray;
                g = gray;
                b = gray;
            }
            const idx = (1024 * tile.y + tile.x) << 2;
            png.data[idx] = r;
            png.data[idx + 1] = g;
            png.data[idx + 2] = b;
            png.data[idx + 3] = 255;
        }
        resolve(PNG.sync.write(png));
    });
}

export default async function(app: Router) {
    app.get("/height/:seed.json", (ctx, next) => {
        return new Promise(async (resolve, reject) => {
            const seed: string = ctx.params.seed;
            const buffer = await generateMapImage(seed, false);
            ctx.set("Content-Type", "application/json");
            ctx.body = JSON.stringify({
                ts: Date.now(),
                seed,
                heights,
                colors: [{r: 0, g: 0, b: 0}, {r: 255, g: 255, b: 255}],
                map: `data:image/png;base64,${buffer.toString("base64")}`,
            });
            resolve();
        });
    });
    app.get("/map/:seed.json", (ctx, next) => {
        return new Promise(async (resolve, reject) => {
            const seed: string = ctx.params.seed;
            const buffer = await generateMapImage(seed);
            ctx.set("Content-Type", "application/json");
            ctx.body = JSON.stringify({
                ts: Date.now(),
                seed,
                heights,
                colors: htmlcolor,
                map: `data:image/png;base64,${buffer.toString("base64")}`,
            });
            resolve();
        });
    });
    app.get("/height/:seed", (ctx, next) => {
        return new Promise(async (resolve, reject) => {
            const seed: string = ctx.params.seed;
            let cType = "image/png";
            if (ctx.get("accept") === "application/json") { cType = "application/json"; }
            const buffer = await generateMapImage(seed, false);
            if (cType === "image/png") {
                ctx.set("Content-Disposition", "inline");
                ctx.set("Content-Type", "image/png");
                ctx.body = buffer;
            } else {
                ctx.set("Content-Type", "application/json");
                ctx.body = JSON.stringify({
                    ts: Date.now(),
                    seed,
                    heights,
                    colors: [{r: 0, g: 0, b: 0}, {r: 255, g: 255, b: 255}],
                    map: `data:image/png;base64,${buffer.toString("base64")}`,
                });
            }
            resolve();
        });
    });
    app.get("/map/:seed", (ctx, next) => {
        return new Promise(async (resolve, reject) => {
            const seed: string = ctx.params.seed;
            let cType = "image/png";
            if (ctx.get("accept") === "application/json") { cType = "application/json"; }
            const buffer = await generateMapImage(seed);
            if (cType === "image/png") {
                ctx.set("Content-Disposition", "inline");
                ctx.set("Content-Type", "image/png");
                ctx.body = buffer;
            } else {
                ctx.set("Content-Type", "application/json");
                ctx.body = JSON.stringify({
                    ts: Date.now(),
                    seed,
                    heights,
                    colors: htmlcolor,
                    map: `data:image/png;base64,${buffer.toString("base64")}`,
                });
            }
            resolve();
        });
    });
    app.get("/map", async (ctx) => {
        const seed = await randomGen();
        ctx.redirect(`/api/v1/map/${seed}`);
    });
}
