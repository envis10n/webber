import { promisify as _p } from "util";
import crypto from "crypto";

export default async function(): Promise<number> {
    return parseInt((await _p(crypto.randomBytes)(8)).toString("hex"), 16) / 18446744073709552000;
}
