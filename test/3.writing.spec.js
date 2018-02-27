const RouterOSClient = require("../dist").RouterOSClient;
const chai = require("chai");
const config = require("./config.json");

const should = chai.should();
const expect = chai.expect;

let conn,
    api,
    menu,
    item,
    firstRule,
    secondRule,
    thirdRule;

describe("RouterOSAPICrud", () => {

    before("should stablish connection and save api object", (done) => {
        conn = new RouterOSClient({
            host: config.host,
            user: config.user,
            password: config.password,
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

            menu = api.menu("/ip firewall filter");
            menu.add({
                chain: "forward",
                protocol: "tcp",
                action: "accept",
                comment: "first rule"
            }).then((response) => {
                response.should.have.property("ret").and.match(/^\*/);
                firstRule = response.ret;
                return menu.add({
                    chain: "forward",
                    protocol: "udp",
                    action: "accept",
                    disabled: true,
                    comment: "second rule"
                });
            }).then((response) => {
                response.should.have.property("ret").and.match(/^\*/);
                secondRule = response.ret;
                return menu.add({
                    chain: "forward",
                    protocol: "udp",
                    action: "accept",
                    disabled: true,
                    comment: "third rule"
                });
            }).then((response) => {
                response.should.have.property("ret").and.match(/^\*/);
                thirdRule = response.ret;
                done();
            }).catch((err) => {
                done(err);
            });

        });

        it("should update the first rule", (done) => {
            menu.where("id", firstRule).update({ disabled: true }).then((response) => {
                response.length.should.be.equal(0);
                done();
            }).catch((err) => {
                done(err);
            });
        });

        it("should unset the protocol value of the second filter rule", (done) => {
            menu.unset("protocol", secondRule).then((response) => {
                response.length.should.be.equal(1);
                done();
            }).catch((err) => {
                done(err);
            });
        });

        it("should move the second rule above first rule", (done) => {
            menu.move(secondRule, firstRule).then((response) => {
                response.length.should.be.equal(0);
                done();
            }).catch((err) => {
                done(err);
            });
        });

        it("should create a model from the third rule", (done) => {
            menu.where({ id: thirdRule }).first().then((filterRule) => {
                filterRule.should.have.property("id").and.match(/^\*/);

                expect(filterRule).to.not.have.property("update");
                expect(filterRule).to.not.have.property("delete");
                expect(filterRule).to.not.have.property("unset");

                item = api.model(filterRule);

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

        it("should move the third rule above the first rule", (done) => {
            item.move(firstRule).then((response) => {
                done();
            }).catch((err) => {
                done(err);
            });
        });

        it("should remove the third rule", (done) => {
            item.remove().then(() => {
                done();
            }).catch((err) => {
                done(err);
            });
        });

        it("should delete the added filter rules", (done) => {
            menu.only("id").where({ comment: "first rule" }).orWhere({ comment: "second rule" }).get().then((response) => {
                response.length.should.be.equal(2);
                return menu.remove([
                    response[0].id,
                    response[1].id
                ]);
            }).then((response) => {
                response.length.should.be.equal(0);
                done();
            }).catch((err) => {
                done(err);
            });
        });

        it("should add a webproxy acl and remove it without id", (done) => {
            const webproxyMenu = api.menu("/ip proxy access");
            const data = {
                srcAddress: "192.168.88.10",
                dstHost: ":random\\-site\\.com",
                comment: "random rule"
            };
            webproxyMenu.add(data).then((response) => {
                return webproxyMenu.remove(data);
            }).then((response) => {
                return webproxyMenu.where(data).get();
            }).then((response) => {
                response.length.should.be.equal(0);
                done();
            }).catch((err) => {
                done(err);
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