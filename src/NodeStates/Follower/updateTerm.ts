import { ServerState, AppendEntriesRequest, RequestVoteRequest } from "../../types";

export function updateTerm(serverState: ServerState, request: RequestVoteRequest | AppendEntriesRequest): ServerState {
    let term = serverState.currentTerm;
    if (request.type === 'RequestVoteRequest') {
        term = Math.max(request.candidatesTerm, serverState.currentTerm);
    }

    if (request.type === 'AppendEntriesRequest') {
        term = Math.max(request.leadersTerm, serverState.currentTerm);
    }

    const votedFor = term != serverState.currentTerm ? null : serverState.votedFor;

    return {
        ...serverState,
        currentTerm: term,
        votedFor
    };
}