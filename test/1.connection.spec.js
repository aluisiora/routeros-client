const RouterOSClient = require('../dist').RouterOSClient;
const chai = require('chai');
const config = require('./config');

const should = chai.should();

describe('RouterOSClient', () => {
    describe('#connect', () => {
        it('should connect with valid username and password', (done) => {
            const conn = new RouterOSClient({
                host: config.host,
                user: config.user,
                password: config.password,
            });

            conn.connect()
                .then((api) => {
                    should.exist(api);
                    conn.close();
                    done();
                })
                .catch((err) => {
                    done(err);
                });
        });

        it('should not connect with invalid username and password', function (done) {
            this.timeout(7000);

            const conn = new RouterOSClient({
                host: config.host,
                user: 'admin1',
                password: 'admin1',
                timeout: 5,
            });

            conn.connect()
                .then((api) => {
                    should.not.exist(api);
                    conn.close();
                    done();
                })
                .catch((err) => {
                    done();
                });
        });
    });
});
