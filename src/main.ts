import { App } from "./modules/network/web";
import Routes from "./routes";
import serve from "koa-static";
import path from "path";

(async (): Promise<void> => {
    await Routes(App);
    App.use(serve(path.join(process.cwd(), "public")));
    App.use(async (ctx, next) => {
        ctx.set("Access-Control-Allow-Origin", "*");
        ctx.set("Access-Control-Allow-Methods", "POST, GET");
        ctx.set("Access-Control-Max-Age", "86400");
        await next();
    });
    App.listen(3056, () => {
        console.log("Koa Webserver Online.");
    });
})();
