'use strict'

class Connection {
  /**
   * Creates an instance of a Connection.
   * @param {stream} stream
   * @param {PeerInfo} remotePeer
   * @param {Multiaddr} multiaddr
   * @memberof Connection
   */
  constructor (stream, remotePeer, multiaddr) {
    this.stream = stream
    this.remotePeer = remotePeer
    this.multiaddr = multiaddr
    this.timeline = {
      openTs: Date.now(),
      closeTs: undefined
    }
  }

  get source () {
    return this.stream.source
  }

  get sink () {
    return this.stream.sink
  }

  get multiaddr () {
    return this.multiaddr
  }

  get peerInfo () {
    return this.remotePeer
  }

  close () {
    this.timeline.closeTs = Date.now()

    return this.stream.close()
  }
}

exports = module.exports = Connection
