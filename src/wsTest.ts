import WebSocket, {OPEN} from "ws";

//const argPort = process.argv[2] ? parseInt(process.argv[2]) : 3000;

// Websocket server
const wss = new WebSocket.Server({port: 3000});

wss.on('connection', function connection(websocket) {
    websocket.on('message', function incoming(message) {
       console.log("I have received this message", message); 
    });

    // websocket.send(`Hello! I am ${serverConfig.serverName}. I am replying to you.`);
});

// Websocket make connection
const ws = new WebSocket(`ws://localhost:3000`);
ws.on('open', function open() {
    ws.send('Hello!!!');
});

ws.on('message', function incoming(data) {
    ws.send('another message');
});

ws.on('error', function error(error) {
    console.log(`My websocket had an error: ${error.message}`);
});

function wait(milleseconds: number) {
    return new Promise(resolve => setTimeout(resolve, milleseconds));
}

async function waitLoop() {
    while (true) {
        await wait(1000);
        
        if (ws.readyState === OPEN) {
            ws.send("A MESSAGE!");
        }
    }
}

waitLoop();