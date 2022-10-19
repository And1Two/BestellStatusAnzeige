/**
 * Copyright 2022 by Andrea Stancato
 * web.stancato@gmail.com
 */
const fs = require("fs");
const path = require("path");

const maxLifetime = 145454000;

/**
 * 
 */
class DeviceManager {

    /**
     * 
     */
    constructor() {
        this.write = false;
        this.devices = {};

        try {
            this.devices = JSON.parse(fs.readFileSync(path.join(__dirname, "devices.json"), "utf-8"));

            this.gc();
        } catch(e) {
            console.log("error", e);
        }
    }

    /**
     * 
     */
    gc() {
        let c = Object.keys(this.devices).length;

        for(let k in this.devices) {
            if(this.devices[k] + maxLifetime < Date.now()) {
                delete this.devices[k];
            }
        }

        if(c != Object.keys(this.devices).length){
            fs.writeFileSync(
                path.join(__dirname, "devices.json"), 
                JSON.stringify(this.devices, null, 4)
            );
        }
    }

    /**
     * 
     */
    save(uin, force) {
        return new Promise((resolve, reject) => {
            if(uin in this.devices && !force) {
                return Promise.reject({ mode: "error", error: "exists" });
            }

            // loop till write is completed
            while(this.write) {}
    
            // Switch Mode
            this.write = true;
    
            // Temp Object
            let o = Object.assign({}, this.devices);
            
            o[uin] = Date.now();
    
            // Save
            try {
                fs.writeFile(
                    path.join(__dirname, "devices.json"), 
                    JSON.stringify(o, null, 4), 
                    (error) => {
                        this.write = false;
        
                        if(error) {
                            console.log(error)

                            reject({ mode: "error", error });
                        } else {
                            this.devices = o;
    
                            resolve(uin);
                        }
                    }
                );
            } catch(e) {
                reject(e);
            }
        });
    }

    /**
     * 
     */
    exists(uin) {
        return uin in this.devices && this.devices[uin] + maxLifetime >= Date.now();
    }

    /**
     * 
     */
    generateUid() {
        let uin = "abcdefghijlmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ0123456789".split("").sort(() => 0.5 - Math.random()).slice(0, 18).join("");
    
        if(uin in this.devices) {
            return this.generateUid();
        }

        return uin;
    }
}

/**
 * 
 */
module.exports = DeviceManager;