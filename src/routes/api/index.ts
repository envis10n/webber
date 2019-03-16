import Router from "koa-router";
import { loadRoutes } from "../../lib/routes";

const Routes = new Router({
    prefix: "/api",
});

export default async function(app: Router) {
    await loadRoutes(Routes, __dirname);
    app.use(Routes.routes());
}
