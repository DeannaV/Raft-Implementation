import { follower } from './NodeStates/Follower/follower';
import { ServerConfig, ServerState, StatusType } from './types';
import WebSocket from "ws";
import { delay } from './utilities';

const serverConfig: ServerConfig = {
    serverName: "Test01",
    apiPort: 8080,
    wssPort: 5010,
    heartbeat: 1000
}

const serverState: ServerState = {
    currentTerm: 1,
    votedFor: null,
    log: [],
    commitIndex: 0,
    lastApplied: 0,
    status: StatusType.Follower,
    store: {}
}

async function wsTest2() {
    const res = follower(serverConfig, serverState);
    let connected = false;
    setTimeout(() => {
        const ws = new WebSocket(`ws://localhost:5010`);
        ws.on('open', function open() {
            console.log('OPEN IS CALLED');
            connected = true;
        });
        setTimeout(() => {console.log('Value of connected', connected);}, 500);
        
    },
    500);
}

wsTest2();

