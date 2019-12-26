import { LogEntry, AppendEntriesRequest, RequestVoteRequest } from "./types";

// These are not proper typeguards, but they are good enough for parsing json, as it is only used
// for parsing the messages sent between the nodes

export function isAppendEntriesRequest(o: unknown): o is AppendEntriesRequest {
    return (o as AppendEntriesRequest).type === 'AppendEntriesRequest';
}

export function isRequestVoteRequest(o: unknown): o is RequestVoteRequest {
    return (o as RequestVoteRequest).type === 'RequestVoteRequest';
}
