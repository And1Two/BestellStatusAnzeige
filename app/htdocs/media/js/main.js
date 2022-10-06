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
    loaded = false,

    /**
     * Device Mode
     */
    mode = (new Proxy(new URLSearchParams(window.location.search), { get: (p, k) => p.get(k)})).mode || "tablet",

    /**
     * 
     */
    currentIndex = -1,

    /**
     * 
     */
    openOrders = 0,

    /**
     * 
     */
    orders = [],

    /**
     *
     */
    max = 40;

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
            this.ws = new WebSocket(document.location.href.replace(/^http/, "ws"));

            this.ws.onopen = (ev) => {
                this.ws.send(JSON.stringify({ bla: "test" }));

                let c = document.querySelector("header svg").classList;

                c.add("online");
                c.remove("offline");
            };

            this.ws.onclose = (ev) => {
                let c = document.querySelector("header svg").classList;

                c.add("offline");
                c.remove("online");

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
                            this.send({ type: "auth", mode  });

                            currentIndex = data.index;
                            max = data.count;

                            orders = [ ...Array(max).keys() ].map(e => e = 0);

                            $.createMatrix();
                        break;

                    }



                    console.log(ev.data);

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
                document.querySelector("body").className = mode

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
        settings() {

        }

        /**
         * 
         */
        createMatrix() {

        }

        /**
         * 
         */
        show(i) {
            doc.querySelectorAll("section").forEach(
                (e, index) => e.style.display = i == index ? "block" : "none"
            );
        }

        /**
         * 
         */
        addOrder(e) {
            currentIndex++;
            openOrders++;

            if(currentIndex >= 40) currentIndex = 0;

            orders[currentIndex] = 1;

            e.querySelector("span").innerHTML = currentIndex + 1;

            this.createQueue();
        }

        /**
         * 
         */
        closeOrder(i, v) {
            if(v == 0) {
                orders[i] = orders[i] == 2 ? 0 : 1;

                doc.querySelector("#screen .content").innerHTML = "<div>" + (i + 1) + "</div>";
            } else {
                orders[i] = v;
            }

            this.createQueue();
        }

        /**
         * 
         */
        createQueue() {
            let r = doc.querySelector("#register div.content:nth-of-type(2)");

            r.innerHTML = "";

            orders.forEach((v, i) => {
                if(v > 0) {
                    let e = doc.createElement("button");

                    e.dataset.index = i;
                    e.className = "s" + v;
                    e.innerText = i + 1;
                    e.onclick = () => this.closeOrder(i, 0);

                    r.appendChild(e);
                }
            });

            doc.querySelector("#citchen .content").innerHTML = r.innerHTML;

            doc.querySelectorAll("#citchen .content button").forEach(e => e.onclick = () => this.closeOrder(Number(e.dataset.index), 2) );
        }
    };


})(window, document, undefined);