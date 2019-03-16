import Router from "koa-router";
import srand from "../../../lib/rand";

export default async function(app: Router) {
    app.post("/thanosify", async (ctx, next) => {
        const start: number = Date.now();
        try {
            const body = ctx.request.body;
            if (body.code) {
                const code: string[] = (body.code as string).split("");
                const result: string[] = [];
                for (const ch of code) {
                    const rand: number = await srand();
                    if (rand <= 0.5) {
                        result.push(ch);
                    }
                }
                ctx.body = {
                    ts: Date.now(),
                    success: true,
                    responseTime: Date.now() - start,
                    code: "// Thanosified by wEBBER API.\n\n" + result.join(""),
                };
            }
        } catch (e) {
            ctx.body = {
                ts: Date.now(),
                success: false,
                error: e.message,
            };
        }
    });
}
