import { App } from "./modules/network/web";
import Routes from "./routes";
import serve from "koa-static";
import cors from "koa-cors";
import path from "path";

(async (): Promise<void> => {
    await Routes(App);
    App.use(serve(path.join(process.cwd(), "public")));
    App.use(
        cors({
            maxAge: 86400,
            origin: true,
            credentials: true,
            methods: ["POST", "GET"],
        })
    );
    App.listen(3056, () => {
        console.log("Koa Webserver Online.");
    });
})();
