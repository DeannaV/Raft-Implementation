import { getTestEntries, getTestServerState, getTestAppendEntriesRequest } from './testObjects';
import { processAppendEntries } from './processAppendEntries';
import { ServerState, LogEntry } from '../../types';

test('Get next state returns same state if term less than current', () => {
    const request = getTestAppendEntriesRequest(); // term = 1
    const serverState = getTestServerState();
    serverState.currentTerm = 2;
    const mockUpdateStore = jest.fn(serverState => serverState);
    const response = processAppendEntries(serverState, request, mockUpdateStore);
    expect(response.state).toBe(serverState);
    expect(response.success).toBe(false);
});

test(
    'Get next state does not update entries if log does not have entry at prevLogIndex with matching term, term is updated', () => {
    const testServerState = getTestServerState();

    const request = getTestAppendEntriesRequest();
    request.prevLogIndex = 2;
    request.prevLogTerm = 1;
    request.leadersTerm = 7;
    request.entries = [
        {
            key: "four",
            value: "FOUR"
        }
    ];
    const serverState = testServerState;
    const mockUpdateStore = jest.fn(serverState => serverState);
    const response = processAppendEntries(serverState, request, mockUpdateStore);
    const expectedState = testServerState;
    expect(response.state).toEqual(expectedState);
    expect(response.success).toEqual(false);
});

test(
    'Get next state does not update entries if log does not have entry at prevLogIndex with matching term to prevLogTerm, term is updated', () => {
    const request = getTestAppendEntriesRequest();
    request.prevLogIndex = 2;
    request.prevLogTerm = 1;
    request.leadersTerm = 7;
    request.entries = [
        {
            key: "four",
            value: "FOUR"
        }
    ];
    const serverState = getTestServerState();
    const serverEntries = getTestEntries();
    serverState.log = serverEntries;
    const mockUpdateStore = jest.fn(serverState => serverState);
    const response = processAppendEntries(serverState, request, mockUpdateStore);
    const expectedState = {
        ...serverState,
        log: serverEntries
    };
    expect(response.state).toEqual(expectedState);
    expect(response.success).toEqual(false);
});


test('Get next state updates log entries', () => {
    const request = getTestAppendEntriesRequest();
    request.prevLogIndex = 2;
    request.prevLogTerm = 3;
    request.leadersTerm = 3;
    request.entries = [
        {
            key: "four",
            value: "FOUR"
        }
    ];
    const serverState = getTestServerState();
    const testEntries = getTestEntries();
    serverState.log = testEntries;
    const mockUpdateStore = jest.fn(serverState => serverState);
    const response = processAppendEntries(serverState, request, mockUpdateStore);

    const entries = testEntries.concat([{
        key: "four",
        value: "FOUR",
        term: 3
    }]);
    const expectedState: ServerState = {
        ...serverState,
        log: entries
    };
    expect(response.state).toEqual(expectedState);
    expect(response.success).toEqual(true);
    expect(mockUpdateStore.mock.calls.length).toBe(0);
});

test('Get next state overrides conflicting log entries with smaller index', () => {
    const request = getTestAppendEntriesRequest();
    request.prevLogIndex = 1;
    request.prevLogTerm = 2;
    request.leadersTerm = 3;
    request.entries = [
        {
            key: "four",
            value: "FOUR"
        }
    ];

    const followerEntries = getTestEntries();
    const serverState = getTestServerState();
    serverState.log = followerEntries;

    const mockUpdateStore = jest.fn(serverState => serverState);
    const response = processAppendEntries(serverState, request, mockUpdateStore);

    const expectedLog: Array<LogEntry> = [followerEntries[0], followerEntries[1], {...request.entries[0], term: 3}];
    const expectedState: ServerState = {
        ...serverState,
        log: expectedLog
    };
    expect(response.state).toEqual(expectedState);
    expect(response.success).toEqual(true);
    expect(mockUpdateStore.mock.calls.length).toBe(0);
});

test('Commit index is updated to smaller of leader commit and log entries, fewer log entries than leader commit', () => {
    const request = getTestAppendEntriesRequest();
    request.leaderCommit = 5;
    request.prevLogIndex = 2;
    request.prevLogTerm = 3;
    request.leadersTerm = 3;

    const serverState = getTestServerState();
    serverState.commitIndex = null;
    serverState.log = getTestEntries(); // 3 test entries

    const mockUpdateStore = jest.fn(serverState => serverState);
    const response = processAppendEntries(serverState, request, mockUpdateStore);

    expect(response.state.commitIndex).toBe(2);
    expect(mockUpdateStore.mock.calls.length).toBe(1);
});

test('Commit index is updated to smaller of leader commit and log entries, same number of log entries as leader commit', () => {
    const request = getTestAppendEntriesRequest();
    request.leaderCommit = 5;
    request.prevLogIndex = 5;
    request.prevLogTerm = 3;
    request.leadersTerm = 3;

    const serverState = getTestServerState();
    serverState.commitIndex = null;
    serverState.log = getTestEntries().concat([
        {
            key: "four",
            value: "FOUR",
            term: 3
        },
        {
            key: "five",
            value: "FIVE",
            term: 3
        },
        {
            key: "six",
            value: "SIX",
            term: 3
        }
    ]); // 3 test entries

    const mockUpdateStore = jest.fn(serverState => serverState);
    const response = processAppendEntries(serverState, request, mockUpdateStore);

    expect(response.state.commitIndex).toBe(5);
    expect(mockUpdateStore.mock.calls.length).toBe(1);
});

test('Commit index is unchanged, so no call is made to update store', () => {
    const request = getTestAppendEntriesRequest();
    request.leaderCommit = 5;
    request.prevLogIndex = 5;
    request.prevLogTerm = 3;
    request.leadersTerm = 3;

    const serverState = getTestServerState();
    serverState.commitIndex = 5;
    serverState.log = getTestEntries().concat([
        {
            key: "four",
            value: "FOUR",
            term: 3
        },
        {
            key: "five",
            value: "FIVE",
            term: 3
        },
        {
            key: "six",
            value: "SIX",
            term: 3
        }
    ]); // 3 test entries

    const mockUpdateStore = jest.fn(serverState => serverState);
    const response = processAppendEntries(serverState, request, mockUpdateStore);

    expect(response.state.commitIndex).toBe(5);
    expect(mockUpdateStore.mock.calls.length).toBe(0);
});
