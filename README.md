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

This is a test suite and interface you can use to implement a connection. The connection interface contains all the metadata associated with it, as well as an array of the streams opened through this connection. In the same way as the connection, a stream contains properties with its metadata, plus an iterable duplex object that offers a mechanism for writing and reading data, with back pressure. This module and test suite were heavily inspired by abstract-blob-store and interface-stream-muxer.

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
describe('your connection', () => {
  require('interface-connection/src/tests')({
    async setup () {
      return YourConnection
    },
    async teardown () {
      // cleanup resources created by setup()
    }
  })
})
```

## Go

> WIP

# API

## Connection

A valid connection (one that follows this abstraction), must implement the following API:

- type: `Connection`
  - `new Connection(peerInfo, remoteMa, isInitiator)`
  - `conn.upgraded(multiplexer, encryption)`
  - `conn.setLocalAddress(multiaddr)`
  - `Promise<Stream> conn.newStream(options)`
  - `Array<Stream> conn.getStreams()`
  - `Promise<> conn.close()`

It can be obtained as follows:

```js
const { Connection } = require('interface-connection')
```

### Creating a connection instance

- `JavaScript` - `const conn = new Connection(peerInfo, remoteMa, isInitiator = true)`

Creates a new Connection instance.

`peerInfo` is a [PeerInfo](https://github.com/libp2p/js-peer-info) instance of the remote peer.
`remoteMa` is the [multiaddr](https://github.com/multiformats/multiaddr) address used to communicate with the remote peer.
`isInitiator` is a `boolean` for signaling if the peer creating the connection instance was the responsible for the creation of the connection. Default value: `true`.

### Update connection metadata after connection upgrade

- `JavaScript` - `conn.upgraded(multiplexer, encryption)`

Updates the connection metadata after being upgraded through the negotiation of the stream multiplexer and encryption protocols.

`multiplexer` is a stream muxer implementing the [interface-stream-muxer](https://github.com/libp2p/interface-stream-muxer).
`encryption` is a `string` with the encryption protocol.

### Set local address

- `JavaScript` - `conn.setLocalAddress(multiaddr)`

Set the local address used in the connection. It is obtained after running `identify`.

`multiaddr` is the local peer [multiaddr](https://github.com/multiformats/multiaddr) used. 

### Create a new stream

- `JavaScript` - `conn.newStream(protocol, options)`

Create a new stream within the connection.

`protocol` is the intended protocol to use. This is optional and may be `undefined`.
`options` is an object containing the stream options.
`options.signal` is a boolean for using the abortable signal. Default value: `true`.

It returns a `Promise` with the intance of the created `Stream`.

### Get the connection Streams

- `JavaScript` - `conn.getStreams()`

Get all the streams associated with this connection.

It returns an `Array` with the instance of all the streams created in this connection.

### Close connection

- `JavaScript` - `conn.close()`

This method closes a connection with other peer, as well as all the streams running in the connection.

It returns a `Promise`.

### Connection identifier

- `JavaScript` - `conn.id`

This property contains the identifier of the connection.

### Remote peer info

- `JavaScript` - `conn.peerInfo`

This property contains the remote peer info of this connection.

### Status of the connection

- `JavaScript` - `conn.status`

This property contains the status of the connection. It can be either `OPEN`, `CLOSED` or `CLOSING`.

### Endpoints multiaddr

- `JavaScript` - `conn.endpoints`

This property contains an object with the `local` and `remote` multiaddrs as properties. While the connection was not upgraded and `identify` finished, the `local` multiaddr is `undefined`.

### Timeline

- `JavaScript` - `conn.timeline`

This property contains an object with the `open` and `close` timestamps of the connection. While the connection was not closed, the `close` timestamp is `undefined`.

### Role of the connection

- `JavaScript` - `conn.role`

This property contains the role of the peer in the connection. It can be `INITIATOR` or `RESPONDER`.

### Multiplexer

- `JavaScript` - `conn.multiplexer`

This property contains the reference for the `multiplexer` being used in the connection. Before the connection being upgraded, this is `undefined`.

### Encryption

- `JavaScript` - `conn.encryption`

This property contains the encryption method being used in the connection. Before the connection being upgraded, this is `undefined`.

### Tags

- `JavaScript` - `conn.tags`

This property contains an array of tags associated with the connection. New tags can be pushed to this array during the connection life.

## Stream

A valid stream (one that follows this abstraction), must implement the following API:

- type: `Stream`
  - `new Stream()`
  - `stream.source()`
  - `stream.sink()`
  - `stream.close()`

It can be obtained as follows:

```js
const { Stream } = require('interface-connection')
```

### Creating a stream instance

- `JavaScript` - `const stream = new Stream(iterableDuplex, connection, isInitator, options)`

Creates a new Stream instance.

`iterableDuplex` is a streaming iterable duplex object.
`connection` is a reference to the connection associated with this stream.
`isInitiator` is a `boolean` for signaling if the peer creating the stream instance was the responsible for the creation it. Default value: `true`.
`options` is an object containing the stream options.
`options.signal` is a boolean for using the abortable signal. Default value: `true`.

### Get a connection Source

- `JavaScript` - `stream.source`

This getter returns the reference to the connection "source", which is an iterable object that can be consumed.

### Get a connection data collector

- `JavaScript` - `stream.sink`

This getter returns the reference to the connection "sink", which is an iterator that consumes (or drains) a source. 

### Close connection

- `JavaScript` - `stream.close()`

This method closes a stream with the other peer.

It returns a `Promise`.

### Stream identifier

- `JavaScript` - `stream.id`

This property contains the identifier of the stream.

### Stream associated connection

- `JavaScript` - `stream.connection`

This property contains the connection associated with this stream.

### Role of the strean

- `JavaScript` - `stream.role`

This property contains the role of the peer in the stream. It can be `INITIATOR` or `RESPONDER`.

### Timeline

- `JavaScript` - `stream.timeline`

This property contains an object with the `open` and `close` timestamps of the stream. While the stream was not closed, the `close` timestamp is `undefined`.

## Role

It can be obtained as follows:

```js
const { ROLE } = require('interface-connection')

// ROLE.INITIATOR
// ROLE.RESPONDER
```

## Status

It can be obtained as follows:

```js
const { STATUS } = require('interface-connection')

// STATUS.OPEN
// STATUS.CLOSED
// STATUS.CLOSING
```

---

notes:
  - should follow the remaining Duplex stream operations
  - should have backpressure into account
  - should enable half duplex streams (close from one side, but still open for the other)
  - should support full duplex
  - tests should be performed by passing two streams
