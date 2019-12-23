import { follower, getNextState, applyEntry, updateStore } from './follower';
import { ServerConfig, ServerState, StatusType, AppendEntriesRequest, LogEntry, StoreIndex } from '../types';
import WebSocket from "ws";
import { delay } from '../utilities';
import { Server } from 'http';

const TEST_SERVER_CONFIG: ServerConfig = {
    serverName: "Test01",
    apiPort: 8080,
    wssPort: 5010,
    heartbeat: 1000
}

function getTestServerConfig() {
    return {...TEST_SERVER_CONFIG};
}

const TEST_SERVER_STATE: ServerState = {
    currentTerm: 1,
    votedFor: null,
    log: [],
    commitIndex: null,
    lastApplied: null,
    status: StatusType.Follower,
    store: {}
}

function getTestServerState() {
    return {...TEST_SERVER_STATE, log: [...TEST_SERVER_STATE.log]}
}

const TEST_REQUEST: AppendEntriesRequest = {
    leadersTerm: 1,
    leaderId: 'Leader01',
    prevLogIndex: null,
    prevLogTerm: null,
    entries: [],
    leaderCommit: null
};

function getTestRequest() {
    return {...TEST_REQUEST, entries: [...TEST_REQUEST.entries]}
}

const TEST_ENTRIES: Array<LogEntry> = [
    {
        key: "one",
        value: "ONE",
        term: 1
    },
    {
        key: "two",
        value: "TWO",
        term: 2
    },
    {
        key: "three",
        value: "THREE",
        term: 3
    },
];

function getTestEntries() {
    return TEST_ENTRIES.map(e => ({...e}));
}

// TEST FOLLOWER FUNCTION

test('Follower returns a serverState', () => {
    return follower(getTestServerConfig(), getTestServerState()).then(result => {
        expect(result).toBeDefined();
    });
});

test('Follower term does not increment by itself', () => {
    const testServerState = getTestServerState();
    return follower(getTestServerConfig(), testServerState).then(result => {
        expect(result.currentTerm).toEqual(testServerState.currentTerm);
    });
});

test('Follower returns as candidate', () => {
    const testServerState = getTestServerState();
    return follower(getTestServerConfig(), testServerState).then(result => {
        expect(result.status).toEqual(StatusType.Candidate);
    });
});

test('Follower connects on port 5010', async () => {
    const testServerConfig = getTestServerConfig();
    const testServerState = getTestServerState();

    let connected = false;
    await delay(200);
    const res = follower(getTestServerConfig(), testServerState);
    await delay(200);

    const ws = new WebSocket(`ws://localhost:5010`);
    ws.on('open', function open() {
        connected = true;
    });
    await delay(200);
        
    expect(connected).toBeTruthy();
});


// TEST GET NEXT STATE FUNCTION

test('Get next state returns same state if term less than current', () => {
    const request = getTestRequest(); // term = 1
    const serverState = getTestServerState();
    serverState.currentTerm = 2;
    const mockUpdateStore = jest.fn(serverState => serverState);
    const response = getNextState(serverState, request, mockUpdateStore);
    expect(response.state).toBe(serverState);
    expect(response.success).toBe(false);
});

test(
    'Get next state does not update entries if log does not have entry at prevLogIndex with matching term, term is updated', () => {
    const testServerState = getTestServerState();

    const request = getTestRequest();
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
    const response = getNextState(serverState, request, mockUpdateStore);
    const expectedState = {
        ...testServerState,
        currentTerm: 7
    };
    expect(response.state).toEqual(expectedState);
    expect(response.success).toEqual(false);
});

test(
    'Get next state does not update entries if log does not have entry at prevLogIndex with matching term to prevLogTerm, term is updated', () => {
    const request = getTestRequest();
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
    const response = getNextState(serverState, request, mockUpdateStore);
    const expectedState = {
        ...serverState,
        log: serverEntries,
        currentTerm: 7
    };
    expect(response.state).toEqual(expectedState);
    expect(response.success).toEqual(false);
});


test('Get next state updates log entries', () => {
    const request = getTestRequest();
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
    const response = getNextState(serverState, request, mockUpdateStore);

    const entries = testEntries.concat([{
        key: "four",
        value: "FOUR",
        term: 3
    }]);
    const expectedState: ServerState = {
        ...serverState,
        log: entries,
        currentTerm: 3
    };
    expect(response.state).toEqual(expectedState);
    expect(response.success).toEqual(true);
    expect(mockUpdateStore.mock.calls.length).toBe(0);
});

