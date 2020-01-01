// Thank-you Narthollis
export function cancelableTimeoutPromise(ms: number): [() => void, () => void, Promise<void>] {
    let promiseResolve: () => void;
    let promiseReject: () => void;
    let timeoutHandle: ReturnType<typeof setTimeout>;

    return [
        () => {
            clearTimeout(timeoutHandle);
            promiseResolve();
        },
        () => {
            clearTimeout(timeoutHandle);
            promiseReject();
        },
        new Promise((res, rej) => {
            promiseResolve = res;
            promiseReject = rej;

            timeoutHandle = setTimeout(res, ms);
        })
    ];
}

export function resolveableTimeoutPromise(ms: number): [() => void, () => void, Promise<void>] {
    let promiseResolve: () => void;
    let promiseReject: () => void;
    let timeoutHandle: ReturnType<typeof setTimeout>;

    return [
        () => {
            clearTimeout(timeoutHandle);
            promiseResolve();
        },
        () => {
            clearTimeout(timeoutHandle);
            promiseReject();
        },
        new Promise((res, rej) => {
            promiseResolve = res;
            promiseReject = rej;

            timeoutHandle = setTimeout(rej, ms);
        })
    ];
}

export function delay(ms: number): Promise<void> {
    return new Promise((res) => setTimeout(res, ms));
}
