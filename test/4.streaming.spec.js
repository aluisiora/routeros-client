const RouterOSClient = require('../dist').RouterOSClient;
const chai = require('chai');
const config = require('./config');

const should = chai.should();

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

    describe('streaming content', function () {
        this.timeout(12000);

        it('should stream torch on interface 1 and stop after 5 seconds', (done) => {
            const menu = api.menu('/tool/torch');
            let started = false;
            menu.where('interface', 'ether1').stream((err, packet, torch) => {
                should.not.exist(err);
                should.exist(packet);

                if (!started) {
                    started = true;
                    setTimeout(() => {
                        torch
                            .stop()
                            .then(() => {
                                done();
                            })
                            .catch((err) => {
                                done(err);
                            });
                    }, 5000);
                }
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
