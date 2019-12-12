/* global before describe it */

const {startRPCMockServer, TestProvider} = require('./helpers/blockchain');
const {assert} = require('chai');
const {Blockchain} = require('../lib/node');
const {promisify} = require('util');

describe('Blockchain', () => {
  describe('#connect', () => {
    before(() => {
      Blockchain.registerProvider('web3', TestProvider);
      Blockchain.setProvider('web3', {});
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
            scenario.servers.map(server => (
              promisify(startRPCMockServer)({successful: server})
            ))
          );
          const dappConnection = servers.map(server => server.connectionString);
          return {servers, dappConnection};
        };

        // test Blockchain.connect() using callback
        let {servers, dappConnection} = await makeServers();
        await new Promise((resolve, reject) => {
          Blockchain.connect({dappConnection}, err => {
            try {
              assert(scenario.error ? err : !err,
                scenario.error ? 'There should have been an error, but there was none' : 'There should not have been an error, but there was one');
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
          await Blockchain.connect({dappConnection});
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
