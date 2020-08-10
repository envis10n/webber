import Router from "koa-router";
import { exec } from "child_process";
import stripAnsi from "strip-ansi";
import Path from "path";
import fs, { existsSync } from "fs";

interface IDenoResult {
    runtime: number;
    output: string;
    hadError: boolean;
    fileName: string;
}

interface IDenoVersion {
    deno: string;
    v8: string;
    typescript: string;
}

export async function denoVersion(): Promise<string> {
    return await new Promise((resolve, reject) => {
        exec("deno --version", (err, stdout, stderr) => {
            if (err) reject(err);
            else resolve(stripAnsi(stdout.trim()));
        });
    });
}

export async function denoEval(lang: "ts" | "js", code: string, id: string): Promise<IDenoResult> {
    return await new Promise((resolve, reject) => {
        const fExt = lang;
        const fPath = Path.resolve(process.cwd(), "script_runs", `_${id}.${fExt}`);
        if (existsSync(fPath)) reject("Script already running.");
        else {
            const _start = Date.now();
            const src = `const __programStart = ${_start};\nconst __canRun = () => Date.now() - __programStart <= 5000;${code}`;
            fs.writeFileSync(fPath, src);
            exec(`deno run ${fPath}`, {timeout: 5000}, (err, stdout, stderr) => {
                const runtime = Date.now() - _start;
                fs.unlinkSync(fPath);
                let output = "";
                let hadError = false;
                if (err) {
                    hadError = true;
                    if (err.killed) {
                        output = "error: Script timed out.";
                    } else if (stderr.trim().length > 0) {
                        const s1 = stripAnsi(stderr.trim()).split("\n").slice(1);
                        let s2 = s1[0];
                        if (s1.length > 2) s2 = s1.join("\n");
                        output = s2.replace(new RegExp(fPath.replace(/\\/g, "/"), 'g'), `_${id}.${fExt}`);
                    } else {
                        output = err.message;
                    }
                } else {
                    output = stripAnsi(stdout.trim());
                }
                resolve({
                    output,
                    hadError,
                    runtime,
                    fileName: `_${id}.${fExt}`,
                });
            });
        }
    });
}

interface IDenoResponse {
    ts?: number;
    responseTime?: number;
    error?: string;
    version?: IDenoVersion;
    eval?: IDenoResult;
}

export default async function(app: Router): Promise<void> {
    // Get version
    app.get("/deno", async (ctx, next) => {
        const start: number = Date.now();
        const resp: IDenoResponse = {}
        try {
            const res = await denoVersion();
            const resv = res.split("\n").map((l) => l.split(" ")[1]);
            resp.version = {
                deno: resv[0],
                v8: resv[1],
                typescript: resv[2],
            };
        } catch(e) {
            resp.error = e.message;
        }
        resp.ts = Date.now();
        resp.responseTime = Date.now() - start;
        ctx.body = resp;
    });

    // Eval
    app.post("/deno", async (ctx, next) => {
        const start: number = Date.now();
        const resp: IDenoResponse = {};
        const body: {
            [key: string]: any; // tslint:disable-line no-any
        } = ctx.request.body;
        if (body.source == undefined || body.language == undefined || body.id == undefined) {
            resp.error = "Missing required field(s). Please provide the source, language, and id of this eval session.";
        } else {
            if (typeof(body.source) == "string" && typeof(body.language) == "string"  && typeof(body.id) == "string") {
                if (body.language !== "ts" && body.language !== "js") {
                    resp.error = "Unsupported language. Supported languages are: ts, js";
                } else {
                    try {
                        resp.eval = await denoEval(body.language, body.source, body.id);
                    } catch (e) {
                        resp.error = e.message;
                    }
                }
            } else {
                resp.error = "All provided fields must be strings.";
            }
        }
        resp.ts = Date.now();
        resp.responseTime = Date.now() - start;
        ctx.body = resp;
    });
}