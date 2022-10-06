/**
 * Copyright 2022 by Andrea Stancato
 * web.stancato@gmail.com
 */
const ws = require("./WebSocketHandler");
const http = require("http");
const fs = require("fs");
const path = require("path");

let server = new class Server {
    /**
     * 
     */
    constructor() {
        const server = this.http = http.createServer((request, response) => {
            let url = require("url").parse(request.url, true),
                p = url.pathname.substr(1);

            let file = url.pathname.substr(1).split("/");

            if(file.length == 1 && file[0] === "") {
                file[0] = "index.html";
            }

            file = path.join(...[ __dirname, "htdocs", ...file ]);

            if(fs.existsSync(file)) {
                if(fs.statSync(file).isFile()) {
                    this.serveFile(response, file);
                } else {
                    this.serverError(response, 403);
                }
            } else {
                this.serverError(response, 404);
            }
        }).listen(process.argv[3] || 80, () => {
            console.log("Server is running on Port " + server.address().port)
            
            this.socket = new ws({ server }, process.argv[4] || 40);
        });
    }

    /**
     * 
     */
    serveFile(res, file) {
        let ext = file.substr(file.lastIndexOf(".") + 1);
        
        const mime = {
            "png": "image/png",
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "ico": "image/x-icon",
            "css": "text/css",
            "html": "text/html",
            "js": "application/javascript"
        };
        
        if(ext in mime) {
            res.writeHead(200, { "Content-Type": mime[ext] });

            if(/(^text)|(javascript$)/.test(mime[ext])) {
                res.end(fs.readFileSync(file, "utf-8"), "utf-8");
            } else {
                res.end(fs.readFileSync(file));
            }
        } else {
            this.serverError(res, 400);
        }
    }

    /**
     * 
     */
    serverError(res, code) {
        let error = {
            "400": "Bad Request",
            "403": "Forbidden",
            "404": "Not Found",
        };

        res.writeHead(200).end("Status: " + error[code.toString()]);
    }
};
