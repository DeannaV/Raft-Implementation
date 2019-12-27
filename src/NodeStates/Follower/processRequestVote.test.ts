import { processRequestVote } from './processRequestVote';
import { getTestServerState, getTestRequestVoteRequest} from './testObjects';

test('Vote is denied when candidates term is less than followers', () => {
    const serverState = getTestServerState();
    serverState.currentTerm = 5;

    const request = getTestRequestVoteRequest();
    request.candidatesTerm = 1;
    request.lastLogIndex = 999;
    request.lastLogTerm = 999;

    const result = processRequestVote(serverState, request);
    expect(result.voteGranted).toBe(false);
});

test('Follower returns its current term in response', () => {
    const serverState = getTestServerState();
    serverState.currentTerm = 5;

    const request = getTestRequestVoteRequest();
    request.candidatesTerm = 1;
    request.lastLogIndex = 999;
    request.lastLogTerm = 999;

    const result = processRequestVote(serverState, request);
    expect(result.state.currentTerm).toBe(5);
});

test('Vote is denied when follower has already voted for someone else ', () => {
    const serverState = getTestServerState();
    serverState.currentTerm = 1;
    serverState.votedFor = "Candidate04";

    const request = getTestRequestVoteRequest();
    request.candidatesTerm = 999;
    request.lastLogIndex = 999;
    request.lastLogTerm = 999;
    request.candidateId = "Candidate01";

    const result = processRequestVote(serverState, request);
    expect(result.voteGranted).toBe(false);
});

test('Vote is denied when candidates log has lower term than followers - log term is null', () => {
    const serverState = getTestServerState();
    serverState.currentTerm = 1;
    serverState.log = [
        {
            key: "four",
            value: "FOUR",
            term: 999
        }
    ];

    const request = getTestRequestVoteRequest();
    request.candidatesTerm = 999;
    request.lastLogIndex = 999;
    request.lastLogTerm = null;

    const result = processRequestVote(serverState, request);
    expect(result.voteGranted).toBe(false);
});

test('Vote is denied when candidates log has lower term than followers', () => {
    const serverState = getTestServerState();
    serverState.currentTerm = 1;
    serverState.log = [
        {
            key: "four",
            value: "FOUR",
            term: 999
        }
    ];

    const request = getTestRequestVoteRequest();
    request.candidatesTerm = 999;
    request.lastLogIndex = 999;
    request.lastLogTerm = 1;

    const result = processRequestVote(serverState, request);
    expect(result.voteGranted).toBe(false);
});


test('Vote is denied when candidates log index is less than than followers last entry index - candidate log index is null', () => {
    const serverState = getTestServerState();
    serverState.currentTerm = 1;
    serverState.log = [
        {
            key: "four",
            value: "FOUR",
            term: 1
        },
        {
            key: "five",
            value: "FIVE",
            term: 1
        },
        {
            key: "six",
            value: "SIX",
            term: 1
        }
    ];

    const request = getTestRequestVoteRequest();
    request.candidatesTerm = 999;
    request.lastLogIndex = null;
    request.lastLogTerm = 1;

    const result = processRequestVote(serverState, request);
    expect(result.voteGranted).toBe(false);
});

test('Vote is denied when candidates log index is less than than followers last entry index', () => {
    const serverState = getTestServerState();
    serverState.currentTerm = 1;
    serverState.log = [
        {
            key: "four",
            value: "FOUR",
            term: 1
        },
        {
            key: "five",
            value: "FIVE",
            term: 1
        },
        {
            key: "six",
            value: "SIX",
            term: 1
        }
    ];

    const request = getTestRequestVoteRequest();
    request.candidatesTerm = 999;
    request.lastLogIndex = 0;
    request.lastLogTerm = 1;

    const result = processRequestVote(serverState, request);
    expect(result.voteGranted).toBe(false);
});

test('Vote is successful, as many values are null as possible', () => {
    const serverState = getTestServerState();
    serverState.currentTerm = 1;

    const request = getTestRequestVoteRequest();
    request.candidatesTerm = 1;
    request.lastLogIndex = null;
    request.lastLogTerm = null;

    const result = processRequestVote(serverState, request);
    expect(result.voteGranted).toBe(true);
});

test('Vote is successful, candidates last log term is greater than servers', () => {
    const serverState = getTestServerState();
    serverState.currentTerm = 1;
    serverState.log = [
        {
            key: "four",
            value: "FOUR",
            term: 1
        },
    ];

    const request = getTestRequestVoteRequest();
    request.candidatesTerm = 5;
    request.lastLogIndex = 0;
    request.lastLogTerm = 2;

    const result = processRequestVote(serverState, request);
    expect(result.voteGranted).toBe(true);
});

test('Vote is successful, candidates last log term is equal to servers, last log index is larger', () => {
    const serverState = getTestServerState();
    serverState.currentTerm = 1;
    serverState.log = [
        {
            key: "four",
            value: "FOUR",
            term: 1
        },
    ];

    const request = getTestRequestVoteRequest();
    request.candidatesTerm = 5;
    request.lastLogIndex = 999;
    request.lastLogTerm = 1;

    const result = processRequestVote(serverState, request);
    expect(result.voteGranted).toBe(true);
});

test('Vote is successful, candidates last log term is equal to servers, last log index is the same', () => {
    const serverState = getTestServerState();
    serverState.currentTerm = 1;
    serverState.log = [
        {
            key: "four",
            value: "FOUR",
            term: 1
        },
    ];

    const request = getTestRequestVoteRequest();
    request.candidatesTerm = 1;
    request.lastLogIndex = 1;
    request.lastLogTerm = 1;

    const result = processRequestVote(serverState, request);
    expect(result.voteGranted).toBe(true);
});

test('Vote is successful, follower has already voted for this candidate', () => {
    const serverState = getTestServerState();
    serverState.currentTerm = 1;
    serverState.votedFor = "Candidate01";

    const request = getTestRequestVoteRequest();
    request.candidateId = "Candidate01";
    request.candidatesTerm = 999;
    request.lastLogIndex = 999;
    request.lastLogTerm = 999;

    const result = processRequestVote(serverState, request);
    expect(result.voteGranted).toBe(true);
});
