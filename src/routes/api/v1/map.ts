import Router from "koa-router";
import crypto from "crypto";
import { promisify as _p } from "util";
import path from "path";
import fs from "fs";
import generatePerlin from "../../../lib/perlin";
import { Perlin } from "libnoise-ts/module/generator";
import { clamp } from "../../../lib/math";
import { PNG } from "pngjs";

const type = [
    "ocean",
    "water",
    "sand",
    "dirt",
    "grass",
    "rock",
    "snow",
];

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

const readFile = _p(fs.readFile);

const randomBytes = _p(crypto.randomBytes);

const exists = _p(fs.exists);

declare interface ITileData {
    x: number;
    y: number;
    type: number;
    height: number;
    gradient: number;
}

async function mapExists(seed: string): Promise<boolean> {
    const p = path.join(process.cwd(), "storage", "maps", seed + ".png");
    return await exists(p);
}

async function readMap(seed: string): Promise<Buffer> {
    const p = path.join(process.cwd(), "storage", "maps", seed + ".png");
    return await readFile(p);
}

function writeToStream(seed: string): fs.WriteStream {
    const p = path.join(process.cwd(), "storage", "maps", seed + ".png");
    return fs.createWriteStream(p);
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

function generateMapImage(seed?: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
        if (seed === undefined) { seed = await randomGen(); }
        const map = await generateMap(seed, 1024, 1024);
        const png = new PNG({
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
            const color = htmlcolor[tile.type];
            const idx = (1024 * tile.y + tile.x) << 2;
            png.data[idx] = color.r;
            png.data[idx + 1] = color.g;
            png.data[idx + 2] = color.b;
            png.data[idx + 3] = 255;
        }
        png.pack().pipe(writeToStream(seed)).on("finish", async () => {
            resolve(seed);
        });
    });
}

export default async function(app: Router) {
    app.get("/map/:seed", (ctx, next) => {
        return new Promise(async (resolve, reject) => {
            const seed: string = ctx.params.seed;
            let cType = "image/png";
            if (ctx.get("accept") === "application/json") { cType = "application/json"; }
            if (!(await mapExists(seed))) { await generateMapImage(seed); }
            // Map exists, load and serve.
            const buffer = await readMap(seed);
            if (cType === "image/png") {
                ctx.set("Content-Disposition", "inline");
                ctx.set("Content-Type", "image/png");
                ctx.body = buffer;
            } else {
                ctx.set("Content-Type", "application/json");
                ctx.body = JSON.stringify({
                    ts: Date.now(),
                    seed,
                    map: `data:image/png;base64,${buffer.toString("base64")}`,
                });
            }
            resolve();
        });
    });
    app.get("/map", async (ctx) => {
        const seed = await generateMapImage();
        ctx.redirect(`/api/v1/map/${seed}`);
    });
}
