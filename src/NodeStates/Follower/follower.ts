import WebSocket from "ws";

import { WebsocketWithPromise } from '../../WebsocketWithPromise';
import { StatusType, ServerState, ServerConfig, AppendEntriesRequest, AppendEntriesReply, ProcessAppendEntries, RequestVoteRequest, RequestVoteReply } from "../../types";
import { isAppendEntriesRequest, isRequestVoteRequest } from '../../typeguards';
import { resolveableTimeoutPromise, delay } from "../../utilities";
import { processMessage, ProcessMessage } from './processMessage';

export async function follower(serverConfig: ServerConfig, serverState: ServerState): Promise<ServerState> {
    const wss = new WebSocket.Server({port: serverConfig.wssPort});

    let state = serverState;

    wss.on('connection', function connection(websocket: WebsocketWithPromise) {
        const [resolve, promise] = resolveableTimeoutPromise(serverConfig.heartbeat);
        websocket.promise = promise;
        websocket.resolve = resolve;

        websocket.on('message', function incoming(message: string) {
            const parsedMessage = parseMessage(message); 

            if (parsedMessage != null) {
                if (validHeartbeat(parsedMessage)) {
                    websocket.resolve();
                }

                const result: ProcessMessage = processMessage(state, parsedMessage);
                state = result.state;
                websocket.send(result.response);
            }
            
            const [resolve, promise] = resolveableTimeoutPromise(serverConfig.heartbeat);
            websocket.promise = promise;
            websocket.resolve = resolve;
        });
    });

    // Delay to initialise connection to leader
    if (wss.clients.size === 0) {
        await delay(serverConfig.heartbeat);
    }

    let hasRecentHeartbeat = false;
    while(hasRecentHeartbeat) {
        hasRecentHeartbeat = false;

        const clients: Array<WebsocketWithPromise> = [...wss.clients];
        const promises = clients.map(async c => {
            try {
                if (c.promise != null) {
                    await c.promise;
                    hasRecentHeartbeat = true;
                }
            } catch {
                // hasRecentHeartbeat was initialised to false
            }
        })

        await Promise.all(promises);
    };

    wss.close();
    
    const newState = {...serverState, status: StatusType.Candidate};
    return newState;
}

export function parseMessage(message: string): RequestVoteRequest | AppendEntriesRequest | null {
    try {
        const obj = JSON.parse(message);
        if (isAppendEntriesRequest(obj)) {
            return obj;
        }
        if (isRequestVoteRequest(obj)) {
            return obj;
        }

        return null;
    } catch {
        return null;
    }
}

export function validHeartbeat(message: RequestVoteRequest | AppendEntriesRequest | null): boolean {
    return true;
}
