((win, doc, undef) => {
    "use strict";

    /**
     * 
     */
    class WebSocketHandler {
        constructor(url) {
            this.timeoutHandler = undef;

            this.connect(url);
        }

        connect(url) {
            this.ws = new WebSocket(url);

            this.ws.addEventListener("open", (ev) => {
                clearInterval(this.timeoutHandler);
    
                console.log("open", ev);
    
                doc.querySelector("body").innerHTML = "connected";
            });
    
            this.ws.addEventListener("message", (ev) => {
                console.log("message", ev);
    
            });
    
            this.ws.addEventListener("error", (ev) => {
                console.log("error", ev);
            });
    
            this.ws.addEventListener("close", (ev) => {
                console.log("close", ev);
    
                
                doc.querySelector("body").innerHTML = "disconnected";
    
                this.timeoutHandler = setTimeout(() => this.connect(url), 1000);
            });
        }
    }

    /**
     * 
     */
    win.$ = new class Main {

        constructor() {
            this.ws = new WebSocketHandler(doc.location.href.replace(/^http(s)?/, "ws$1"));
        }

    };

})(window, document, undefined);