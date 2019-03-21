import Router from "koa-router";
import srand from "../../../lib/rand";

export default async function(app: Router): Promise<void> {
    app.get("/srand", async (ctx, next) => {
        const start: number = Date.now();
        ctx.body = {
            ts: Date.now(),
            responseTime: Date.now() - start,
            srand: await srand(),
        };
    });
}
