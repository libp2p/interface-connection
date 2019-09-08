'use strict'

const PeerInfo = require('peer-info')
const multiaddr = require('multiaddr')

const withIs = require('class-is')
const Stream = require('./stream')
const { DIRECTION, STATUS } = require('./types')

const assert = require('assert')
const errCode = require('err-code')

const defaultTimeForHasMultiplexer = 200
const defaultMaxNumberOfAttemptsForHasMultiplexer = 5

/**
 * An implementation of the js-libp2p connection.
 * Any libp2p transport should use an upgrader to return this connection.
 */
class Connection {
  /**
   * Creates an instance of Connection.
   * @param {object} properties properties of the connection.
   * @param {multiaddr} localAddr local multiaddr of the connection.
   * @param {multiaddr} remoteAddr remote multiaddr of the connection.
   * @param {PeerInfo} localPeer local peer info.
   * @param {PeerInfo} remotePeer remote peer info.
   * @param {function} newStream new stream muxer function.
   * @param {function} close close raw connection function.
   * @param {DIRECTION} direction connection establishment direction (inbound or outbound).
   * @param {string} multiplexer connection multiplexing identifier.
   * @param {string} encryption connection encryption method identifier.
   */
  constructor ({ localAddr, remoteAddr, localPeer, remotePeer, newStream, close, direction, multiplexer, encryption }) {
    assert(multiaddr.isMultiaddr(localAddr), 'localAddr must be an instance of multiaddr')
    assert(multiaddr.isMultiaddr(remoteAddr), 'remoteAddr must be an instance of multiaddr')
    assert(PeerInfo.isPeerInfo(localPeer), 'localPeer must be an instance of multiaddr')
    assert(PeerInfo.isPeerInfo(remotePeer), 'remotePeer must be an instance of multiaddr')
    assert(typeof newStream === 'function', 'new stream must be a function')
    assert(typeof close === 'function', 'close must be a function')
    assert(direction === DIRECTION.INBOUND || direction === DIRECTION.OUTBOUND, 'direction must be one of the Enum from connection.types')
    assert(typeof multiplexer === 'string', 'multiplexer identifier must be a string')
    assert(typeof encryption === 'string', 'encrypton protocol identifier must be a string')

    /**
     * Connection identifier
     */
    this.id = (parseInt(Math.random() * 1e9)).toString(36) + Date.now()

    /**
     * Status of the connection
     */
    this.status = STATUS.OPEN

    /**
     * Endpoints multiaddrs
     */
    this.endpoints = {
      localAddr,
      remoteAddr
    }

    /**
     * Local peer info.
     */
    this.localPeer = localPeer

    /**
     * Remote peer info.
     */
    this.remotePeer = remotePeer

    /**
     * Connection timeline
     */
    this.timeline = {
      open: Date.now(),
      close: undefined
    }

    /**
     * Connection establishment diection (inbound or outbound)
     */
    this.direction = direction

    /**
     * Reference to the new stream function of the multiplexer
     */
    this._newStream = newStream

    /**
     * Reference to the close function of the raw connection
     */
    this._close = close

    /**
     * Identifier of the multiplexer used
     */
    this.multiplexer = multiplexer

    /**
     * Identifier fo the encryption method used
     */
    this.encryption = encryption

    /**
     * Connection streams
     */
    this._streams = []

    /**
     * User provided tags
     */
    this.tags = []
  }

  /**
   * Get local address from the underlying transport.
   * @type {multiaddr}
   */
  get localAddr () {
    return this.endpoints.localAddr
  }

  /**
   * Get remote address from the underlying transport.
   * @type {multiaddr}
   */
  get remoteAddr () {
    return this.endpoints.remoteAddr
  }

  /**
   * Create a new stream from this connection
   * @param {string} protocol intended protocol for the stream
   * @param {object} [options={}] stream options
   * @param {boolean} [options.abortable=true] abortable signal
   * @return {Stream} new muxed+multistream-selected stream
   */
  async newStream (protocol, options = {}) {
    if (this.status === STATUS.CLOSING) {
      throw errCode(new Error('the connection is being closed'), 'ERR_CONNECTION_BEING_CLOSED')
    }

    if (this.status === STATUS.CLOSED) {
      throw errCode(new Error('the connection is closed'), 'ERR_CONNECTION_CLOSED')
    }

    if (!this.multiplexer) {
      await this._hasMultiplexerOrErrored(defaultMaxNumberOfAttemptsForHasMultiplexer)
    }

    const duplexStream = await this._newStream(protocol)
    const stream = new Stream(duplexStream, this, true, options)

    this._streams.push(stream)

    return stream
  }

  /**
   * On a new stream open for the other party in the connection.
   * @param {Stream} newStream new muxed+multistream-selected stream
   */
  onNewStream (newStream) {
    const stream = new Stream(newStream, this, false)
    this._streams.push(stream)
  }

  /**
   * Verify if the connection already has a multiplexer and wait accordingly
   * @param {number} attemptsLeft number of attempts left to check if available
   */
  async _hasMultiplexerOrErrored (attemptsLeft) {
    if (this.multiplexer) {
      return
    }

    if (!attemptsLeft) {
      throw errCode(new Error('no multiplexer available in the connection'), 'ERR_NO_MULTIPLEXER_AVAILABLE')
    }

    await new Promise((resolve) => setTimeout(() => resolve, defaultTimeForHasMultiplexer))

    return this._hasMultiplexerOrErrored(attemptsLeft - 1)
  }

  /**
   * Get all the streams associated with the connection.
   * @return {Array<Stream>}
   */
  getStreams () {
    return this._streams
  }

  /**
   * Close the connection, as well as all its associated streams.
   * @async
   */
  async close () {
    if (this.status === STATUS.CLOSED) {
      return
    }

    if (this._closing) {
      return this._closing
    }

    this.status = STATUS.CLOSING

    // Close all streams
    this._closing = this._closeStreams()
    await this._closing

    // Close raw connection
    this._closgin = await this._close()

    this.timeline.close = Date.now()
    this.status = STATUS.CLOSED
  }

  /**
   * Close all the streams associated with this connection.
   * @return {Promise}
   */
  _closeStreams () {
    return Promise.all(this._streams.map((stream) => stream.close()))
  }
}

module.exports = withIs(Connection, { className: 'Connection', symbolName: '@libp2p/interface-connection/connection' })
