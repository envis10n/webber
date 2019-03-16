export async function filter<T>(arr: T[],
                                callbackfn: (element: T, index?: number, array?: T[])
        => Promise<boolean | undefined>): Promise<T[]> {
    const res: T[] = [];
    for (let i = 0; i < arr.length; i++) {
        if (await callbackfn(arr[i], i, arr)) {
            res.push(arr[i]);
        }
    }
    return res;
}

export async function forEach<T>(arr: T[],
                                 callbackfn: (element: T, index?: number, array?: T[])
                                 => Promise<void>): Promise<void> {
    for (let i = 0; i < arr.length; i++) {
        await callbackfn(arr[i], i, arr);
    }
}
