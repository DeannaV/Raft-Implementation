import { StatusType, ServerConfig, ServerState } from "../types";

export async function leader(serverConfig: ServerConfig, serverState: ServerState, numberOfNodes: number): Promise<ServerState> {

    return serverState;
}