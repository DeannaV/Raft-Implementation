import { ServerState, ProcessRequestVote, RequestVoteRequest } from "../../types";

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
