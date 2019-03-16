import Koa from "koa";
import bodyParser from "koa-bodyparser";

export const App = new Koa();

App.use(bodyParser());
