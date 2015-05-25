'use strict';

global.Promise = require('native-promise-only');
var sleepqueue = require('./sleepqueue');
var sleep = require('then-sleep');
var chai = require('chai');
var expect = chai.expect;

chai.use(require('chai-as-promised'));

describe('sleepqueue', function() {
  it('exposes a factory function', function() {
    expect(sleepqueue).to.be.a('function');
  });

  it('waits `interval` between callbacks', function() {
    var queue = sleepqueue({ interval: 20 });
    var then = Date.now();

    queue.push(resolve());
    queue.push(resolve());

    return queue.push(resolve()).then(function() {
      expect(Date.now() - then).to.be.within(40, 59);
    });
  });

  it('executes first callback immediately', function() {
    var queue = sleepqueue({ interval: 50 });
    var then = Date.now();

    return queue.push(resolve()).then(function() {
      expect(Date.now() - then).to.be.within(0, 5);
    });
  });

  it('does not stop queueing objects once the queue is empty', function(done) {
    var queue = sleepqueue();
    var calls = [];

    queue.push(pushTo(calls, 1));
    queue.push(pushTo(calls, 2));
    queue.push(pushTo(calls, 3));

    queue.once('empty', secondRound);

    function secondRound() {
      queue.push(pushTo(calls, 4));
      queue.push(pushTo(calls, 5));
      queue.push(pushTo(calls, 6));

      queue.once('empty', evaluate);
    }

    function evaluate() {
      expect(calls).to.deep.equal([1, 2, 3, 4, 5, 6]);
      done();
    }
  });

  it('stops when errors are uncaught', function(done) {
    var queue = sleepqueue();
    var calls = [];

    queue.push(pushTo(calls, 1));
    queue.push(pushTo(calls, 2));
    queue.push(reject('test'));
    queue.push(pushTo(calls, 3));

    setTimeout(function() {
      expect(calls).to.deep.equal([1, 2]);
      done();
    }, 10);
  });

  it('emits an error event when errors are uncaught', function(done) {
    var queue = sleepqueue();

    queue.push(reject('test'));

    queue.once('error', function(err) {
      expect(err).to.equal('test');
      done();
    });
  });

  it('does not emit an error event when errors are caught', function(done) {
    var queue = sleepqueue();
    var called = false;

    queue.push(function() {
      return reject('test')().catch(function(){});
    });

    queue.once('error', function(err) { called = true; });

    setTimeout(function() {
      expect(called).to.equal(false);
      done();
    }, 10);
  });

  describe('stop', function() {
    it('prevents other callbacks on the queue from being called in the future', function(done) {
      var queue = sleepqueue();
      var calls = [];

      queue.push(pushTo(calls, 1));
      queue.push(pushTo(calls, 2));
      queue.push(pushTo(calls, 3)).then(queue.stop);

      queue.push(pushTo(calls, 4));
      queue.push(pushTo(calls, 5));
      queue.push(pushTo(calls, 6));

      setTimeout(function() {
        expect(calls).to.deep.equal([1, 2, 3]);
        done();
      }, 10);
    });
  });

  describe('push', function() {
    it('pushes functions to the end of the queue', function(done) {
      var queue = sleepqueue();
      var calls = [];

      queue.push(pushTo(calls, 1));
      queue.push(pushTo(calls, 2));
      queue.push(pushTo(calls, 3));

      queue.once('empty', function() {
        expect(calls).to.deep.equal([1, 2, 3]);
        done();
      });
    });

    it('returns promises for each function pushed', function() {
      var queue = sleepqueue();

      return Promise.all([
        expect(queue.push(resolve(1))).to.eventually.equal(1),
        expect(queue.push(resolve(2))).to.eventually.equal(2),
        expect(queue.push(resolve(3))).to.eventually.equal(3)
      ]);
    });

    it('returns rejected errors when a callback throws an error', function() {
      var queue = sleepqueue();

      return expect(queue.push(reject('test')))
        .to.eventually.be.rejectedWith('test');
    });
  });

  describe('unshift', function() {
    it('pushes functions to the start of the queue', function(done) {
      var queue = sleepqueue();
      var calls = [];

      queue.unshift(pushTo(calls, 1));
      queue.unshift(pushTo(calls, 2));
      queue.unshift(pushTo(calls, 3));

      queue.once('empty', function() {
        expect(calls).to.deep.equal([3, 2, 1]);
        done();
      });
    });

    it('returns promises for each function pushed', function() {
      var queue = sleepqueue();

      return Promise.all([
        expect(queue.unshift(resolve(1))).to.eventually.equal(1),
        expect(queue.unshift(resolve(2))).to.eventually.equal(2),
        expect(queue.unshift(resolve(3))).to.eventually.equal(3)
      ]);
    });

    it('returns rejected errors when a callback throws an error', function() {
      var queue = sleepqueue();

      return expect(queue.unshift(reject('test')))
        .to.eventually.be.rejectedWith('test');
    });
  });

  function reject(val) {
    return function() {
      return Promise.reject(val);
    };
  }

  function resolve(val) {
    return function() {
      return Promise.resolve(val);
    };
  }

  function pushTo(array, num) {
    return function() {
      array.push(num);
      return Promise.resolve(num);
    };
  }
});
