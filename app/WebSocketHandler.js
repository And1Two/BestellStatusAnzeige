/**
 * Copyright 2022 by Andrea Stancato
 * web.stancato@gmail.com
 */
const WebSocket = require("ws");
const DeviceManager = require("./DeviceManager");

/**
 * 
 */
const pwd = "test";

/**
 * 
 */
class WebSocketClient {
    /**
     * 
     */
    constructor(ws) {
        this.ws = ws;
        this.mode = "unassigned";
        this.uin = "";
        this.ping = true;
    }

    /**
     * 
     */
    recieved(data) {
        switch (data.type) {
            case "auth":

                break;

            case "monitoring":
                if (this.mode == "admin") {

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
 * Order Status:
 *  0 = available
 *  1 = reserved
 *  2 = prepare
 *  3 = settled
 */
class WebSocketHandler {

    /**
     * 
     */
    constructor(options, max_count) {
        this.index = 0;
        this.count = max_count;
        this.orders = [ ...Array(max_count).keys() ].map(v => ({ state: 0, device: "" }));
        this.handler = new WebSocket.Server(options);
        this.devices = new DeviceManager();
        this.clients = [];
        this.run();
    }

    /**
     * 
     */
    run() {
        this.handler.on("connection", ws => {
            /**
             * 
             */
            let client = new WebSocketClient(ws);

            /**
             * Request athentication
             */
            client.send({ type: "auth", auth: "init" });

            /**
             * 
             */
            ws.on("message", (json) => {
                let data = {};

                try {
                    data = JSON.parse(json);
                } catch (e) {
                    console.log(e);
                } finally {
                    if (data.type == "auth") {
                        this.auth(client, data);
                    } else if (/^admin|screen|tablet$/.test(client.mode)) {
                        switch (data.type) {
                            case "list":
                                client.send({ type: "list", orders: this.getOrders(client.uin) });
                            break;

                            case "lock":
                                if(data.index >= 0 && data.index < this.count && this.orders[data.index].state == 0) {
                                    this.orders[data.index].state = 1;
                                    this.orders[data.index].device = client.uin;
                                    
                                    client.send({ type: "order", order: "owner", index: data.index });

                                    this.sendAll("tablet", { type: "order", order: "locked", index: data.index }, [ client.uin ]);
                                }
                            break;

                            case "serve":
                                if(
                                    data.index >= 0 && data.index < this.count && this.orders[data.index].state > 0
                                    &&
                                    (this.orders[data.index].device === client.uin || client.mode === "admin")
                                ) {
                                    this.orders[data.index].state = 0;
                                    this.orders[data.index].device = "";

                                    this.sendAll("tablet", { type: "order", order: "unlock", index: data.index }, []);
                                    this.sendAll("screen", { type: "order", order: "show", index: data.index });
                                }
                            break;

                            case "unlock":
                                if(
                                    data.index >= 0 && data.index < this.count && this.orders[data.index].state < 0 
                                    && 
                                    (this.orders[data.index].device === client.uin || client.mode === "admin")
                                ) {
                                    this.orders[data.index].state = 0;
                                    this.orders[data.index].device = "";

                                    this.sendAll("tablet", { type: "order", order: "unlock", index: data.index }, []);
                                    this.sendAll("screen", { type: "order", order: "hide", index: data.index });
                                }
                            break;

                            default:
                                client.recieved(data);
                            break;
                        }
                    }
                }
            });

            /**
             * 
             */
            ws.on("close", (ev) => {
                this.remove(client.uin);
            });

            /**
             * 
             */
            ws.on("error", (error) => {

            });
        });
    }

    /**
     * 
     */
    auth(client, data) {
        let fn = (o, uin) => {
            client.send(o);
            client.uin = uin;
            client.mode = data.mode;

            this.remove(uin);

            this.clients.push(client);
        };

        if (/^admin|screen|tablet$/.test(data.mode)) {
            if(data.uin) {
                if(this.devices.exists(data.uin)) {
                    this.devices.save(data.uin, true).then(
                        uin => fn({ type: "auth", auth: "complete", max: this.count, orders: this.getOrders(data.uin) }, uin)
                    ).catch(
                        error => {
                            client.send({ type: "error", error });

                            console.log(error);
                        }
                    );
                } else {
                    client.send({ type: "auth", auth: "expired" });
                }
            } else if(data.pwd === pwd) {
                this.devices.save(this.devices.generateUid(), false).then(
                    uin => fn({ type: "auth", auth: "uin", uin }, uin)
                ).catch(
                    error => client.send({ type: "error", error })
                );
            } else {
                client.send({ type: "error", error: "invalid auth" });
            }
        }
    }

    /**
     * 
     */
    sendAll(mode, data, exclude) {
        this.clients.filter(v => v.mode == mode && !exclude.includes(v.uin)).forEach(d => d.send(data));
    }

    /**
     * 
     */
    remove(uin) {
        let i = this.clients.filter(v => v.uin == uin);

        if(i.length) {
            this.clients.splice(this.clients.indexOf(i), 1);
        }
    }

    /**
     * 
     */
    getOrders(uin) {
        return this.orders.filter(v => v.state > 0).map((v, i) => ({ index: i, state: v.device == uin ? 2 : 1}));
    }
}

/**
 * 
 */
module.exports = WebSocketHandler;