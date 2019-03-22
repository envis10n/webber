import path from "path";
import fs from "fs";
import { promisify as _p } from "util";

const readFile = _p(fs.readFile); // tslint:disable-line typedef

const viewRoot: string = path.join(process.cwd(), "views");

export default async function(view: string,
                              data?: { [key: string]: any; }): Promise<string> { // tslint:disable-line no-any
    const p: string = path.join(viewRoot, view + ".html");
    let d: string = (await readFile(p)).toString();
    if (data !== undefined) {
        for (const key of Object.keys(data)) {
            const val: any = data[key]; // tslint:disable-line no-any
            d = d.replace(new RegExp(`{{${key}}}`, "g"), val);
        }
    }
    return d;
}
