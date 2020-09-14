import Router from "koa-router";
import { loadRoutes } from "../../lib/routes";

const Routes: Router = new Router({
    prefix: "/api",
});

export default async function (app: Router): Promise<void> {
    await loadRoutes(Routes, __dirname);
    app.options("*", async (ctx, next) => {
        ctx.set("Access-Control-Allow-Origin", "*");
        ctx.set("Access-Control-Allow-Methods", "POST, GET");
        ctx.set("Access-Control-Max-Age", "86400");
    });
    app.use(Routes.routes());
}
