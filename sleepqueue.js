'use strict';

var EventEmitter = require('events').EventEmitter;
var assign = require('object.assign');
var sleep = require('then-sleep');

var sleepqueue = function(opts) {
  opts = assign({}, { interval: 0 }, opts || {});
  var currentTimeout = null;
  var queue = [];

  var api = {
    push: push,
    unshift: unshift,
    stop: stop
  };

  assign(api, EventEmitter.prototype);
  EventEmitter.call(api);

  return api;

  function start() {
    clean();
    next();
  }

  function next() {
    setTimeout(function() {
      var cb = queue.shift();

      if (!cb) {
        api.emit('empty');
        return;
      }

      var fn = cb[0];
      var deferred = cb[1];

      Promise.resolve().then(fn).catch(deferred.reject).then(deferred.resolve);
      deferred.promise.catch(onError).then(function() {
        currentTimeout = setTimeout(next, opts.interval);
      });
    });
  }

  function push(fn) {
    var deferred = Promise.defer();

    queue.push([fn, deferred]);

    if (queue.length <= 1) {
      start();
    }

    return deferred.promise;
  }

  function unshift(fn) {
    var deferred = Promise.defer();

    queue.unshift([fn, deferred]);

    if (queue.length <= 1) {
      start();
    }

    return deferred.promise;
  }

  function stop() {
    clean();
    queue = [];
  }

  function clean() {
    if (currentTimeout) {
      clearTimeout(currentTimeout);
    }
  }

  function onError(err) {
    api.emit('error', err);
    api.stop();
  }
};

module.exports = sleepqueue;
