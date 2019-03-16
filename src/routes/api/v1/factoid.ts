import Router from "koa-router";
import request from "../../../lib/request";

export default async function(app: Router) {
    app.get("/factoid", async (ctx, next) => {
        const start: number = Date.now();
        const body = await request.get("http://randomuselessfact.appspot.com/random.json?language=en", { json: true });
        ctx.body = {
            ts: Date.now(),
            responseTime: Date.now() - start,
            fact: body.text,
            api: "http://randomuselessfact.appspot.com",
        };
    });
}