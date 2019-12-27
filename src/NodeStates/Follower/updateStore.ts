import { ServerState, StoreIndex, LogEntry } from '../../types';

// updates the store and the last applied
export type UpdateStore = typeof updateStore;
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
