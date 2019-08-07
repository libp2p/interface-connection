'use strict'

const PeerInfo = require('peer-info')
const multiaddr = require('multiaddr')
const multistream = require('multistream-select')

const withIs = require('class-is')
const Stream = require('./stream')
const { ROLE, STATUS } = require('./types')

const assert = require('assert')
const errCode = require('err-code')

const defaultTimeForHasMultiplexer = 200
const defaultMaxNumberOfAttemptsForHasMultiplexer = 5

/**
 * An implementation of the js-libp2p connection.
 * It should be override by the transport to add the iterable logic.
 */
class Connection {
  /**
   * Creates an instance of Connection.
   * @param {multiaddr} remoteMa remote peer multiaddr
   * @param {boolean} [isInitiator=true] peer initiated the connection
   */
  constructor (remoteMa, isInitiator = true) {
    assert(multiaddr.isMultiaddr(remoteMa), 'remoteMa must be an instance of multiaddr')
    assert(typeof isInitiator === 'boolean', 'isInitiator must be a boolean')

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
      local: undefined,
      remote: remoteMa
    }

    /**
     * Connection timeline
     */
    this.timeline = {
      open: Date.now(),
      close: undefined
    }

    /**
     * Role in the connection, initiator or responder
     */
    this.role = isInitiator ? ROLE.INITIATOR : ROLE.RESPONDER

    /**
     * Remote peer infos
     */
    this.peerInfo = undefined

    /**
     * Reference of the multiplexer being used
     */
    this.multiplexer = undefined

    /**
     * The encryption method being used
     */
    this.encryption = undefined

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
   * Get observed address from the underlying transport
   * @return {multiaddr} remote peer multiaddr
   */
  getObservedAddrs () {
    return this.endpoints.remote
  }

  /**
   * Update connection metadata after being upgraded through the
   * negotiation of the stream multiplexer and encryption protocol.
   * @param {Multiplexer} multiplexer stream muxer instance
   * @param {string} encryption encryption protocol
   */
  upgraded (multiplexer, encryption) {
    // TODO: validate parameters
    this.multiplexer = multiplexer
    this.encryption = encryption
  }

  /**
   * Set local address of the connection after running identify.
   * @param {multiaddr} ma used in the connection.
   */
  setLocalAddress (ma) {
    assert(multiaddr.isMultiaddr(ma), 'ma must be an instance of multiaddr')

    this.endpoints.local = ma
  }

  /**
   * Set remote peer info.
   * @param {PeerInfo} peerInfo remote peer PeerInfo
   */
  setPeerInfo (peerInfo) {
    assert(PeerInfo.isPeerInfo(peerInfo), 'peerInfo must be an instance of PeerInfo')

    this.peerInfo = peerInfo
  }

  /**
   * Create a new stream from this connection
   * @param {string} protocol intended protocol for the stream
   * @param {object} [options={}] stream options
   * @param {boolean} [options.abortable=true] abortable signal
   * @return {Stream} stream instance
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

    const duplexStream = await this.multiplexer.newStream()
    const stream = new Stream(duplexStream, this, true, options)

    this._streams.push(stream)

    // If no protocol provided, return the stream
    if (!protocol) {
      return stream
    }

    // Create a new instance of the multistream to handle the protocol selection
    const msDialer = new multistream.Dialer()

    // Negotiate the multistream protocol
    await msDialer.handle(duplexStream)

    // Handshake on the desired protocol
    await msDialer.select(protocol)
    stream.setProtocol(protocol)

    return stream
  }

  /**
   * On a new stream open for the other party in the connection.
   * @param {*} duplexStream streaming iterables duplex object
   */
  onNewStream (duplexStream) {
    const stream = new Stream(duplexStream, this, false)
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
