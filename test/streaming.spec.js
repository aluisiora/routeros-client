const RouterOSClient = require("../dist").RouterOSClient;
const chai = require("chai");

const should = chai.should();

const address = "10.62.0.25";
let conn, api;

describe("RosApiOperations", () => {

    before("should stablish connection and save api object", (done) => {
        conn = new RouterOSClient({
            host: address,
            user: "admin",
            password: "admin",
            keepalive: true
        });
        conn.connect().then((connApi) => {
            api = connApi;
            done();
        }).catch((err) => {
            done(err);
        });
    });

    describe("streaming content", function() {
        this.timeout(8000);
        
        it("should stream torch on interface 1 and stop after 5 seconds", (done) => {

            const menu = api.menu("/tool/torch");
            let started = false;
            menu.where("interface", "ether1").stream((err, packet, torch) => {
                should.not.exist(err);
                should.exist(packet);

                if (!started) {
                    started = true;
                    setTimeout(() => {
                        torch.stop().then(() => {
                            done();
                        }).catch((err) => {
                            done(err);
                        });
                    }, 5000);
                }                
            });
        });

    });

    after("should disconnect", (done) => {
        conn.close().then(() => {
            done();
        }).catch((err) => {
            done(err);
        });
    });

});