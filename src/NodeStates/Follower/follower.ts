import WebSocket from "ws";

import { WebsocketWithPromise } from '../../WebsocketWithPromise';
import { StatusType, ServerState, ServerConfig, AppendEntriesRequest, AppendEntriesReply, ProcessAppendEntries, ProcessRequestVote, StoreIndex, LogEntry, RequestVoteRequest, RequestVoteReply } from "../../types";
import { isAppendEntriesRequest, isRequestVoteRequest } from '../../typeguards';
import { resolveableTimeoutPromise, delay } from "../../utilities";
import e, { request } from "express";



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

export function processRequestVote(serverState: ServerState, request: RequestVoteRequest): ProcessRequestVote {
    if (request.candidatesTerm < serverState.currentTerm) {
        return {
            voteGranted: false,
            state: serverState
        };
    }

    if (serverState.votedFor != null && serverState.votedFor !== request.candidateId) {
        return {
            voteGranted: false,
            state: serverState
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
        const nextState = {
            ...serverState,
            votedFor: request.candidateId
        };

        return {
            voteGranted: true,
            state: nextState
        };
    } else {
        return {
            voteGranted: false,
            state: serverState
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

export function parseMessage(message: string): RequestVoteRequest | AppendEntriesRequest | null {
    try {
        const obj = JSON.parse(message);
        if (isAppendEntriesRequest(obj)) {
            return obj;
        }
        if (isRequestVoteRequest(obj)) {
            return obj;
        }

        return null;
    } catch {
        return null;
    }
}

export function validHeartbeat(message: RequestVoteRequest | AppendEntriesRequest | null): boolean {
    return true;
}

interface ProcessMessage {
    state: ServerState;
    response: string;
}

function processMessage(serverState: ServerState, message: RequestVoteRequest | AppendEntriesRequest): ProcessMessage {
    let state = updateTerm(serverState, message);
    let response = '';
    switch (message.type) {
        case 'AppendEntriesRequest': {
            const result = processAppendEntries(state, message, updateStore);
            state = result.state;

            const responseObj: AppendEntriesReply = {
                success: result.success,
                currentTerm: state.currentTerm
            };
            response = JSON.stringify(responseObj);
            break;
        }
        case 'RequestVoteRequest': {
            const result = processRequestVote(state, message);
            state = result.state;

            const responseObj: RequestVoteReply = {
                currentTerm: result.state.currentTerm,
                voteGranted: result.voteGranted
            }
            response = JSON.stringify(responseObj);
            break;
        }
        default:
            throw 'Message type unknown';
    }

    return {
        response,
        state
    };
}

export async function follower(serverConfig: ServerConfig, serverState: ServerState): Promise<ServerState> {
    const wss = new WebSocket.Server({port: serverConfig.wssPort});

    let state = serverState;

    wss.on('connection', function connection(websocket: WebsocketWithPromise) {
        const [resolve, promise] = resolveableTimeoutPromise(serverConfig.heartbeat);
        websocket.promise = promise;
        websocket.resolve = resolve;

        websocket.on('message', function incoming(message: string) {
            const parsedMessage = parseMessage(message); 

            if (parsedMessage != null) {
                if (validHeartbeat(parsedMessage)) {
                    websocket.resolve();
                }

                const result = processMessage(state, parsedMessage);
                state = result.state;
                websocket.send(result.response);
            }
            
            const [resolve, promise] = resolveableTimeoutPromise(serverConfig.heartbeat);
            websocket.promise = promise;
            websocket.resolve = resolve;
        });
    });

    // Delay to initialise connection to leader
    if (wss.clients.size === 0) {
        await delay(serverConfig.heartbeat);
    }

    let hasRecentHeartbeat = false;
    while(hasRecentHeartbeat) {
        hasRecentHeartbeat = false;

        const clients: Array<WebsocketWithPromise> = [...wss.clients];

        for (let i = 0; i <= clients.length; i++) {
            try {
                if (clients[i].promise != null) {
                    await clients[i].promise;
                    hasRecentHeartbeat = true;
                }
            } catch {
                // hasRecentHeartbeat was initialised to false
            }
        };
    };

    wss.close();
    
    const newState = {...serverState, status: StatusType.Candidate};
    return newState;
}
