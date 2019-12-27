import { ServerState, AppendEntriesRequest, RequestVoteRequest } from "../../types";

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