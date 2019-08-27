'use strict'

const abortable = require('abortable-iterator')
const { ROLE } = require('./types')
const withIs = require('class-is')

const assert = require('assert')
const errCode = require('err-code')

/**
 * An implementation of the js-libp2p stream.
 */
class Stream {
  /**
   * Creates an instance of Stream.
   * @param {*} iterableDuplex streaming iterables duplex object
   * @param {Connection} connection connection associated with the stream
   * @param {boolean} [isInitiator=true] peer initiated the stream
   * @param {object} [options={}] stream options
   * @param {boolean} [options.abortable=true] abortable signal
   * @memberof Stream
   */
  constructor (iterableDuplex, connection, isInitiator = true, options = {}) {
    assert(typeof isInitiator === 'boolean', 'isInitiator must be a boolean')

    /**
     * Stream identifier
     */
    this.id = (parseInt(Math.random() * 1e9)).toString(36) + Date.now()

    /**
     * Streaming iterable duplex object
     */
    this._iterableDuplex = iterableDuplex

    /**
     * Stream parent connection
     */
    this.connection = connection

    /**
     * Role in the stream, initiator or responder
     */
    this.role = isInitiator ? ROLE.INITIATOR : ROLE.RESPONDER

    /**
     * Stream timeline
     */
    this.timeline = {
      open: Date.now(),
      close: undefined
    }

    /**
     * User provided tags
     */
    this.tags = []

    /**
     * Stream protocol
     */
    this.protocol = undefined

    /**
     * Stream options
     */
    this._options = {
      abortable: !(options.abortable === false)
    }

    this.sink = this._sink.bind(this)
    this.source = this._source()
  }

  /**
   * Sink it function. This function takes a source and iterates over it.
   * @typedef {function(stream): void} SinkIt
   */

  /**
   * Sink a source.
   * @return {SinkIt}
   */
  async _sink () {
    if (this.timeline.close) {
      throw errCode(new Error('the stream is closed'), 'ERR_STREAM_CLOSED')
    }

    return async (source) => {
      try {
        await this._iterableDuplex.sink(abortable(source, this._options.signal))
      } catch (err) {
        // Re-throw non-aborted errors
        if (err.type !== 'aborted') throw err
        // Otherwise, this is fine...
        await this._iterableDuplex.close()
      }
    }
  }

  /**
   * Get the iterable duplex source, which can be consumed.
   * @return {Iterable}
   */
  _source () {
    if (this.timeline.close) {
      throw errCode(new Error('the stream is closed'), 'ERR_STREAM_CLOSED')
    }

    return abortable(this._iterableDuplex.source, this._options.signal)
  }

  /**
   * Set the protocol used on the stream
   * @param {string} protocol
   */
  setProtocol (protocol) {
    assert(typeof protocol === 'string', 'the protocol should be a string')

    this.protocol = protocol
  }

  /**
   * Close a stream
   * @return {Promise}
   */
  close () {
    if (this.timeline.close) {
      return
    }

    this.timeline.close = Date.now()

    return this._iterableDuplex.close()
  }
}

module.exports = withIs(Stream, { className: 'Stream', symbolName: '@libp2p/interface-connection/stream' })
