export enum StatusType {Leader, Follower, Candidate};

export interface RequestLogEntry {
    key: string;
    value: string;
}

export interface LogEntry {
    key: string;
    value: string;
    term: number;
}

export interface AppendEntriesRequest {
    leadersTerm: number;
    leaderId: string;
    prevLogIndex: number | null;
    prevLogTerm: number | null;
    entries: Array<RequestLogEntry>;
    leaderCommit: number | null;
    type: 'AppendEntriesRequest';
}

export interface AppendEntriesReply {
    success: boolean;
    currentTerm: number;
}

export interface RequestVoteRequest {
    candidatesTerm: number;
    candidateId: string;
    lastLogIndex: number | null;
    lastLogTerm: number | null;
    type: 'RequestVoteRequest';
}

export interface RequestVoteReply {
    voteGranted: boolean;
    currentTerm: number;
}

export interface StoreIndex {
    [index: string]: string | undefined;
} 

export interface ServerState {
    currentTerm: number;
    votedFor: null | string;
    log: Array<LogEntry>;
    commitIndex: number | null;
    lastApplied: number | null;
    status: StatusType;
    store: StoreIndex;
}

export interface ProcessAppendEntries {
    state: ServerState;
    success: boolean;
}

export interface ServerConfig {
    serverName: string;
    apiPort: number;
    wssPort: number;
    heartbeat: number;
}
