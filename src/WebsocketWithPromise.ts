import Websocket from 'ws';

export interface WebsocketWithPromise extends Websocket {
    promise?: Promise<void>;
    resolve?(): void;
}
