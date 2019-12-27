import { updateTerm } from './updateTerm';
import { getTestServerState, getTestAppendEntriesRequest, getTestRequestVoteRequest } from './testObjects';

test('Term does not update if candidates term is less than followers', () => {
    const serverState = getTestServerState();
    serverState.currentTerm = 100;

    const request = getTestRequestVoteRequest();
    request.candidatesTerm = 1;
    request.lastLogTerm = 1;

    const result = updateTerm(serverState, request);
    expect(result.currentTerm).toBe(100);
});

test('Term does not update if leaders term is less than followers', () => {
    const serverState = getTestServerState();
    serverState.currentTerm = 100;

    const request = getTestAppendEntriesRequest();
    request.leadersTerm = 1;

    const result = updateTerm(serverState, request);
    expect(result.currentTerm).toBe(100);
});

test('Term updates if candidates term is greater than followers', () => {
    const serverState = getTestServerState();
    serverState.currentTerm = 1;

    const request = getTestRequestVoteRequest();
    request.candidatesTerm = 999;
    request.lastLogTerm = 5;

    const result = updateTerm(serverState, request);
    expect(result.currentTerm).toBe(999);
});

test('Term updates if leaders term is greater than followers', () => {
    const serverState = getTestServerState();
    serverState.currentTerm = 1;

    const request = getTestAppendEntriesRequest();
    request.leadersTerm = 100;

    const result = updateTerm(serverState, request);
    expect(result.currentTerm).toBe(100);
});