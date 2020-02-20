/* globals describe it before beforeEach */

import { Events } from 'embark-core';
const Assert = require("assert");
const {expect} = require("chai");

let events;
const testEventName = "testevent";

describe('embark.Events', function () {
  this.timeout(10000);
  before(() => {
    events = new Events();
  });

  beforeEach(() => {
    events.removeAllListeners(testEventName);
    events.removeAllListeners(`request:${testEventName}`);
  });

  describe('Set event listeners', function () {
    it('should be able to listen to an event emission', (done) => {
      events.on(testEventName, ({isTest}) => {
        // eslint-disable-next-line no-unused-expressions
        expect(isTest).to.be.true;
        done();
      });
      events.emit(testEventName, { isTest: true });
    });

    it('should be able to listen to an event emission once', (done) => {
      events.once(testEventName, ({isTest}) => {
        // eslint-disable-next-line no-unused-expressions
        expect(isTest).to.be.true;
        done();
      });
      events.emit(testEventName, { isTest: true });
    });
  });
  describe('Set command handlers', function() {
    it('should be able to set a command handler and request the event', (done) => {
      events.setCommandHandler(testEventName, () => {
        Assert.ok(true);
        done();
      });
      events.request(testEventName);
    });

    it('should be able to set a command handler with data and request the event', (done) => {
      events.setCommandHandler(testEventName, (options, cb) => {
        // eslint-disable-next-line no-unused-expressions
        expect(options.isTest).to.be.true;
        cb(options);
      });
      events.request(testEventName, { isTest: true }, (data) => {
        // eslint-disable-next-line no-unused-expressions
        expect(data.isTest).to.be.true;
        done();
      });
    });

    it('should be able to set a command handler with data and request the event once', (done) => {
      events.setCommandHandlerOnce(testEventName, (options, cb) => {
        // eslint-disable-next-line no-unused-expressions
        expect(options.isTest).to.be.true;
        cb(options);
      });
      events.request(testEventName, { isTest: true }, (data) => {
        // eslint-disable-next-line no-unused-expressions
        expect(data.isTest).to.be.true;
        events.request(testEventName, { isTest: true }, (_data) => {
          Assert.fail("Should not call the requested event again, as it was set with once only");
        });
        done();
      });
    });

    it('should be able to request an event before a command handler has been set', (done) => {
      let testData = { isTest: true, manipulatedCount: 0 };
      events.request(testEventName, testData, (dataFirst) => {
        // eslint-disable-next-line no-unused-expressions
        expect(dataFirst.isTest).to.be.true;
        expect(dataFirst.manipulatedCount).to.equal(1);
        // eslint-disable-next-line no-unused-expressions
        expect(dataFirst.isAnotherTest).to.be.undefined;
      });
      events.request(testEventName, testData, (dataSecond) => {
        // eslint-disable-next-line no-unused-expressions
        expect(dataSecond.isTest).to.be.true;
        expect(dataSecond.manipulatedCount).to.equal(2);
        // eslint-disable-next-line no-unused-expressions
        expect(dataSecond.isAnotherTest).to.be.undefined;

        dataSecond.isAnotherTest = true;
        events.request(testEventName, dataSecond, (dataThird) => {
          // eslint-disable-next-line no-unused-expressions
          expect(dataThird.isTest).to.be.true;
          expect(dataThird.manipulatedCount).to.equal(3);
          // eslint-disable-next-line no-unused-expressions
          expect(dataThird.isAnotherTest).to.be.true;
          done();
        });
      });
      events.setCommandHandler(testEventName, (options, cb) => {
        // eslint-disable-next-line no-unused-expressions
        expect(options.isTest).to.be.true;
        options.manipulatedCount++;
        cb(options);
      });
    });

    it('should be able to request an event before a command handler has been set once', (done) => {
      let testData = { isTest: true, manipulatedCount: 0 };
      events.request(testEventName, testData, (data) => {
        // eslint-disable-next-line no-unused-expressions
        expect(data.isTest).to.be.true;
        expect(data.manipulatedCount).to.equal(1);
        // eslint-disable-next-line no-unused-expressions
        expect(data.isAnotherTest).to.be.undefined;
        events.request(testEventName, data, (_dataSecondRun) => {
          Assert.fail("Should not call the requested event again, as it was set with once only");
        });
      });
      events.request(testEventName, testData, (_dataThirdRun) => {
        done();
      });
      events.setCommandHandlerOnce(testEventName, (options, cb) => {
        // eslint-disable-next-line no-unused-expressions
        expect(options.isTest).to.be.true;
        options.manipulatedCount = options.manipulatedCount + 1;
        cb(options);
      });
    });
  });
});
