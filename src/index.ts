import WebSocket from "ws";

import { serverConfigs, NUMBER_OF_NODES } from './constants';
import { StatusType, ServerState, ServerConfig } from "./types";
import { candidate, candidateTimeout, follower, leader } from "./NodeStates";

const argValue = process.argv[2] ? parseInt(process.argv[2]) : 0;
const serverConfig: ServerConfig = serverConfigs[argValue];

const INITIAL_STATE: ServerState = {
    currentTerm: 0,
    votedFor: null,
    log: [],
    commitIndex: 0,
    lastApplied: 0,
    status: StatusType.Follower,
    store: {}
};

async function distributedMap(serverConfig: ServerConfig, numberOfNodes: number) {
    const nodes = serverConfigs.slice(0, numberOfNodes); 
    
    let currentState: ServerState = INITIAL_STATE;

    while (true) {
        switch(currentState.status) {
            case StatusType.Follower: {
                currentState = await follower(serverConfig, currentState);   
                break;
            }
            case StatusType.Candidate: {
                currentState = await candidate(serverConfig, currentState, nodes);
                break;
            }
            case StatusType.CandidateTimeout: {
                currentState = await candidateTimeout(serverConfig, currentState);
                break;
            }
            case StatusType.Leader: {
                currentState = await leader(serverConfig, currentState, nodes);
                break;
            }
            default:
                throw `Invalid Status type ${currentState.status}`;
        }
    }
}

distributedMap(serverConfig, NUMBER_OF_NODES);


/**
// Websocket server
const wss = new WebSocket.Server({port: serverConfig.wssPort});

wss.on('connection', function connection(websocket) {
    websocket.on('message', function incoming(message) {
        console.log("Received message", message);
    })

    websocket.send(`Hello! I am ${serverConfig.serverName}. I am replying to you.`);
});


// Websocket make connection
const ws = new WebSocket(`ws://localhost:${serverConfig.wsPort}`);
ws.on('open', function open() {
    sendVoteRequest(ws);
});

ws.on('message', function incoming(data) {
});

ws.on('error', function error(error) {
    console.log(`My websocket had an error: ${error.message}`);
});

 */