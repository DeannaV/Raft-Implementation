import { RequestVoteRequest, AppendEntriesRequest, ServerState, AppendEntriesReply, RequestVoteReply } from '../../types';
import { updateTerm } from './updateTerm';
import { processAppendEntries } from './processAppendEntries';
import { updateStore } from './updateStore';
import { processRequestVote } from './processRequestVote';
import { isAppendEntriesRequest, isRequestVoteRequest } from '../../typeguards';

export interface ProcessMessage {
    state: ServerState;
    response: string;
}

export function processMessage(serverState: ServerState, message: RequestVoteRequest | AppendEntriesRequest): ProcessMessage {
    let state = updateTerm(serverState, message);
    let response = '';
    switch (message.type) {
        case 'AppendEntriesRequest': {
            const result = processAppendEntries(state, message, updateStore);
            state = result.state;

            const responseObj: AppendEntriesReply = {
                success: result.success,
                currentTerm: state.currentTerm
            };
            response = JSON.stringify(responseObj);
            break;
        }
        case 'RequestVoteRequest': {
            const result = processRequestVote(state, message);
            state = result.state;

            const responseObj: RequestVoteReply = {
                currentTerm: result.state.currentTerm,
                voteGranted: result.voteGranted,
                type: 'RequestVoteReply'
            }
            response = JSON.stringify(responseObj);
            break;
        }
        default:
            throw 'Message type unknown';
    }

    return {
        response,
        state
    };
}
