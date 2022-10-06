/**
 * Copyright 2022 by Andrea Stancato
 * web.stancato@gmail.com
 */
const WebSocket = require("ws");

/**
 * 
 */
class WebSocketClient {
    /**
     * 
     */
    constructor(ws, mode) {
        this.ws = ws;
        this.mode = mode;
        this.ping = true;
    }

    /**
     * 
     */
    recieved(data) {
        switch(data.type) {
            case "auth":

            break;

            case "monitoring":
                if(this.mode == "admin") {

                }
            break;

            case "pong":
                this.ping = true;
            break;
        }
    }

    /**
     * 
     */
    send(data) {
        this.ws.send(JSON.stringify(data));
    }
}

/**
 * 
 */
class WebSocketHandler {

    /**
     * 
     */
    constructor(options, max_count) {
        this.index = 0;
        this.count = max_count;
        this.clients = new Map().set("tablet", []).set("screen", []).set("admin", []).set("unassigned", []);
        this.handler = new WebSocket.Server(options);
        this.run();
    }

    /**
     * 
     */
    run() {
        this.handler.on("connection", ws => {
            /**
             * Assigned Client
             */
            let client;

            /**
             * New Client Connected
             */
            this.clients.get("unassigned").push(ws);

            /**
             * 
             */
            ws.send(JSON.stringify({ type: "auth", index: this.index, count: this.count }));

            /**
             * 
             */
            ws.on("message", (data) => {
                try {
                    let json = JSON.parse(data);

                    if (json.type == "auth") {
                        if(/^admin|screen|tablet$/.test(json.mode)) {
                            let unassigned = this.clients.get("unassigned"),
                                index = unassigned.indexOf(ws);

                            if(index) {
                                unassigned.splice(index, 1);

                                this.clients.get(json.mode).push((client = new WebSocketClient(ws, json.mode)));

                                client.send({ type: ""})
                            }
                        }
                    } else if (client) {
                        client.recieved(json);
                    }
                } catch(e) {
                    console.log(e);
                }
            });
        
            /**
             * 
             */
            ws.on("close", (ev) => {
                let m = this.clients.get(client ? client.mode : "unassigned");

                m.splice(m.indexOf(client || ws), 1);
            });
        
            /**
             * 
             */
            ws.on("error", (error) => {
        
            });
        });
    }

}

/**
 * 
 */
module.exports = WebSocketHandler;