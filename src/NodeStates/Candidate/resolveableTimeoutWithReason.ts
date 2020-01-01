export enum ResolveReason {
    'RecognisedLeader',
    'Timeout',
    'RequiredVotesReceived',
    'SplitVote',
    'RequestVoteWithHigherTerm'
}

export function resolveableTimeoutWithReason(ms: number): [(reason: ResolveReason) => void, Promise<ResolveReason>] {
    let promiseResolve: () => void;
    let promiseReject: () => void;
    let timeoutHandle: ReturnType<typeof setTimeout>;

    return [
        () => {
            clearTimeout(timeoutHandle);
            promiseResolve();
        },
        new Promise((res, rej) => {
            promiseResolve = res;
            promiseReject = rej;

            timeoutHandle = setTimeout((res) => res(ResolveReason.Timeout), ms);
        })
    ];
}
