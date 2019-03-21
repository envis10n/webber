import Koa from "koa";
import bodyParser from "koa-bodyparser";

export const App: Koa = new Koa();

App.use(bodyParser());
