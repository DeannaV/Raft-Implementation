import { ServerConfig } from './types';

export const wssPorts = [5001, 5002, 5003, 5004, 5005, 5006, 5007, 5008];

export const serverConfigs: Array<ServerConfig> = [
    {
        serverName: "Server01",
        apiPort: 8080,
        wssPort: wssPorts[0],
        heartbeat: 1000
    },
    {
        serverName: "Server02",
        apiPort: 8081,
        wssPort: wssPorts[1],
        heartbeat: 1000
    },
    {
        serverName: "Server03",
        apiPort: 8082,
        wssPort: wssPorts[2],
        heartbeat: 1000
    },
    {
        serverName: "Server04",
        apiPort: 8083,
        wssPort: wssPorts[3],
        heartbeat: 1000
    },
    {
        serverName: "Server05",
        apiPort: 8084,
        wssPort: wssPorts[4],
        heartbeat: 1000
    },
    {
        serverName: "Server06",
        apiPort: 8085,
        wssPort: wssPorts[5],
        heartbeat: 1000
    },
    {
        serverName: "Server07",
        apiPort: 8086,
        wssPort: wssPorts[6],
        heartbeat: 1000
    },
    {
        serverName: "Server08",
        apiPort: 8087,
        wssPort: wssPorts[7],
        heartbeat: 1000
    }
];

export const NUMBER_OF_NODES = 3;

export const ELECTION_TIMEOUT_MIN = 150;

export const ELECTION_TIMEOUT_MAX = 300;