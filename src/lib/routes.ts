import path from "path";
import fs from "fs";
import { promisify as _p } from "util";
const readdir = _p(fs.readdir); // tslint:disable-line typedef
const stat = _p(fs.stat); // tslint:disable-line typedef
import { forEach, filter } from "./array";
import Router from "koa-router";
import Koa from "koa";

export interface IFileInfo {
    path: string;
    name: string;
    stat: fs.Stats;
}

export type LoadRouter = (parent: Router | Koa) => Promise<void>;

export async function loadRoutes(Routes: Router | Koa, Path: string): Promise<void> {
    for (const route of (await readRoutes(Path))) {
        if (route.stat.isDirectory()) {
            console.log("Route folder found:", route.name);
            const loadDir: LoadRouter = (await import(route.path)).default;
            await loadDir(Routes);
        } else {
            console.log("Loading route:", route.name);
            const loader: LoadRouter = (await import(route.path)).default;
            await loader(Routes);
        }
    }
}

export async function readRoutes(dir: string): Promise<IFileInfo[]> {
    const files: string[] = await readdir(dir);
    const res: IFileInfo[] = [];
    await forEach<string>(files, async (e) => {
        const p: string = path.join(dir, e);
        const s: fs.Stats = await stat(p);
        const parsed: path.ParsedPath = path.parse(p);
        res.push({
            path: p,
            name: parsed.name,
            stat: s,
        });
    });
    return filter<IFileInfo>(res, async (e) => e.name !== "index");
}
