interface-connection
==================

[![](https://img.shields.io/badge/made%20by-Protocol%20Labs-blue.svg?style=flat-square)](http://protocol.ai)
[![](https://img.shields.io/badge/project-libp2p-yellow.svg?style=flat-square)](http://libp2p.io/)
[![](https://img.shields.io/badge/freenode-%23libp2p-yellow.svg?style=flat-square)](http://webchat.freenode.net/?channels=%23libp2p)
[![Discourse posts](https://img.shields.io/discourse/https/discuss.libp2p.io/posts.svg)](https://discuss.libp2p.io)
[![](https://img.shields.io/codecov/c/github/libp2p/interface-connection.svg?style=flat-square)](https://codecov.io/gh/libp2p/interface-connection)
[![](https://img.shields.io/travis/libp2p/interface-connection.svg?style=flat-square)](https://travis-ci.com/libp2p/interface-connection)
[![Dependency Status](https://david-dm.org/libp2p/interface-connection.svg?style=flat-square)](https://david-dm.org/libp2p/interface-connection)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat-square)](https://github.com/feross/standard)

This is a test suite and interface you can use to implement a connection. A connection is understood as something that offers a mechanism for writing and reading data, back pressure, half and full duplex streams. This module and test suite were heavily inspired by abstract-blob-store and interface-stream-muxer.

The primary goal of this module is to enable developers to pick, swap or upgrade their connection without losing the same API expectations and mechanisms such as back pressure and the ability to half close a connection.

Publishing a test suite as a module lets multiple modules all ensure compatibility since they use the same test suite.

The API is presented with both JS and Go primitives, however there is no actual limitations for it to be extended to any other language, pushing forward the cross compatibility and interop through diferent stacks.

## Lead Maintainer

[Jacob Heun](https://github.com/jacobheun/)

# Modules that implement the interface

- [js-libp2p-tcp](https://github.com/libp2p/js-libp2p-tcp)
- [js-libp2p-webrtc-star](https://github.com/libp2p/js-libp2p-webrtc-star)
- [js-libp2p-websockets](https://github.com/libp2p/js-libp2p-websockets)
- [js-libp2p-utp](https://github.com/libp2p/js-libp2p-utp)
- [webrtc-explorer](https://github.com/diasdavid/webrtc-explorer)
- [js-libp2p-spdy](https://github.com/libp2p/js-libp2p-spdy)
- [js-libp2p-multiplex](https://github.com/libp2p/js-libp2p-multiplex)
- [js-libp2p-secio](https://github.com/libp2p/js-libp2p-secio)

# Badge

Include this badge in your readme if you make a module that is compatible with the `interface-connection` API. You can validate this by running the tests.

![](https://raw.githubusercontent.com/diasdavid/interface-connection/master/img/badge.png)

# How to use the battery of tests

## JS

```js
const test = require('interface-connection/test')
const YourConnection = require('../src')

const common = {
  setup: function () {
    return YourConnection
  },
  teardown: function () {
    // cleanup any resources created by setup()
    return new Promise()
  }
}

test(common)
```

## Go

> WIP

# API

A valid connection (one that follows this abstraction), must implement the following API:

**Table of contents:**

- type: `Connection`
  - `new Connection(stream)`
  - `conn.multiaddr()`
  - `Promise<PeerInfo> conn.getPeerInfo()`
  - `conn.source()`
  - `conn.sink()`
  - `Promise<> conn.close()`

### Creating a connection instance

- `JavaScript` - `const conn = new Connection(stream, remotePeer, multiaddr)`

Creates a new Connection instance.

`stream` is a streaming iterables duplex object responsible for allowing to read or write data through the connection.
`remotePeer` is a [PeerInfo](https://github.com/libp2p/js-peer-info) instance of the remote peer.
`multiaddr` is the [multiaddr](https://github.com/multiformats/multiaddr) address used to communicate with the remote peer.

### Get the multiaddr of the peer in the other end

- `JavaScript` - `conn.multiaddr`

This method the [multiaddr](https://github.com/multiformats/multiaddr) address used to communicate with the remote peer.

### Get the PeerInfo

- `JavaScript` - `conn.peerInfo`

This method retrieves the Peer Info object, which contains information about the remote peer of the connection.

It should return a `Promise<PeerInfo>`, which resolves to a [PeerInfo](https://github.com/libp2p/js-peer-info) object

### Get a connection Source

- `JavaScript` - `conn.source`

This getter returns the reference to the connection "source", which is an iterable object that can be consumed.

### Get a connection data collector

- `JavaScript` - `conn.sink`

This getter returns the reference to the connection "sink", which is an iterator that consumes (or drains) a source. 

### Close connection

- `JavaScript` - `conn.close()`

This method closes a connection with other peer.

It returns a `Promise`.

---

notes:
  - should follow the remaining Duplex stream operations
  - should have backpressure into account
  - should enable half duplex streams (close from one side, but still open for the other)
  - should support full duplex
  - tests should be performed by passing two streams
