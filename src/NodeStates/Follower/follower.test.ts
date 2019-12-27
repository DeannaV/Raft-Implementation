import { follower } from './follower';
import { StatusType, LogEntry, StoreIndex, } from '../../types';
import WebSocket from "ws";
import { delay } from '../../utilities';
import { getTestServerConfig, getTestServerState, getTestAppendEntriesRequest, getTestEntries, getTestRequestVoteRequest} from './testObjects';

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
