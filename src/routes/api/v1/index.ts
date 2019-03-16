import Router from "koa-router";
import { loadRoutes } from "../../../lib/routes";

const Routes = new Router({
    prefix: "/v1",
});

export default async function(app: Router) {
    // Load routes
    await loadRoutes(Routes, __dirname);
    app.use(Routes.routes());
}
