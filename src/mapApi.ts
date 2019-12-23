import express from "express";

export class MapApi {
    private static app = express();
    private static map = new Map();

    constructor(serverName: string, apiPort: number) {
        MapApi.map.set("1", "Deanna");
        MapApi.map.set("2", "Sam");
        MapApi.map.set("3", "Ella");
        MapApi.map.set("4", "Rachel");
        MapApi.map.set("5", "Anthony");
        MapApi.map.set("6", "Jonah");
        MapApi.map.set("7", "Leah");
        MapApi.map.set("8", "Quentin");
        MapApi.map.set("9", "Donna");
        MapApi.map.set("10", "Kevin");

        // define a route handler for the default home page
        MapApi.app.get("/", (req, res) => {
            const mapArray: Array<string> = [];
            MapApi.map.forEach((a, b) => mapArray.push(`${b}: ${a}`));
            res.send(mapArray.join(', '));
        });

        // define a route handler for the default home page
        MapApi.app.get("/about", (req, res) => {
            const str = `Server Name: ${serverName}, API Port: ${apiPort}`;
            res.send(str);
        });

        // define a route handler for the default home page
        MapApi.app.get("/get/:key", (req, res) => {
            const key = req.params['key'];
            const value = MapApi.map.get(key);
            res.send(value || 'Key not found.');
        });

        // define a route handler for the default home page
        MapApi.app.get("/has/:key", (req, res) => {
            const key = req.params['key'];
            const mapHasKey = MapApi.map.has(key);
            res.send(mapHasKey ? 'True' : 'False');
        });

        // define a route handler for the default home page
        MapApi.app.get("/set/:key/:value", (req, res) => {
            const key = req.params['key'];
            const value = req.params['value'];
            MapApi.map.set(key, value);
            res.send(`Set key value "${key}": "${value}" `);
        });

        // start the express server
        MapApi.app.listen(apiPort, () => {
            console.log(`server started at http://localhost:${apiPort}`);
        });
    }

}
