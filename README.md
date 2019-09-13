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

Publishing a test suite as a module lets multiple modules ensure compatibility since they use the same test suite.

The API is presented with both JS and Go primitives, however there is no actual limitations for it to be extended to any other language, pushing forward the cross compatibility and interop through different stacks.

## Lead Maintainer

[Jacob Heun](https://github.com/jacobheun/)

## Modules that implement the interface

- [js-libp2p-tcp](https://github.com/libp2p/js-libp2p-tcp)
- [js-libp2p-webrtc-star](https://github.com/libp2p/js-libp2p-webrtc-star)
- [js-libp2p-websockets](https://github.com/libp2p/js-libp2p-websockets)
- [js-libp2p-utp](https://github.com/libp2p/js-libp2p-utp)
- [webrtc-explorer](https://github.com/diasdavid/webrtc-explorer)
- [js-libp2p-spdy](https://github.com/libp2p/js-libp2p-spdy)
- [js-libp2p-multiplex](https://github.com/libp2p/js-libp2p-multiplex)
- [js-libp2p-secio](https://github.com/libp2p/js-libp2p-secio)

## Badge

Include this badge in your readme if you make a module that is compatible with the `interface-connection` API. You can validate this by running the tests.

![](https://raw.githubusercontent.com/diasdavid/interface-connection/master/img/badge.png)

## Usage

### Connection

Before creating a connection from a transport compatible with `libp2p` it is important to understand some concepts:

- **socket**: the underlying raw duplex connection between two nodes. It is created by the transports during a dial/listen.
- **[multiaddr connection](https://github.com/libp2p/interface-transport#multiaddrconnection)**: an abstraction over the socket to allow it to work with multiaddr addresses. It is a duplex connection that transports create to wrap the socket before passing to an upgrader that turns it into a standard connection (see below).
- **connection**: a connection between two _peers_ that has built in multiplexing and info about the connected peer. It is created from a [multiaddr connection](https://github.com/libp2p/interface-transport#multiaddrconnection) by an upgrader. The upgrader uses multistream-select to add secio and multiplexing and returns this object.
- **stream**: a muxed duplex channel of the `connection`. Each connection may have many streams.

A connection stands for the libp2p communication duplex layer between two nodes. It is **not** the underlying raw transport duplex layer (socket), such as a TCP socket, but an abstracted layer that sits on top of the raw socket.

This helps ensuring that the transport is responsible for socket management, while also allowing the application layer to handle the connection management.

### Test suite

#### JS

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

#### Go

> WIP

## API

### Connection

A valid connection (one that follows this abstraction), must implement the following API:

- type: `Connection`
  - `new Connection({localAddr, remoteAddr, localPeer, remotePeer, newStream, close, direction, multiplexer, encryption})`
  - `<Multiaddr> conn.localAddr`
  - `<Multiaddr> conn.remoteAddr`
  - `<PeerInfo> conn.localPeer`
  - `<PeerInfo> conn.remotePeer`
  - `<String> conn.direction`
  - `Promise<Stream> conn.newStream(protocol, [options])`
  - `Array<Stream> conn.getStreams()`
  - `Promise<> conn.close()`

It can be obtained as follows:

```js
const { Connection } = require('interface-connection')
```

#### Creating a connection instance

- `JavaScript` - `const conn = new Connection({localAddr, remoteAddr, localPeer, remotePeer, newStream, close, direction, multiplexer, encryption})`

Creates a new Connection instance.

`localAddr` is the [multiaddr](https://github.com/multiformats/multiaddr) address used by the local peer to reach the remote.
`remoteAddr` is the [multiaddr](https://github.com/multiformats/multiaddr) address used to communicate with the remote peer.
`localPeer` is the [PeerInfo](https://github.com/libp2p/js-peer-info) of the local peer.
`remotePeer` is the [PeerInfo](https://github.com/libp2p/js-peer-info) of the remote peer.
`newStream` is the `function` responsible for getting a new muxed+multistream-selected stream.
`close` is the `function` responsible for closing the raw connection.
`direction` is a `Direction` indicating whether the connection is `INBOUND` or `OUTBOUND`.

#### Create a new stream

- `JavaScript` - `conn.newStream(protocol, options)`

Create a new stream within the connection.

`protocol` is the intended protocol to use. This is optional and may be `undefined`. Example: `/echo/1.0.0`
`options` is an object containing the stream options.
`options.abortable` is a boolean for using the abortable signal. Default value: `true`.

It returns a `Promise` with the instance of the created `Stream`.

#### Get the connection Streams

- `JavaScript` - `conn.getStreams()`

Get all the streams associated with this connection.

It returns an `Array` with the instance of all the streams created in this connection.

#### Close connection

- `JavaScript` - `conn.close()`

This method closes the connection to the remote peer, as well as all the streams running in the connection.

It returns a `Promise`.

#### Connection identifier

- `JavaScript` - `conn.id`

This property contains the identifier of the connection.

#### Remote address

- `JavaScript` - `conn.remoteAddr`

This getter returns the `remote` [multiaddr](https://github.com/multiformats/multiaddr) address.

#### Local address

- `JavaScript` - `conn.localAddr`

This getter returns the `local` [multiaddr](https://github.com/multiformats/multiaddr) address.

#### Remote peer info

- `JavaScript` - `conn.remotePeer`

This property contains the remote peer info of this connection.

#### Local peer info

- `JavaScript` - `conn.localPeer`

This property contains the local peer info of this connection.

#### Status of the connection

- `JavaScript` - `conn.status`

This property contains the status of the connection. It can be either `OPEN`, `CLOSED` or `CLOSING`. Once the connection is created it is in an `OPEN` status. When a `conn.close()` happens, the status will change to `CLOSING` and finally, after all the connection streams are properly closed, the status will be `CLOSED`.

#### Endpoints multiaddr

- `JavaScript` - `conn.endpoints`

This property contains an object with the `local` and `remote` multiaddrs as properties. The `local` multiaddr is `undefined` until the connection is upgraded and `identify` finishes.

#### Timeline

- `JavaScript` - `conn.timeline`

This property contains an object with the `open` and `close` timestamps of the connection. The `close` timestamp is `undefined` until the connection is closed.

#### Role of the connection

- `JavaScript` - `conn.direction`

This property contains the direction of the peer in the connection. It can be `INBOUND` or `OUTBOUND`.

#### Multiplexer

- `JavaScript` - `conn.multiplexer`

This property contains a reference to the `multiplexer` being used in the connection. It is `undefined` until the connection has been upgraded.

#### Encryption

- `JavaScript` - `conn.encryption`

This property contains the encryption method being used in the connection. It is `undefined` if the connection is not encrypted.

#### Tags

- `JavaScript` - `conn.tags`

This property contains an array of tags associated with the connection. New tags can be pushed to this array during the connection's lifetime.

### Stream

A valid stream (one that follows this abstraction), must implement the following API:

- type: `Stream`
  - `new Stream()`
  - `stream.source` - iterable object
  - `stream.sink` - Function
  - `stream.close()`

It can be obtained as follows:

```js
const { Stream } = require('interface-connection')
```

#### Creating a stream instance

- `JavaScript` - `const stream = new Stream(iterableDuplex, connection, isInitator, options)`

Creates a new Stream instance.

`iterableDuplex` is a streaming iterable duplex object.
`connection` is a reference to the connection associated with this stream.
`isInitiator` is a `boolean` indicating whether the peer creating the Stream instance initiated the stream. Default value: `true`.
`options` is an object containing the stream options.
`options.abortable` is a boolean for using the abortable signal. Default value: `true`.

#### Get a connection Source

- `JavaScript` - `stream.source`

This getter returns a reference to the connection "source", which is an iterable object that can be consumed.

#### Get a connection data collector

- `JavaScript` - `stream.sink`

This getter returns a reference to the connection "sink", which is an iterator that drains a source. 

#### Close connection

- `JavaScript` - `stream.close()`

This method closes a stream with the other peer.

It returns a `Promise`.

#### Stream identifier

- `JavaScript` - `stream.id`

This property contains the identifier of the stream.

#### Stream associated connection

- `JavaScript` - `stream.connection`

This property contains the connection associated with this stream.

#### Direction of the strean

- `JavaScript` - `stream.direction`

This property contains the direction of the peer in the stream. It can be `INBOUND` or `OUTBOUND`.

#### Timeline

- `JavaScript` - `stream.timeline`

This property contains an object with the `open` and `close` timestamps of the stream. The `close` timestamp is `undefined` until the stream is closed.

### Direction

It can be obtained as follows:

```js
const { DIRECTION } = require('interface-connection')

// DIRECTION.INBOUND
// DIRECTION.OUTBOUND
```

### Status

It can be obtained as follows:

```js
const { STATUS } = require('interface-connection')

// STATUS.OPEN
// STATUS.CLOSED
// STATUS.CLOSING
```
