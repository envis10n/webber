import Router from "koa-router";
import srand from "../../../lib/rand";
import { filter } from "../../../lib/array";

export default async function(app: Router): Promise<void> {
    app.post("/thanosify", async (ctx, next) => {
        const start: number = Date.now();
        try {
            const body: {
                [key: string]: any; // tslint:disable-line no-any
            } = ctx.request.body;
            if (body.code) {
                ctx.body = {
                    ts: Date.now(),
                    success: true,
                    responseTime: Date.now() - start,
                    code:
                        "// Thanosified by wEBBER API.\n\n" +
                        (await filter(
                            (body.code as string).split(""),
                            async (ch) => (await srand()) <= 0.5,
                        )).join(""),
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
