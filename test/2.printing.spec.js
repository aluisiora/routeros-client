const RouterOSClient = require('../dist').RouterOSClient;
const chai = require('chai');
const config = require('./config');

const should = chai.should();
const expect = chai.expect;

let conn, api;

describe('RosApiCommands', () => {
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

    describe('printing and filtering prints', () => {
        it('should get return nothing from /interface where name is ether6', (done) => {
            api.menu('/interface')
                .where('name', 'ether6')
                .getOnly()
                .then((interf) => {
                    expect(interf).to.be.equal(null);
                    done();
                })
                .catch((err) => {
                    done(err);
                });
        });

        it('should get return nothing from /ppp active', (done) => {
            api.menu('/ppp active')
                .get()
                .then((items) => {
                    items.length.should.be.equal(0);
                    done();
                })
                .catch((err) => {
                    done(err);
                });
        });

        it('should get all interfaces from /interface', (done) => {
            api.menu('/interface')
                .get()
                .then((interfaces) => {
                    interfaces.length.should.be.above(0);
                    done();
                })
                .catch((err) => {
                    done(err);
                });
        });

        it('should get only id and name from /interface', (done) => {
            api.menu('/interface')
                .select(['id', 'name'])
                .find()
                .then((interf) => {
                    interf.should.have.a.property('id');
                    interf.should.have.a.property('name');
                    interf.should.not.have.a.property('type');
                    done();
                })
                .catch((err) => {
                    done(err);
                });
        });

        it('should count the interfaces returning a number', (done) => {
            api.menu('/interface')
                .options('countOnly')
                .get()
                .then((count) => {
                    expect(count.length).to.be.equal(1);
                    expect(count[0].ret).to.match(/^\d+$/);
                    done();
                })
                .catch((err) => {
                    done(err);
                });
        });

        it('should return only the ether1 interface data', (done) => {
            api.menu('/interface')
                .where('name', 'ether1')
                .get()
                .then((count) => {
                    expect(count.length).to.be.equal(1);
                    expect(count[0].name).to.be.equal('ether1');
                    done();
                })
                .catch((err) => {
                    done(err);
                });
        });

        it('should count only the ether1 interface data, returning number 1', (done) => {
            api.menu('/interface')
                .where('name', 'ether1')
                .options('countOnly')
                .get()
                .then((count) => {
                    expect(count[0].ret).to.be.equal(1);
                    done();
                })
                .catch((err) => {
                    done(err);
                });
        });

        it('should print where the interface is not ether2', (done) => {
            api.menu('/interface')
                .whereNot('name', 'ether2')
                .get()
                .then((interfaces) => {
                    expect(interfaces.length).to.be.above(0);
                    for (const interf of interfaces) {
                        expect(interf.name).to.be.not.equal('ether2');
                    }
                    done();
                })
                .catch((err) => {
                    done(err);
                });
        });

        it('should print where the interface is ether1 or ether2', (done) => {
            api.menu('/interface')
                .where('name', 'ether1')
                .orWhere('name', 'ether2')
                .get()
                .then((interfaces) => {
                    expect(interfaces.length).to.be.above(0);
                    for (const interf of interfaces) {
                        expect(interf.name).to.be.oneOf(['ether1', 'ether2']);
                    }
                    done();
                })
                .catch((err) => {
                    done(err);
                });
        });

        it('should return a model of interfaces from /interface', (done) => {
            api.menu('/interface')
                .getModel()
                .then((interfaces) => {
                    expect(interfaces.length).to.be.above(0);
                    for (const interf of interfaces) {
                        expect(interf).to.have.property('update');
                        expect(interf).to.have.property('delete');
                        expect(interf).to.have.property('unset');
                    }
                    done();
                })
                .catch((err) => {
                    done(err);
                });
        });

        it('should create a model from ether1', (done) => {
            api.menu('/interface')
                .where('name', 'ether1')
                .find()
                .then((interfac) => {
                    expect(interfac).to.not.have.property('update');
                    expect(interfac).to.not.have.property('delete');
                    expect(interfac).to.not.have.property('unset');

                    interfac = api.model(interfac);

                    expect(interfac).to.have.property('update');
                    expect(interfac).to.have.property('delete');
                    expect(interfac).to.have.property('unset');
                    done();
                })
                .catch((err) => {
                    done(err);
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
