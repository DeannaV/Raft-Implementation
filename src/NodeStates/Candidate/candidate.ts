import WebSocket from "ws";

import { ServerConfig, ServerState, RequestVoteRequest, RequestVoteReply, StatusType } from '../../types'
import { isRequestVoteReply, isRequestVoteRequest, isAppendEntriesRequest } from "../../typeguards";
import { parseMessage } from '../Follower/follower';
import { processMessage } from '../Follower/processMessage';
import { resolveableTimeoutWithReason, ResolveReason } from './resolveableTimeoutWithReason';

export function calculateRequiredVotes(servers: number) {
    return Math.ceil((servers + 1) / 2);
}

export async function candidate(serverConfig: ServerConfig, serverState: ServerState, allServers: ReadonlyArray<ServerConfig>): Promise<ServerState> {
    const votesRequired = calculateRequiredVotes(allServers.length);
    const lastLogIndex = serverState.log.length != 0 ? serverState.log.length - 1 : null;
    const lastLogTerm = lastLogIndex != null ? serverState.log[lastLogIndex].term : null;
    const otherServers = allServers.filter(s => s.serverName != serverConfig.serverName);
    const websockets = otherServers.map(s => new WebSocket(`ws://localhost:${s.wssPort}`));

    let voteCount = 1; // Candidate votes for itself
    let responseCount = 0;
    let nextState: ServerState = {
        ...serverState,
        votedFor: serverConfig.serverName
    };

    const requestVoteRequest: RequestVoteRequest = {
        candidatesTerm: serverState.currentTerm,
        candidateId: serverConfig.serverName,
        lastLogIndex: lastLogIndex,
        lastLogTerm: lastLogTerm,
        type: 'RequestVoteRequest'
    };

    const [resolve, promise] = resolveableTimeoutWithReason(1000);

    // Request votes and wait for responses
    websockets.forEach(ws => {
        ws.on('open', function open() {
            ws.send(JSON.stringify(requestVoteRequest));
        });

        ws.on('message', function incoming(message: string) {
            const parsedVoteReply = parseVoteReply(message);
            if (parsedVoteReply != null) {
                responseCount = responseCount + 1;
                nextState = updateTermOnState(nextState, parsedVoteReply.currentTerm);
                if (parsedVoteReply.voteGranted) {
                    voteCount = voteCount + 1;
                }
            }
            if (voteCount >= votesRequired) {
                resolve(ResolveReason.RequiredVotesReceived);
            } else if (responseCount === otherServers.length) {
                resolve(ResolveReason.SplitVote)
            }
        });
    });

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

                if (isRequestVoteRequest(parsedMessage)) {
                    if (parsedMessage.candidatesTerm > prevTerm) {
                        resolve(ResolveReason.RequestVoteWithHigherTerm);
                    }
                }
            }
        })
    });

    const reason = await promise;

    wss.close();
    websockets.forEach(ws => ws.close());

    switch(reason) {
        case ResolveReason.RequiredVotesReceived: {
            return {
                ...nextState,
                status: StatusType.Leader
            }
        }
        case ResolveReason.RecognisedLeader: {
            return {
                ...nextState,
                status: StatusType.Follower
            }
        }
        case ResolveReason.RequestVoteWithHigherTerm:
        case ResolveReason.SplitVote:
        case ResolveReason.Timeout: {
            return {
                ...nextState,
                status: StatusType.CandidateTimeout
            };
        }
        default:
            throw `Unknown Candidate resolve ${reason}`;
    }
}

function parseVoteReply(message: string): RequestVoteReply | null {
    try {
        const obj = JSON.parse(message);
        if (isRequestVoteReply(obj)) {
            return obj;
        }

        return null;
    } catch {
        return null;
    }

}

export function updateTermOnState(state: ServerState, term: number): ServerState {
    if (term > state.currentTerm) {
        return {
            ...state,
            currentTerm: term
        };
    }

    return state;
}
