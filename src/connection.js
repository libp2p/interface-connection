'use strict'

const errCode = require('err-code')

module.exports = class Connection {
  constructor (connection, wrappedConnection) {
    this.peerInfo = null
    this.connection = connection
    this.wrappedConnection = wrappedConnection
  }

  get source () {
    return this.connection.source
  }

  get sink () {
    return this.connection.sink
  }

  async getPeerInfo () {
    if (this.wrappedConnection && this.wrappedConnection.getPeerInfo) {
      return await this.wrappedConnection.getPeerInfo()
    }

    if (!this.peerInfo) {
      throw errCode('Peer Info not set yet', 'ERR_NO_PEER_INFO')
    }

    return this.peerInfo
  }

  setPeerInfo (peerInfo) {
    if (this.wrappedConnection && this.wrappedConnection.setPeerInfo) {
      return this.wrappedConnection.setPeerInfo(peerInfo)
    }

    this.peerInfo = peerInfo
  }

  async getObservedAddrs () {
    if (this.wrappedConnection && this.wrappedConnection.getObservedAddrs) {
      return await this.wrappedConnection.getObservedAddrs()
    }

    return []
  }

  async close () {
    await this.connection.close()

    if (this.wrappedConnection && this.wrappedConnection.close) {
      await this.wrappedConnection.close()
    }
  }

  getObservedAddrs (callback) {
    if (this.info && this.info.getObservedAddrs) {
      return this.info.getObservedAddrs(callback)
    }
    callback(null, [])
  }
}
