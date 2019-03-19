import Router from "koa-router";
import crypto from "crypto";
import { promisify as _p } from "util";
import { fork } from "child_process";
import { Perlin } from "libnoise-ts/module/generator";
import { clamp } from "../../../lib/math";
import { PNG } from "pngjs";
import path from "path";
import { v4 } from "uuid";

declare interface IJob {
    id: string;
    resolve: (data: Buffer) => void;
}

const jobs: Map<string, IJob> = new Map();

// Start worker.

const worker = fork(path.join(process.cwd(), "dist", "modules", "mapping", "worker.js"),
[], {cwd: process.cwd()});

worker.on("message", (data: {id: string, buffer: {type: "buffer", data: Uint8Array}}) => {
    const job = jobs.get(data.id);
    if (!job) {
        throw new Error("Invalid job ID.");
    } else {
        job.resolve(Buffer.from(data.buffer.data));
    }
});

worker.on("exit", (code) => {
    if (code !== 0) {
        throw new Error("[MapGen] Closed with code " + code);
    }
});

function addWork(seed: string, color: boolean): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const job: IJob = {
            id: v4(),
            resolve: (buffer: Buffer) => {
                jobs.delete(job.id);
                resolve(buffer);
            },
        };
        jobs.set(job.id, job);
        worker.send({
            id: job.id,
            seed,
            color,
        });
    });
}

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

async function randomGen(len: number = 16): Promise<string> {
    return (await randomBytes(len * 2)).toString("hex");
}

async function work(seed: string, colors: boolean = true): Promise<Buffer> {
    return await addWork(seed, colors);
}

async function generateMapImage(seed: string, colors: boolean = true): Promise<Buffer> {
    return await work(seed, colors);
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
