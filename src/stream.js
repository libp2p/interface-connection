'use strict'

const withIs = require('class-is')

const assert = require('assert')
const errCode = require('err-code')

/**
 * An implementation of the js-libp2p stream.
 */
class Stream {
  /**
   * Creates an instance of Stream.
   * @param {object} properties properties of the stream.
   * @param {*} properties.iterableDuplex streaming iterables duplex object.
   * @param {Connection} properties.conn connection associated with the stream.
   * @param {string} properties.direction direction of the stream startup ("inbound" or "outbound").
   * @param {string} properties.protocol the protocol the stream is using.
   */
  constructor ({ iterableDuplex, conn, direction, protocol }) {
    assert(direction === 'inbound' || direction === 'outbound', 'direction must be "inbound" or "outbound"')

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
    this.conn = conn

    /**
     * stream metadata.
     */
    this._stat = {
      direction, // direction of the stream, "inbound" or "outbound"
      timeline: {
        open: Date.now(),
        close: undefined
      }
    }

    /**
     * User provided tags
     */
    this.tags = []

    /**
     * Stream protocol
     */
    this.protocol = protocol

    this.sink = this._sink()
    this.source = this._source()
  }

  /**
   * Get stream metadata
   * @return {Object}
   */
  get stat () {
    return this._stat
  }

  /**
   * Sink it function. This function takes a source and iterates over it.
   * @typedef {function(stream): void} SinkIt
   */

  /**
   * Sink a source.
   * @return {SinkIt}
   */
  _sink () {
    if (this._stat.timeline.close) {
      throw errCode(new Error('the stream is closed'), 'ERR_STREAM_CLOSED')
    }

    return async (source) => {
      try {
        await this._iterableDuplex.sink(source)
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
    if (this._stat.timeline.close) {
      throw errCode(new Error('the stream is closed'), 'ERR_STREAM_CLOSED')
    }

    return this._iterableDuplex.source
  }

  /**
   * Close a stream
   * @return {void}
   */
  close () {
    if (this._stat.timeline.close) {
      return
    }
    this._stat.timeline.close = Date.now()
  }
}

module.exports = withIs(Stream, { className: 'Stream', symbolName: '@libp2p/interface-connection/stream' })