test('Get next state overrides conflicting log entries with smaller index', () => {
    const request = getTestRequest();
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
    const response = getNextState(serverState, request, mockUpdateStore);

    const expectedLog: Array<LogEntry> = [followerEntries[0], followerEntries[1], {...request.entries[0], term: 3}];
    const expectedState: ServerState = {
        ...serverState,
        log: expectedLog,
        currentTerm: 3
    };
    expect(response.state).toEqual(expectedState);
    expect(response.success).toEqual(true);
    expect(mockUpdateStore.mock.calls.length).toBe(0);
});

test('Commit index is updated to smaller of leader commit and log entries, fewer log entries than leader commit', () => {
    const request = getTestRequest();
    request.leaderCommit = 5;
    request.prevLogIndex = 2;
    request.prevLogTerm = 3;
    request.leadersTerm = 3;

    const serverState = getTestServerState();
    serverState.commitIndex = null;
    serverState.log = getTestEntries(); // 3 test entries

    const mockUpdateStore = jest.fn(serverState => serverState);
    const response = getNextState(serverState, request, mockUpdateStore);

    expect(response.state.commitIndex).toBe(2);
    expect(mockUpdateStore.mock.calls.length).toBe(1);
});

test('Commit index is updated to smaller of leader commit and log entries, same number of log entries as leader commit', () => {
    const request = getTestRequest();
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
    const response = getNextState(serverState, request, mockUpdateStore);

    expect(response.state.commitIndex).toBe(5);
    expect(mockUpdateStore.mock.calls.length).toBe(1);
});

test('Commit index is unchanged, so no call is made to update store', () => {
    const request = getTestRequest();
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
    const response = getNextState(serverState, request, mockUpdateStore);

    expect(response.state.commitIndex).toBe(5);
    expect(mockUpdateStore.mock.calls.length).toBe(0);
});


// TEST APPLY ENTRY
test('A new entry is added to an empty store', () => {
    const entry: LogEntry = {
        key: "one",
        value: "ONE",
        term: 1
    };

    const store: StoreIndex = {};

    const result = applyEntry(store, entry);
    expect(result["one"]).toEqual("ONE");
});

test('A new entry overwrites an older entry', () => {
    const entry: LogEntry = {
        key: "one",
        value: "TWO",
        term: 1
    };

    const store: StoreIndex = {
        one: "ONE"
    };

    const result = applyEntry(store, entry);
    expect(result["one"]).toEqual("TWO");
});

// TEST UPDATE STORE
test('Store and last applied are unchanged if commit index is null', () => {
    const serverState = getTestServerState();
    serverState.log = getTestEntries();
    serverState.commitIndex = null;

    const nextState = updateStore(serverState);
    expect(nextState.store).toBe(serverState.store);
    expect(nextState.lastApplied).toBe(serverState.lastApplied);
});

test('Entries are added to new store', () => {
    const serverState = getTestServerState();
    serverState.log = getTestEntries();
    serverState.commitIndex = 2;
    serverState.lastApplied = null;

    const nextState = updateStore(serverState);
    const expectedStore = {
        one: "ONE",
        two: "TWO",
        three: "THREE"
    };

    expect(nextState.store).toStrictEqual(expectedStore);
    expect(nextState.lastApplied).toBe(2);
});

test('Committed entries are added to new store, additional uncommitted entries are not added to store', () => {
    const serverState = getTestServerState();
    serverState.log = getTestEntries();
    serverState.commitIndex = 1;
    serverState.lastApplied = null;
    serverState.store = {};

    const nextState = updateStore(serverState);
    const expectedStore = {
        one: "ONE",
        two: "TWO",
    };

    expect(nextState.store).toStrictEqual(expectedStore);
    expect(nextState.lastApplied).toBe(1);
});

test('Store is updated with new entries', () => {
    const serverState = getTestServerState();
    serverState.log = getTestEntries().concat([
        {
            key: "four",
            value: "FOUR",
            term: 4
        },
        {
            key: "five",
            value: "FIVE",
            term: 5
        }
    ]);
    serverState.commitIndex = 4;
    serverState.lastApplied = 2;
    serverState.store = {
        one: "ONE",
        two: "TWO",
        three: "THREE"
    };

    const nextState = updateStore(serverState);
    const expectedStore = {
        one: "ONE",
        two: "TWO",
        three: "THREE",
        four: "FOUR",
        five: "FIVE"
    };

    expect(nextState.store).toStrictEqual(expectedStore);
    expect(nextState.lastApplied).toBe(4);
});