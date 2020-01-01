import express from "express";

import { StatusType, ServerConfig, ServerState } from "../../types";

export async function leader(serverConfig: ServerConfig, serverState: ServerState, allServers: ReadonlyArray<ServerConfig>): Promise<ServerState> {

    return serverState;
}