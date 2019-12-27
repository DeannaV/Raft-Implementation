
import { ServerState, AppendEntriesRequest, ProcessAppendEntries } from "../../types";
import { UpdateStore } from './updateStore';

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
