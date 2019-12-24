import WebSocket from "ws";

import { StatusType, ServerState, ServerConfig, AppendEntriesRequest, ProcessAppendEntries, StoreIndex, LogEntry, RequestVoteRequest, RequestVoteReply } from "../types";
import { resolveableTimeoutPromise } from "../utilities";
import e from "express";

export function updateTerm(serverState: ServerState, request: RequestVoteRequest | AppendEntriesRequest) {
    let term = serverState.currentTerm;
    if (request.type === 'RequestVoteRequest') {
        term = Math.max(request.candidatesTerm, serverState.currentTerm);
    }

    if (request.type === 'AppendEntriesRequest') {
        term = Math.max(request.leadersTerm, serverState.currentTerm);
    }

    return {
        ...serverState,
        currentTerm: term
    };
}

export function processRequestVote(serverState: ServerState, request: RequestVoteRequest): RequestVoteReply {
    if (request.candidatesTerm < serverState.currentTerm) {
        return {
            voteGranted: false,
            currentTerm: serverState.currentTerm
        };
    }

    if (serverState.votedFor != null && serverState.votedFor !== request.candidateId) {
        return {
            voteGranted: false,
            currentTerm: serverState.currentTerm
        };
    }

    // The candidates log must be at least as up-to-date as the receiver's log.
    // If the logs have last entries with different terms, the log with the later term is more up-to-date
    // If the logs have the same last entry terms, the longer log is more up-to-date
    const lastEntry = serverState.log[serverState.log.length - 1];


    if (lastEntry == null
        || lastEntry.term < request.lastLogTerm
        || lastEntry.term === request.lastLogTerm && serverState.log.length - 1 <= request.lastLogIndex
    ) {
        return {
            voteGranted: true,
            currentTerm: serverState.currentTerm
        };
    } else {
        return {
            voteGranted: false,
            currentTerm: serverState.currentTerm
        };
    }
}

export function processAppendEntries(serverState: ServerState, request: AppendEntriesRequest, updateStoreFunc: UpdateStore): ProcessAppendEntries {
    if (request.leadersTerm < serverState.currentTerm) {
        return {state: serverState, success: false};
    }

    // If log does not contain an entry at prevLogIndex, or if that entries term does not match the prev log term
    if (request.prevLogIndex != null &&
        (serverState.log[request.prevLogIndex] == null || serverState.log[request.prevLogIndex].term != request.prevLogTerm)) {
        return {state: {...serverState}, success: false};
    }

    // TODO How does a new leader find out the prev log index of each follower?
    const nextIndex = (request.prevLogIndex || -1) + 1;
    const logEntries = request.entries.map(e => ({...e, term: request.leadersTerm}));
    const entries = serverState.log.slice(0, nextIndex).concat(logEntries);
    
    let commitIndex = serverState.commitIndex;
    if (request.leaderCommit != null) {
        commitIndex = request.leaderCommit > (serverState.commitIndex || -1) ? Math.min(request.leaderCommit, entries.length - 1) : serverState.commitIndex;
    }

    const nextState: ServerState = {
        currentTerm: serverState.currentTerm,
        votedFor: serverState.votedFor,
        log: entries,
        commitIndex,
        lastApplied: serverState.lastApplied,
        status: serverState.status,
        store: serverState.store
    };

    let finalState = nextState;
    if (commitIndex != serverState.commitIndex) {
        finalState = updateStoreFunc(nextState);
    }

    return {
        state: finalState,
        success: true
    };
}

// updates the store and the last applied
type UpdateStore = typeof updateStore;
export function updateStore(serverState: ServerState): ServerState {
    if (serverState.commitIndex == null) {
        return serverState;
    }

    const nextIndex = serverState.lastApplied == null ? 0 : serverState.lastApplied + 1;
    let store = serverState.store;
    for (let i = nextIndex; i <= serverState.commitIndex; i++) {
        store = applyEntry(store, serverState.log[i]);
    }

    const lastApplied = serverState.commitIndex;
    return {
        ...serverState,
        store,
        lastApplied
    };
}

export function applyEntry(store: StoreIndex, entry: LogEntry): StoreIndex {
    const key = entry.key;
    const value = entry.value;

    return {
        ...store,
        [key]: value
    };
}

export async function follower(serverConfig: ServerConfig, serverState: ServerState): Promise<ServerState> {
    const wss = new WebSocket.Server({port: serverConfig.wssPort});

    wss.on('connection', function connection(websocket) {
        websocket.on('message', function incoming(message) {
            
        })

        websocket.send(`You have connected to ${serverConfig.serverName}.`);
    });

    const [resolve, promise] = resolveableTimeoutPromise(serverConfig.heartbeat);

    let hasRecentHeartbeat = true;
    while (hasRecentHeartbeat) {
        try {
            await promise;
        } catch {
            hasRecentHeartbeat = false;
        }
    }

    
    wss.close();
    
    const newState = {...serverState, status: StatusType.Candidate};
    return newState;
}
