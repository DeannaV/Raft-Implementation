import WebSocket from "ws";

import { StatusType, ServerState, ServerConfig, AppendEntriesRequest, ProcessAppendEntries, StoreIndex, LogEntry } from "../types";
import { resolveableTimeoutPromise } from "../utilities";
import e from "express";

export function getNextState(serverState: ServerState, request: AppendEntriesRequest): ProcessAppendEntries {
    if (request.leadersTerm < serverState.currentTerm) {
        return {state: serverState, success: false};
    }

    const currentTerm = request.leadersTerm;
 
    if (request.prevLogIndex != null &&
        (serverState.log[request.prevLogIndex] == null || serverState.log[request.prevLogIndex].term != request.prevLogTerm)) {
        return {state: {...serverState, currentTerm}, success: false};
    }

    // TODO How does a new leader find out the prev log index of each follower?
    // Is this code correct for prevLogIndex == null
    const nextIndex = (request.prevLogIndex || -1) + 1;
    const logEntries = request.entries.map(e => ({...e, term: request.leadersTerm}));
    const entries = serverState.log.slice(0, nextIndex).concat(logEntries);
    
    let commitIndex = serverState.commitIndex;
    if (request.leaderCommit != null) {
        commitIndex = request.leaderCommit > (serverState.commitIndex || -1) ? Math.min(request.leaderCommit, entries.length - 1) : serverState.commitIndex;
    }

    return {
        state: {
            currentTerm,
            votedFor: serverState.votedFor,
            log: entries,
            commitIndex,
            lastApplied: serverState.lastApplied,
            status: serverState.status,
            store: serverState.store
        },
        success: true
    };
}

// updates the store and the last applied
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
