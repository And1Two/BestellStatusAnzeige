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
    max = 40;

    /**
     * 
     */
    class Client {

    }

    /**
     * 
     */
    class Tablet extends Client {

    }

    /**
     * 
     */
    class Screen extends Client {
        /**
         * 
         */
        constructor(ws) {
            this.ws = ws;
        }
    }

    /**
     * 
     */
    class WebSocketHandler {
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
            this.ws = new WebSocket(doc.location.href.replace(/^http/, "ws"));

            let c = doc.querySelector("header svg").classList;

            this.ws.onopen = (ev) => {
                c.add("auth");
                c.remove("online", "offline");
            };

            this.ws.onclose = (ev) => {
                c.add("offline");
                c.remove("online", "auth");

                setTimeout(() => this.connect(), 2000);
            };

            this.ws.onerror = (ev) => {
                console.log("Error", ev)
            };

            this.ws.onmessage = (ev) => {
                try {
                    let data = JSON.parse(ev.data);

                    switch(data.type) {
                        case "auth":
                            switch(data.auth) {
                                case "init":
                                    if(uin) {
                                        $.show("tablet");

                                        this.send({ type: "auth", uin, mode });
                                    } else {
                                        $.show("password");
                                    }
                                break;

                                case "uin":
                                    if(data.uin != uin) {
                                        uin = data.uin;

                                        localStorage.setItem("uin", uin);
                                    }

                                    this.send({ type: "auth", uin, mode });
                                break;

                                case "complete":
                                    c.add("online");
                                    c.remove("offline", "auth");

                                    max = data.max;
        
                                    $.show("tablet");
                                    $.createMatrix(data.orders);
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
                } catch(e) {
                    console.log(e);
                }
            };
        }

        /**
         * 
         */
        send(data) {
            this.ws.send(JSON.stringify(data));
        }

        /**
         * 
         */
        auth() {
            this.send({ type: "auth", pwd: doc.querySelector("#pwd").value, mode });
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

                    this.ws.auth();
                }

                this.ws = new WebSocketHandler();
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
                        this.ws.send({ type: "lock", index: i });
                    } else if(n.className == "owner") {
                        this.ws.send({ type: "serve", index: i });
                    }
                };

                e.appendChild(n);
            }
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