/**
 * Copyright 2022 by Andrea Stancato
 * web.stancato@gmail.com
 */
((win, doc, undef) => {
    "use strict";

    /**
     * 
     */
    let ready = false,

    /**
     * 
     */
    uin = localStorage.getItem("uin"),

    /**
     * Device Mode
     */
    mode = (new Proxy(new URLSearchParams(window.location.search), { get: (p, k) => p.get(k)})).mode || "tablet",

    /**
     *
     */
    max = 40,
    
    /**
     *
     */
    ws;

    /**
     * 
     */
    class Client {
        /**
         * 
         */
        constructor() {
            this.connect();
        }

        /**
         * 
         */
        connect() {
            ws = new WebSocket(doc.location.href.replace(/^http/, "ws"));
            ws.addEventListener("close", () => setTimeout(() => this.connect(), 1000));
            ws.addEventListener("error", (ev) => console.error(ev));
            ws.addEventListener("message", (ev) => {
                try {
                    let data = JSON.parse(ev.data);
                    let t_uin = (new Proxy(new URLSearchParams(window.location.search), { get: (p, k) => p.get(k)})).uin;

                    if(t_uin) uin = t_uin;

                    if(data.type == "auth") {
                        switch(data.auth) {
                            case "init":
                                if(uin) {
                                    $.show(mode);
            
                                    this.send({ type: "auth", uin, mode });
                                } else if(mode == "tablet") {
                                    $.show("password");
                                } else {
                                    $.show("failed");
                                }
                            break;
            
                            case "uin":
                                if(t_uin) return;

                                uin = data.uin;
            
                                localStorage.setItem("uin", uin);
            
                                this.send({ type: "auth", uin, mode });
                            break;

                            case "complete":
                                max = data.max;
                            break;
                        }
                    }

                    //
                    this.message(data);
                } catch(e) {
                    console.log(e);
                }
            });
        }

        /**
         * 
         */
        send(data) {
            ws.send(JSON.stringify(data));
        }

        /**
         * 
         */
        message(data) {}
    }

    /**
     * 
     */
    class Tablet extends Client {
        /**
         * 
         */
        constructor() {
            super();

            let c = doc.querySelector("header svg").classList;

            ws.addEventListener("open", () => {
                c.add("auth");
                c.remove("online", "offline");
            });

            ws.addEventListener("close", () => {
                c.add("offline");
                c.remove("online", "auth");
            });
        }

        /**
         * 
         */
        message(data) {
            switch(data.type) {
                case "auth":
                    let c = doc.querySelector("header svg").classList;
                    
                    switch(data.auth) {
                        case "complete":
                            c.add("online");
                            c.remove("offline", "auth");
        
                            $.show("tablet");

                            this.createMatrix(data.orders);
                        break;
        
                        case "expired":
                            $.show("password");
                        break;
                    }
                break;

                case "error":
                    console.log(data.error);
                break;
    
                case "order":
                    let e = doc.querySelector("[data-index='" + data.index + "']");
    
                    switch(data.order) {
                        case "owner":
                            e.className = "owner";
                        break;
    
                        case "locked":
                            e.className = "locked";
                        break;
    
                        case "unlock":
                        case "served":
                            e.className = "";
                        break;
    
                        case "show":
                        case "hide":
                            if(mode == "screen") {
    
                            }
                        break;
                    }
                break;
            }
        }

        /**
         * 
         */
        createMatrix(list) {
            let e = doc.getElementById("tablet");

            e.innerHTML = "";

            for(let i = 0; i < max; i++) {
                let n = doc.createElement("div"),
                    t = (list || []).filter(v => v.index == i);


                
                if(t.length) {
                    n.className = t[0].state == 1 ? "locked" : "owner";
                }

                n.dataset.index = i;
                n.innerHTML = "<span>" + (i + 1) + "</span>";
                n.onclick = () => {
                    if(n.className == "") {
                        this.send({ type: "lock", index: i });
                    } else if(n.className == "owner") {
                        this.send({ type: "serve", index: i });
                    }
                };

                e.appendChild(n);
            }
        }
    }

    /**
     * 
     */
    class Screen extends Client {
        /**
         * 
         */
        constructor() {
            super();

            this.orders = [];

            let d = new Date();

            this.handler = setTimeout(() => this.queue(), 1000 - d.getMilliseconds());
        }

        /**
         * 
         */
        message(data) {
            if(data.type == "order") {
                switch(data.order) {
                    case "show":
                        this.orders[data.index].state = 1;
                        this.orders[data.index].time = Date.now();
                    break;

                    case "hide":
                        this.orders[data.index].state = 3;
                    break;
                }
            } else if(data.type == "auth" && data.auth == "complete") {
                this.orders = [ ...Array(max).keys() ].reduce((a, v) => ({ ...a, [v]: {
                    state: 0,
                    time: 0,
                }}), {});

                data.orders.forEach(o => {
                    this.orders[o.index].state = 1;
                    this.orders[o.index].time = Date.now();
                })
            }
        }

        /**
         * 
         */
        queue() {
            clearTimeout(this.handler);

            let e;

            for(let k in this.orders) {
                let o = this.orders[k];

                switch(o.state) {
                    case 1:
                        e = doc.createElement("div");

                        e.dataset.index = k;
                        e.innerHTML = (Number(k) + 1).toString();

                        doc.querySelector("#screen .content").appendChild(e);

                        o.state = 2;
                    break;

                    case 2:
                        if(o.time + 60000 < Date.now()) {
                            o.state = 3;
                        }
                    break;

                    case 3:
                        e = doc.querySelector("[data-index=" + k + "]");

                        if(e) {
                            doc.querySelector("#screen .content").removeChild(e);
                        }

                        o.state = 4;
                    break;

                    case 4:

                    break;
                }
            }

            let d = new Date();

            this.handler = setTimeout(() => this.queue(), 1000 - d.getMilliseconds());
        }
    }

    /**
     * 
     */
    win.$ = new class Main {

        /**
         * 
         */
        constructor() {
            this.ready(() => {
                doc.querySelector("body").className = mode;

                doc.querySelector("form").onsubmit = (ev) => {
                    ev.preventDefault();

                    this.ws.send({ type: "auth", pwd: doc.querySelector("#pwd").value, mode });
                }

                this.ws = mode == "screen" ? new Screen() : new Tablet();
            });
        }

        /**
         * 
         */
        ready(fn) {
            if (!ready) {
                let s = doc.readyState;

                if (s == "complete") {
                    ready = true;
                } else if (s == "interactive") {
                    ready = loaded = true;
                } else if(typeof fn == "function") {
                    doc.addEventListener("DOMContentLoaded", fn)
                }

                if (ready && typeof fn == "function") fn();
            }

            return ready
        }

        /**
         * 
         */
        show(c) {
            doc.querySelectorAll("section").forEach(
                e => e.className = e.id == c ? "show" : ""
            );
        }
    };

})(window, document, undefined);