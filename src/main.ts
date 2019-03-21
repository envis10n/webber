import { App } from "./modules/network/web";
import Routes from "./routes";

(async (): Promise<void> => {
    await Routes(App);
    App.listen(3056, () => {
        console.log("Koa Webserver Online.");
    });
})();
