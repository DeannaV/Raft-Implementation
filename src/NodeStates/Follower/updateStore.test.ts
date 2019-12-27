import { updateStore, applyEntry } from './updateStore';
import { getTestServerState, getTestEntries } from './testObjects';
import { LogEntry, StoreIndex } from '../../types';

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