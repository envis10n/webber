import * as crypto from "crypto";
import Router from "koa-router";

function srand(): number {
    return (
        parseInt(crypto.randomBytes(8).toString("hex"), 16) /
        18446744073709552000
    );
}

function srange(
    max: number = 1,
    min: number = 0,
    round: boolean = true
): number {
    const res: number = srand() * (max - min) + min;
    return round ? Math.round(res) : res;
}

function randomElement<T>(arr: T[]): T {
    return arr[srange(arr.length - 1)];
}

export interface IMarkov {
    prefixes: string[];
    suffixes: { [key: string]: string[] };
}

function markov(text: string, n: number = 2): IMarkov {
    const prefixes: string[] = [];
    const suffixes: { [key: string]: string[] } = {};
    const temp: string[] = text.split(" ");
    for (let i: number = 0; i < temp.length; i++) {
        const index: number = i + n > temp.length - 1 ? temp.length - 1 : i + n;
        const t: string[] = temp.slice(i, index);
        const prefix: string = t.join(" ");
        if (prefix.length > 0) {
            const suffix: string = temp[i + n];
            if (suffix !== undefined) {
                if (suffixes[prefix] !== undefined) {
                    suffixes[prefix].push(suffix);
                } else {
                    suffixes[prefix] = [suffix];
                }
            }
            prefixes.push(prefix);
        }
    }
    return { prefixes, suffixes };
}

function generate(mark: IMarkov, length: number): string {
    const res: string[] = [];
    let prefix: string = randomElement(mark.prefixes);
    res.push(prefix);
    let suffix: string = "";
    while (res.join(" ").split(" ").length < length) {
        if (mark.suffixes[prefix] !== undefined) {
            suffix =
                mark.suffixes[prefix].length > 1
                    ? randomElement(mark.suffixes[prefix])
                    : mark.suffixes[prefix][0];
        } else {
            let tp: string;
            while (true) {
                tp = randomElement(mark.prefixes);
                if (mark.suffixes[tp] !== undefined) {
                    break;
                }
            }
            prefix = tp;
            suffix =
                mark.suffixes[prefix].length > 1
                    ? randomElement(mark.suffixes[prefix])
                    : mark.suffixes[prefix][0];
        }
        res.push(suffix);
        const t: string[] = prefix.split(" ");
        prefix = t[t.length - 1] + " " + suffix;
    }
    return res.join(" ");
}

export default async function (app: Router): Promise<void> {
    app.options("/markov", async (ctx, next) => {
        ctx.set("Access-Control-Allow-Origin", "*");
        ctx.set("Access-Control-Allow-Methods", "POST, GET");
        ctx.set("Access-Control-Max-Age", "86400");
        ctx.body = "";
    });
    app.post("/markov", async (ctx, next) => {
        const start: number = Date.now();
        const body: {
            [key: string]: any; // tslint:disable-line no-any
        } = ctx.request.body;
        if (body.input !== undefined && typeof body.input === "string") {
            let len: number = 200;
            if (
                body.length !== undefined &&
                typeof body.length === "number" &&
                !isNaN(body.length)
            ) {
                len = body.length;
            }
            try {
                const m: IMarkov = markov(body.input, 2);
                const res: string = generate(m, len);
                ctx.body = {
                    ts: Date.now(),
                    success: true,
                    responseTime: Date.now() - start,
                    output: res,
                };
            } catch (e) {
                ctx.body = {
                    ts: Date.now(),
                    success: false,
                    error: e.message,
                };
            }
        }
    });
}
