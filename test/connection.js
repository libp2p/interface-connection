/* eslint-env mocha */

'use strict'

const chai = require('chai')
const expect = chai.expect
chai.use(require('dirty-chai'))

const { STATUS } = require('../src/types')

module.exports = (test) => {
  describe('connection', () => {
    describe('open connection', () => {
      let connection

      beforeEach(async () => {
        connection = await test.setup()
        if (!connection) throw new Error('missing connection')
      })

      afterEach(async () => {
        await connection.close()
        await test.teardown()
      })

      it('should have properties set', () => {
        expect(connection.id).to.exist()
        expect(connection.localPeer).to.exist()
        expect(connection.remotePeer).to.exist()
        expect(connection.status).to.equal(STATUS.OPEN)
        expect(connection.endpoints.local).to.exist()
        expect(connection.endpoints.remote).to.exist()
        expect(connection.timeline.open).to.exist()
        expect(connection.timeline.close).to.not.exist()
        expect(connection.direction).to.exist()
        expect(connection.multiplexer).to.exist()
        expect(connection.encryption).to.exist()
        expect(connection.streams).to.equal([])
        expect(connection.tags).to.equal([])
      })

      it('should return an empty array of streams', () => {
        const streams = connection.getStreams()

        expect(streams).to.equal([])
      })

      it('should be able to create a new stream', async () => {
        const stream = await connection.newStream()
        const connStreams = await connection.getStreams()

        expect(stream).to.exist()
        expect(connStreams).to.exist()
        expect(connStreams).to.have.lengthOf(1)
        expect(connStreams[0]).to.equal(stream)
      })
    })

    describe('close connection', () => {
      let connection

      beforeEach(async () => {
        connection = await test.setup()
        if (!connection) throw new Error('missing connection')
      })

      afterEach(async () => {
        await connection.close()
        await test.teardown()
      })

      it('should be able to close the connection after being created', async () => {
        expect(connection.timeline.close).to.not.exist()
        await connection.close()

        expect(connection.timeline.close).to.exist()
        expect(connection.status).to.equal(STATUS.CLOSED)
      })

      it('should be able to close the connection after opening a stream', async () => {
        // Open stream
        await connection.newStream()

        // Close connection
        expect(connection.timeline.close).to.not.exist()
        await connection.close()

        expect(connection.timeline.close).to.exist()
        expect(connection.status).to.equal(STATUS.CLOSED)
      })
    })
  })
}
