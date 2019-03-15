import { HttpResponse } from "uWebSockets.js";
export default function(res: HttpResponse ): Promise<{ [key: string]: any }> {
    return new Promise((resolve, reject) => {
        let buffer: Buffer;
        res.onData((ab, isLast) => {
            const chunk = Buffer.from(ab);
            if (isLast) {
                let json: {[key: string]: any};
                if (buffer) {
                    try {
                        json = JSON.parse(Buffer.concat([buffer, chunk]).toString());
                        resolve(json);
                    } catch (e) {
                        reject(new TypeError("Invalid JSON."));
                    }
                } else {
                    try {
                        json = JSON.parse(chunk.toString());
                        resolve(json);
                    } catch (e) {
                        reject(new TypeError("Invalid JSON."));
                    }
                }
            } else {
                if (buffer) {
                    buffer = Buffer.concat([buffer, chunk]);
                } else {
                    buffer = Buffer.concat([chunk]);
                }
            }
        });
    });
}
