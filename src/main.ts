import { API } from "./modules/network/web";
import bodyParse from "./lib/bodyparse";
import srand from "./lib/rand";

API.post("/api/v1/thanosify", async (res, req) => {
    const start: number = Date.now();
    try {
        res.onAborted((resb) => {
            console.log("Aborted.");
        });
        const body = await bodyParse(res);
        if (body.code) {
            const code: string[] = (body.code as string).split("");
            const result: string[] = [];
            for (const ch of code) {
                const rand: number = await srand();
                if (rand <= 0.5) {
                    result.push(ch);
                }
            }
            res.end(JSON.stringify({
                ts: Date.now(),
                success: true,
                responseTime: Date.now() - start,
                code: "// Thanosified by wEBBER API.\n\n" + result.join(""),
            }));
        }
    } catch (e) {
        console.log(e);
    }
});

API.get("/api/v1/srand", async (res, req) => {
    const start: number = Date.now();
    res.onAborted((resb) => {
        //
    });
    res.end(JSON.stringify({
        ts: Date.now(),
        responseTime: Date.now() - start,
        srand: await srand(),
    }));
});

API.listen("localhost", 3056, (listenSocket) => {
    if (listenSocket === undefined) {
        throw new Error("Unable to listen on port.");
    }
});
