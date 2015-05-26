# sleepqueue

[![Travis Build](http://img.shields.io/travis/maximilianschmitt/sleepqueue.svg?style=flat)](https://travis-ci.org/maximilianschmitt/sleepqueue) [![Code Coverage](https://img.shields.io/coveralls/maximilianschmitt/sleepqueue.svg)](https://coveralls.io/r/maximilianschmitt/sleepqueue) [![npm](https://img.shields.io/npm/dm/sleepqueue.svg)](https://www.npmjs.com/package/sleepqueue)

A promise-based queue that sleeps between callbacks.

## Installation

```
$ npm i sleepqueue -S
```

## Usage

### General

```js
var sleepqueue = require('sleepqueue');

// create a queue with an interval of 1 second
var queue = sleepqueue({ interval: 1000 });

// `push` pushes to the end of the queue
queue.push(print('My name is'));
queue.push(print('My name is'));
queue.push(print('My name is'));
queue.push(print('Slim Shady'));

// `unshift` pushes to the start of the queue
queue.unshift(print('Hi'));

// just a helper function
function print(what) {
  return function() {
    console.log(what);
  };
}
```

Output:

```
Hi
# (wait 1 second)
My name is
# (wait 1 second)
My name is
# (wait 1 second)
My name is
# (wait 1 second)
Slim Shady
```

### Errors

Uncaught errors and rejected promises will stop the queue and emit an error event.

```js
queue.push(print('Hello'));
queue.push(function() {
  throw 'I stopped the queue';
});
queue.push(print('Bye'));

queue.on('error', function(err) {
  console.log('Error: ' + err);
});
```

Output:

```
Hello
Error: I stopped the queue
```
