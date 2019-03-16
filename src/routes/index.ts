import Router from "koa-router";
import Koa from "koa";
import { loadRoutes } from "../lib/routes";

export type LoadRouter = (parent: Router) => Router;

const Routes = new Router();

export default async function(app: Koa) {
    // Load routes
    console.log("Loading routes...");
    await loadRoutes(Routes, __dirname);
    console.log("Done.");
    app.use(Routes.routes());
}
