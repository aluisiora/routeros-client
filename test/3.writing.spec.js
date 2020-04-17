const RouterOSClient = require('../dist').RouterOSClient;
const chai = require('chai');
const config = require('./config');

const should = chai.should();
const expect = chai.expect;

let conn, api, menu, thirdRuleModel, firstRule, secondRule, thirdRule;

describe('RouterOSAPICrud', () => {
    before('should stablish connection and save api object', (done) => {
        conn = new RouterOSClient({
            host: config.host,
            user: config.user,
            password: config.password,
            keepalive: true,
        });
        conn.connect()
            .then((connApi) => {
                api = connApi;
                done();
            })
            .catch((err) => {
                done(err);
            });
    });

    describe('handling crud operations', () => {
        describe('#add()', () => {
            it('should add three firewall filter rules on chain forward', (done) => {
                const data = {
                    chain: 'forward',
                    protocol: 'tcp',
                    action: 'accept',
                    comment: 'first rule',
                };

                menu = api.menu('/ip firewall filter');
                menu.add(data)
                    .then((response) => {
                        response.should.have.property('id').and.match(/^\*/);
                        response.should.have.property('comment').and.be.equal(data.comment);
                        response.should.have.property('chain').and.be.equal(data.chain);
                        response.should.have.property('protocol').and.be.equal(data.protocol);
                        response.should.have.property('action').and.be.equal(data.action);
                        firstRule = response.id;
                        return menu.add({
                            chain: 'forward',
                            protocol: 'udp',
                            action: 'accept',
                            srcAddress: '7.7.7.7',
                            disabled: true,
                            comment: 'second rule',
                        });
                    })
                    .then((response) => {
                        response.should.have.property('id').and.match(/^\*/);
                        response.should.have.property('srcAddress').and.be.equal('7.7.7.7');
                        secondRule = response.id;
                        return menu.add({
                            chain: 'forward',
                            protocol: 'udp',
                            action: 'accept',
                            disabled: true,
                            comment: 'third rule',
                        });
                    })
                    .then((response) => {
                        response.should.have.property('id').and.match(/^\*/);
                        thirdRule = response.id;
                        done();
                    })
                    .catch((err) => {
                        done(err);
                    });
            });

            it('should create a model from the third rule', (done) => {
                menu.where({ id: thirdRule })
                    .first()
                    .then((filterRule) => {
                        filterRule.should.have.property('id').and.match(/^\*/);

                        expect(filterRule).to.not.have.property('update');
                        expect(filterRule).to.not.have.property('delete');
                        expect(filterRule).to.not.have.property('unset');

                        thirdRuleModel = api.model(filterRule);

                        expect(thirdRuleModel).to.have.property('update');
                        expect(thirdRuleModel).to.have.property('delete');
                        expect(thirdRuleModel).to.have.property('unset');

                        done();
                    })
                    .catch((err) => {
                        done(err);
                    });
            });

            it('should add 3 rules and insert a 4th rule after the first without id', (done) => {
                const webproxyMenu = api.menu('/ip proxy access');
                const data1 = {
                    srcAddress: '192.168.88.11',
                    dstHost: ':random\\-site11\\.com',
                    comment: 'random rule 11',
                };
                const data2 = {
                    srcAddress: '192.168.88.22',
                    dstHost: ':random\\-site22\\.com',
                    comment: 'random rule 22',
                };
                const data3 = {
                    srcAddress: '192.168.88.33',
                    dstHost: ':random\\-site33\\.com',
                    comment: 'random rule 33',
                };
                const data4 = {
                    srcAddress: '192.168.88.44',
                    dstHost: ':random\\-site44\\.com',
                    comment: 'random rule 44',
                    placeAfter: { ...data1 },
                };

                let firstRule;
                let secondRule;

                webproxyMenu
                    .add(data1)
                    .then(() => {
                        return webproxyMenu.add(data2);
                    })
                    .then(() => {
                        return webproxyMenu.add(data3);
                    })
                    .then(() => {
                        return webproxyMenu.add(data4);
                    })
                    .then(() => {
                        return webproxyMenu.getAll();
                    })
                    .then((response) => {
                        response.forEach((res) => {
                            if (firstRule && !secondRule) {
                                secondRule = res;
                            } else if (res.comment === data1.comment) {
                                firstRule = res;
                            }
                        });
                        return webproxyMenu.remove(data1);
                    })
                    .then(() => {
                        return webproxyMenu.remove(data2);
                    })
                    .then(() => {
                        return webproxyMenu.remove(data3);
                    })
                    .then(() => {
                        delete data4.placeAfter;
                        return webproxyMenu.remove(data4);
                    })
                    .then(() => {
                        secondRule.comment.should.be.equal(data4.comment);
                        done();
                    })
                    .catch((err) => {
                        done(err);
                    });
            });

            it('should add 3 rules and insert a 4th rule after the first with id', (done) => {
                const webproxyMenu = api.menu('/ip proxy access');
                const data1 = {
                    srcAddress: '192.168.90.11',
                    dstHost: ':random\\-site11\\.com',
                    comment: 'random rule 11',
                };
                const data2 = {
                    srcAddress: '192.168.90.22',
                    dstHost: ':random\\-site22\\.com',
                    comment: 'random rule 22',
                };
                const data3 = {
                    srcAddress: '192.168.90.33',
                    dstHost: ':random\\-site33\\.com',
                    comment: 'random rule 33',
                };
                const data4 = {
                    srcAddress: '192.168.90.44',
                    dstHost: ':random\\-site44\\.com',
                    comment: 'random rule 44',
                };

                let firstRule;
                let secondRule;
                let firstRid;

                webproxyMenu
                    .add(data1)
                    .then((response) => {
                        firstRid = response.id;
                        return webproxyMenu.add(data2);
                    })
                    .then(() => {
                        return webproxyMenu.add(data3);
                    })
                    .then(() => {
                        data4.placeAfter = firstRid;
                        return webproxyMenu.add(data4);
                    })
                    .then(() => {
                        return webproxyMenu.getAll();
                    })
                    .then((response) => {
                        response.forEach((res) => {
                            if (firstRule && !secondRule) {
                                secondRule = res;
                            } else if (res.comment === data1.comment) {
                                firstRule = res;
                            }
                        });
                        return webproxyMenu.remove(data1);
                    })
                    .then(() => {
                        return webproxyMenu.remove(data2);
                    })
                    .then(() => {
                        return webproxyMenu.remove(data3);
                    })
                    .then(() => {
                        delete data4.placeAfter;
                        return webproxyMenu.remove(data4);
                    })
                    .then(() => {
                        secondRule.comment.should.be.equal(data4.comment);
                        done();
                    })
                    .catch((err) => {
                        done(err);
                    });
            });
        });

        describe('#update()', () => {
            it('should update the first rule', (done) => {
                menu.where('id', firstRule)
                    .update({ disabled: true })
                    .then((response) => {
                        response.should.have.property('disabled').and.be.equal(true);
                        done();
                    })
                    .catch((err) => {
                        done(err);
                    });
            });

            it('should add a source address to the third rule', (done) => {
                thirdRuleModel
                    .update({ srcAddress: '6.6.6.6' })
                    .then((result) => {
                        thirdRuleModel.srcAddress.should.be.equal('6.6.6.6');
                        result.srcAddress.should.be.equal('6.6.6.6');
                        if (thirdRuleModel !== result) done('Not the same object');
                        done();
                    })
                    .catch((err) => {
                        done(err);
                    });
            });
        });

        describe('#unset()', () => {
            it('should unset the protocol value of the second filter rule', (done) => {
                menu.unset('protocol', secondRule)
                    .then((response) => {
                        response.should.have.property('id').and.be.equal(secondRule);
                        response.should.have.property('comment').and.be.equal('second rule');
                        response.should.not.have.property('protocol');
                        done();
                    })
                    .catch((err) => {
                        done(err);
                    });
            });

            it('should query unset the source address of the second filter rule', (done) => {
                menu.where('comment', 'second rule')
                    .unset('srcAddress')
                    .then((response) => {
                        response.should.have.property('id').and.be.equal(secondRule);
                        response.should.have.property('comment').and.be.equal('second rule');
                        response.should.not.have.property('srcAddress');
                        done();
                    })
                    .catch((err) => {
                        done(err);
                    });
            });

            it('should unset the source address from the third rule', (done) => {
                thirdRuleModel
                    .unset('srcAddress')
                    .then((result) => {
                        thirdRuleModel.should.not.have.property('srcAddress');
                        if (thirdRuleModel !== result) done('Not the same object');
                        done();
                    })
                    .catch((err) => {
                        done(err);
                    });
            });
        });

        describe('#move()', () => {
            it('should move the second rule above first rule', (done) => {
                let foundRule;

                menu.move(secondRule, firstRule)
                    .then((response) => {
                        response.should.have.property('id').and.be.equal(secondRule);
                        return menu.getAll();
                    })
                    .then((items) => {
                        for (const item of items) {
                            if (foundRule) {
                                item.id.should.be.equal(firstRule);
                                break;
                            } else if (item.id === secondRule) foundRule = item.id;
                        }
                        foundRule.should.exist;
                        done();
                    })
                    .catch((err) => {
                        done(err);
                    });
            });

            it('should move the third rule above the second rule', (done) => {
                let foundRule;

                thirdRuleModel
                    .move(secondRule)
                    .then((result) => {
                        result.should.have.property('id').and.be.equal(thirdRuleModel.id);
                        if (thirdRuleModel !== result) done('Not the same object');
                        return menu.getAll();
                    })
                    .then((items) => {
                        for (const item of items) {
                            if (foundRule) {
                                item.id.should.be.equal(secondRule);
                                break;
                            } else if (item.id === thirdRuleModel.id) foundRule = item.id;
                        }
                        foundRule.should.exist;
                        done();
                    })
                    .catch((err) => {
                        done(err);
                    });
            });

            it('should move the third rule above the first rule by querying its comment', (done) => {
                let foundRule;

                menu.where('comment', 'third rule')
                    .moveAbove(firstRule)
                    .then((response) => {
                        response.should.have.property('id').and.be.equal(thirdRule);
                        return menu.getAll();
                    })
                    .then((items) => {
                        for (const item of items) {
                            if (foundRule) {
                                item.id.should.be.equal(firstRule);
                                break;
                            } else if (item.id === thirdRule) foundRule = item.id;
                        }
                        foundRule.should.exist;
                        done();
                    })
                    .catch((err) => {
                        done(err);
                    });
            });
        });

        describe('#remove()', () => {
            it('should remove the third rule', (done) => {
                thirdRuleModel
                    .remove()
                    .then((result) => {
                        result.should.have.property('id').and.be.equal(thirdRuleModel.id);
                        done();
                    })
                    .catch((err) => {
                        done(err);
                    });
            });

            it('should delete the added filter rules', (done) => {
                let firstId, secondId;
                menu.only('id')
                    .where({ comment: 'first rule' })
                    .orWhere({ comment: 'second rule' })
                    .get()
                    .then((response) => {
                        response.length.should.be.equal(2);
                        firstId = response[0].id;
                        secondId = response[1].id;
                        return menu.remove([firstId, secondId]);
                    })
                    .then((response) => {
                        response.length.should.be.equal(2);
                        response[0].should.have.property('id').and.be.equal(firstId);
                        response[1].should.have.property('id').and.be.equal(secondId);
                        done();
                    })
                    .catch((err) => {
                        done(err);
                    });
            });

            it('should add a webproxy acl and remove it without id', (done) => {
                const webproxyMenu = api.menu('/ip proxy access');
                const data = {
                    srcAddress: '192.168.88.10',
                    dstHost: ':random\\-site\\.com',
                    comment: 'random rule',
                };
                webproxyMenu
                    .add(data)
                    .then((response) => {
                        return webproxyMenu.remove(data);
                    })
                    .then((response) => {
                        return webproxyMenu.where(data).get();
                    })
                    .then((response) => {
                        response.length.should.be.equal(0);
                        done();
                    })
                    .catch((err) => {
                        done(err);
                    });
            });

            it('should add a webproxy acl and another before it, using place-before query, and then remove both without using id', (done) => {
                const webproxyMenu = api.menu('/ip proxy access');
                const data1 = {
                    srcAddress: '192.168.88.12',
                    dstHost: ':random\\-site2\\.com',
                    comment: 'random rule 2',
                };
                const data2 = {
                    srcAddress: '192.168.88.13',
                    dstHost: ':random\\-site3\\.com',
                    comment: 'random rule 3',
                    placeBefore: { ...data1 },
                };

                let firstRule;
                let secondRule;

                webproxyMenu
                    .add(data1)
                    .then(() => {
                        return webproxyMenu.add(data2);
                    })
                    .then(() => {
                        return webproxyMenu.getAll();
                    })
                    .then((response) => {
                        response.forEach((res) => {
                            if (res.comment === data1.comment || res.comment === data2.comment) {
                                if (!firstRule) firstRule = { ...res };
                                else secondRule = { ...res };
                            }
                        });
                        return webproxyMenu.remove(data1);
                    })
                    .then(() => {
                        delete data2.placeBefore;
                        return webproxyMenu.remove(data2);
                    })
                    .then((response) => {
                        firstRule.comment.should.be.equal(data2.comment);
                        secondRule.comment.should.be.equal(data1.comment);
                        done();
                    })
                    .catch((err) => {
                        done(err);
                    });
            });

            it('should add 2 webproxy rules and remove then by querying using OR', (done) => {
                const webproxyMenu = api.menu('/ip proxy access');
                const data1 = {
                    srcAddress: '192.168.90.1',
                    dstHost: ':random\\-site101\\.com',
                    comment: 'random rule 1 so pick me up',
                };
                const data2 = {
                    srcAddress: '192.168.90.2',
                    dstHost: ':random\\-site202\\.com',
                    comment: 'random rule 2 so tear me down',
                };

                webproxyMenu
                    .add(data1)
                    .then(() => {
                        return webproxyMenu.add(data2);
                    })
                    .then(() => {
                        return webproxyMenu
                            .where('comment', 'random rule 1 so pick me up')
                            .orWhere('comment', 'random rule 2 so tear me down')
                            .remove();
                    })
                    .then((removedItems) => {
                        removedItems.should.have.property('length').and.be.equal(2);
                        removedItems[0].should.have.property('comment').and.be.equal(data1.comment);
                        removedItems[1].should.have.property('comment').and.be.equal(data2.comment);
                        done();
                    })
                    .catch((err) => {
                        done(err);
                    });
            });
        });
    });

    after('should disconnect', (done) => {
        conn.close()
            .then(() => {
                done();
            })
            .catch((err) => {
                done(err);
            });
    });
});
