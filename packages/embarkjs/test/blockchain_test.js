/* global before describe it require */

const {startRPCMockServer, TestProvider} = require('./test');
const {assert} = require('chai');
const Blockchain = require('../dist/blockchain');

describe('Blockchain', () => {
  describe('#connect', () => {
    before(() => {
      Blockchain.default.registerProvider('web3', TestProvider);
      Blockchain.default.setProvider('web3', {});
    });

    const scenarios = [
      {
        description: 'should not keep trying other connections if connected',
        servers: [true, true],
        visited: [true, false],
        error: false
      },
      {
        description: 'should keep trying other connections if not connected',
        servers: [false, true],
        visited: [true, true],
        error: false
      },
      {
        description: 'should return error if no connections succeed',
        servers: [false, false],
        visited: [true, true],
        error: true
      }
    ];

    scenarios.forEach(({description, ...scenario}) => {
      it(description, async () => {
        const makeServers = async () => {
          const servers = await Promise.all(
            scenario.servers.map(
              server => {
                return new Promise((resolve, reject) => {
                  startRPCMockServer({successful: server}, (err, server) => {
                    return err ? reject(err) : resolve(server);
                  });
                });
              }
            )
          );
          const dappConnection = servers.map(server => server.connectionString);
          return {servers, dappConnection};
        };

        // test Blockchain.connect() using callback
        let {servers, dappConnection} = await makeServers();
        await new Promise((resolve, reject) => {
          Blockchain.default.connect({dappConnection}, err => {
            if (scenario.error) {
              try {
                assert(err);
              } catch (e) {
                return reject(e);
              }
            }
            try {
              servers.forEach((server, idx) => {
                assert.strictEqual(server.visited, scenario.visited[idx]);
              });
              resolve();
            } catch (e) {
              reject(e);
            }
          });
        });

        // test Blockchain.connect() without callback
        ({servers, dappConnection} = await makeServers());
        try {
          await Blockchain.default.connect({dappConnection});
        } catch (e) {
          if (!scenario.error) throw e;
        }
        servers.forEach((server, idx) => {
          assert.strictEqual(server.visited, scenario.visited[idx]);
        });
      });
    });
  });
});
