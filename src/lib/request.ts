import request from "request";

namespace Request {
    export function get(url: string,
                        options?: request.CoreOptions): Promise<{[key: string]: any}> {
        return new Promise((resolve, reject) => {
            request.get(url, options, (err, res, body) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(body);
                }
            });
        });
    }
}

export = Request;
