const RouterOSClient = require("../dist").RouterOSClient;
const chai = require("chai");
// require("mocha");

const should = chai.should();
const expect = chai.expect;

const address = "10.62.0.25";
let conn, api, item;

describe("RouterOSAPICrud", () => {

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

    describe("handling crud operations", () => {

        it("should add three firewall filter rules on chain forward", (done) => {

            let menu = api.menu("/ip firewall filter");
            menu.add({
                chain: "forward",
                protocol: "tcp",
                action: "accept",
                comment: "first rule"
            }).then((response) => {
                response.should.have.property("ret").and.match(/^\*/);
                return menu.add({
                    chain: "forward",
                    protocol: "udp",
                    action: "accept",
                    disabled: true,
                    comment: "second rule"
                });
            }).then((response) => {
                response.should.have.property("ret").and.match(/^\*/);
                return menu.add({
                    chain: "forward",
                    protocol: "udp",
                    action: "accept",
                    disabled: true,
                    comment: "third rule"
                });
            }).then((response) => {
                response.should.have.property("ret").and.match(/^\*/);
                done();
            }).catch((err) => {
                done(err);
            });

        });

        it("should update the first rule", (done) => {
            let menu = api.menu("/ip firewall filter");
            menu.select("id").where({ comment: "first rule" }).first().then((response) => {
                response.should.have.property("id").and.match(/^\*/);
                return menu.where("id", response.id).update({ disabled: true });
            }).then((response) => {
                response.length.should.be.equal(0);
                done();
            }).catch((err) => {
                done(err);
            });
        });

        it("should unset the protocol value of the second filter rule", (done) => {
            let menu = api.menu("/ip firewall filter");
            menu.select("id").where({ comment: "second rule" }).first().then((response) => {
                response.should.have.property("id").and.match(/^\*/);
                return menu.unset("protocol", response.id);
            }).then((response) => {
                response.length.should.be.equal(1);
                done();
            }).catch((err) => {
                done(err);
            });
        });

        it("should move the second rule above first rule", (done) => {
            let menu = api.menu("/ip firewall filter");
            let firstRule, secondRule;
            menu.select("id").where({ comment: "first rule" }).first().then((response) => {
                response.should.have.property("id").and.match(/^\*/);
                firstRule = response.id;
                return menu.select("id").where({ comment: "second rule" }).first();
            }).then((response) => {
                response.should.have.property("id").and.match(/^\*/);
                secondRule = response.id;
                return menu.move(secondRule, firstRule);
            }).then((response) => {
                response.length.should.be.equal(0);
                done();
            }).catch((err) => {
                done(err);
            });
        });

        it("should create a collection from the third rule", (done) => {
            let menu = api.menu("/ip firewall filter");
            menu.select("id").where({ comment: "third rule" }).first().then((filterRule) => {
                filterRule.should.have.property("id").and.match(/^\*/);

                expect(filterRule).to.not.have.property("update");
                expect(filterRule).to.not.have.property("delete");
                expect(filterRule).to.not.have.property("unset");

                item = api.collect(filterRule);

                expect(item).to.have.property("update");
                expect(item).to.have.property("delete");
                expect(item).to.have.property("unset");

                done();

            }).catch((err) => {
                done(err);
            });
        });

        it("should add a source address to the third rule", (done) => {
            item.update({srcAddress: "6.6.6.6"}).then((result) => {
                item.srcAddress.should.be.equal("6.6.6.6");
                done();
            }).catch((err) => {
                done(err);
            });
        });

        it("should unset the source address from the third rule", (done) => {
            item.unset("srcAddress").then((result) => {
                item.should.not.have.property("srcAddress");
                done();
            }).catch((err) => {
                done(err);
            });
        });

        it("should move the third rule above the second rule", () => {
            let menu = api.menu("/ip firewall filter");
            let secondRule;
            menu.select("id").where({ comment: "second rule" }).first().then((response) => {
                response.should.have.property("id").and.match(/^\*/);
                secondRule = response.id;
                return item.move(secondRule);
            }).then((response) => {
                item.nextid.should.be.equal(secondRule);
                done();
            }).catch((err) => {
                done(err);
            });
        });

        it("should remove the third rule");

        // it("should delete the added filter rules", (done) => {
        //     let menu = api.menu("/ip firewall filter");
        //     menu.only("id").where({ comment: "first rule" }).orWhere({ comment: "second rule" }).get().then((response) => {
        //         response.length.should.be.equal(2);
        //         return menu.remove([
        //             response[0].id,
        //             response[1].id
        //         ]);
        //     }).then((response) => {
        //         response.length.should.be.equal(0);
        //         done();
        //     }).catch((err) => {
        //         done(err);
        //     });
        // });

    });    

    after("should disconnect", (done) => {
        conn.close().then(() => {
            done();
        }).catch((err) => {
            done(err);
        });
    });

});