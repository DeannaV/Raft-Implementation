import WebSocket from "ws";
import { ServerConfig, ServerState, StatusType, AppendEntriesRequest, LogEntry, RequestVoteRequest, RequestLogEntry } from '../../types';

export const TEST_SERVER_CONFIG: ServerConfig = {
    serverName: "Test01",
    apiPort: 8080,
    wssPort: 5010,
    heartbeat: 1000
}

export function getTestServerConfig() {
    return {...TEST_SERVER_CONFIG};
}

export const TEST_SERVER_STATE: ServerState = {
    currentTerm: 1,
    votedFor: null,
    log: [],
    commitIndex: null,
    lastApplied: null,
    status: StatusType.Follower,
    store: {}
}

export function getTestServerState() {
    return {...TEST_SERVER_STATE, log: [...TEST_SERVER_STATE.log]}
}

export const TEST_APPEND_ENTRIES_REQUEST: AppendEntriesRequest = {
    leadersTerm: 1,
    leaderId: 'Leader01',
    prevLogIndex: null,
    prevLogTerm: null,
    entries: [],
    leaderCommit: null,
    type: 'AppendEntriesRequest'
};

export function getTestAppendEntriesRequest() {
    return {...TEST_APPEND_ENTRIES_REQUEST, entries: [] as Array<RequestLogEntry>}
}

export const TEST_ENTRIES: Array<LogEntry> = [
    {
        key: "one",
        value: "ONE",
        term: 1
    },
    {
        key: "two",
        value: "TWO",
        term: 2
    },
    {
        key: "three",
        value: "THREE",
        term: 3
    },
];

export function getTestEntries() {
    return TEST_ENTRIES.map(e => ({...e}));
}

export const TEST_REQUEST_VOTE_REQUEST: RequestVoteRequest = {
    candidatesTerm: 1,
    candidateId: "Candidate01",
    lastLogIndex: null,
    lastLogTerm: null,
    type: 'RequestVoteRequest'
};

export function getTestRequestVoteRequest() {
    return {...TEST_REQUEST_VOTE_REQUEST};
}

export function getMockWebSocketServer(): WebSocket.Server {
    return {
        on: jest.fn(),
        close: jest.fn(),
        clients: [],
    } as unknown as WebSocket.Server;
}

export function MockDelay(_: number): Promise<void> {
    return new Promise((res) => res());
} 