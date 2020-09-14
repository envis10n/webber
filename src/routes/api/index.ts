import Router from "koa-router";
import { loadRoutes } from "../../lib/routes";

const Routes: Router = new Router({
    prefix: "/api",
});

export default async function (app: Router): Promise<void> {
    await loadRoutes(Routes, __dirname);
    app.use(Routes.routes());
}
