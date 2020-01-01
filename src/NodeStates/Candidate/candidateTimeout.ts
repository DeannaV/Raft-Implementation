import WebSocket from "ws";

import { isAppendEntriesRequest } from "../../typeguards";
import { parseMessage } from '../Follower/follower';
import { ELECTION_TIMEOUT_MIN, ELECTION_TIMEOUT_MAX, serverConfigs } from '../../constants';
import { ServerConfig, ServerState, StatusType } from '../../types'
import { resolveableTimeoutWithReason, ResolveReason } from './resolveableTimeoutWithReason';
import { processMessage } from '../Follower/processMessage';

export async function candidateTimeout(serverConfig: ServerConfig, serverState: ServerState): Promise<ServerState> {
    let nextState = serverState;

    const [resolve, promise] = resolveableTimeoutWithReason(getElectionTimeout());

    const wss = new WebSocket.Server({port: serverConfig.wssPort});
    // Listen for an existing leader or other candidates
    wss.on('connection', function connection(websocket: WebSocket) {
        websocket.on('message', function incoming(message: string) {
            const parsedMessage = parseMessage(message);
            if (parsedMessage != null) {
                const prevTerm = nextState.currentTerm;

                const result = processMessage(nextState, parsedMessage);
                nextState = result.state;
                websocket.send(JSON.stringify(result.response));
                
                if (isAppendEntriesRequest(parsedMessage)) {
                    if (parsedMessage.leadersTerm >= prevTerm) {
                        resolve(ResolveReason.RecognisedLeader);
                    }
                }
            }
        })
    });

    const reason = await promise;
    
    switch (reason) {
        case ResolveReason.RecognisedLeader: {
            return {
                ...nextState,
                status: StatusType.Follower
            };
        }
        case ResolveReason.Timeout: {
            // Timeout has finished, so go back to being a candidate and run another election
            return {
                ...nextState,
                votedFor: null,
                currentTerm: nextState.currentTerm + 1,
                status: StatusType.Candidate
            };
        }
        default:
            throw `Unknown Candidate Timeout Resolve ${reason}`
    }
}

function getElectionTimeout(): number {
    const interval = ELECTION_TIMEOUT_MAX - ELECTION_TIMEOUT_MIN;
    const randomValue = Math.floor(Math.random() * interval);
    return randomValue + ELECTION_TIMEOUT_MIN;
}
