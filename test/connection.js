/* eslint-env mocha */

'use strict'

const goodbye = require('it-goodbye')
const { collect } = require('streaming-iterables')

const chai = require('chai')
const expect = chai.expect
chai.use(require('dirty-chai'))

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
        expect(connection.localAddr).to.exist()
        expect(connection.remoteAddr).to.exist()
        expect(connection.stat.status).to.equal('open')
        expect(connection.stat.timeline.open).to.exist()
        expect(connection.stat.timeline.upgraded).to.exist()
        expect(connection.stat.timeline.close).to.not.exist()
        expect(connection.stat.direction).to.exist()
        // Not mandatory data:
        // expect(connection.stat.multiplexer).to.exist()
        // expect(connection.stat.encryption).to.exist()
        expect(connection.getStreams()).to.eql([])
        expect(connection.tags).to.eql([])
      })

      it('should get the metadata of an open connection', () => {
        const stat = connection.stat

        expect(stat.status).to.equal('open')
        expect(stat.direction).to.exist()
        expect(stat.timeline.open).to.exist()
        expect(stat.timeline.upgraded).to.exist()
        expect(stat.timeline.close).to.not.exist()
      })

      it('should return an empty array of streams', () => {
        const streams = connection.getStreams()

        expect(streams).to.eql([])
      })

      it('should be able to create a new stream', async () => {
        const protocol = '/echo/0.0.1'
        const stream = await connection.newStream(protocol)
        const connStreams = await connection.getStreams()

        expect(stream).to.exist()
        expect(connStreams).to.exist()
        expect(connStreams).to.have.lengthOf(1)
        expect(connStreams[0]).to.equal(stream)
      })

      it('should be able to add an inbound stream', () => {
        const s = goodbye({ source: ['hey'], sink: collect })
        s.close = () => s.sink([])

        connection.onNewStream({ stream: s, protocol: '/echo/0.0.1' })

        const connStreams = connection.getStreams()
        expect(connStreams).to.exist()
        expect(connStreams).to.have.lengthOf(1)
        expect(connStreams[0].protocol).to.equal('/echo/0.0.1')
      })
    })

    describe('close connection', () => {
      let connection

      beforeEach(async () => {
        connection = await test.setup()
        if (!connection) throw new Error('missing connection')
      })

      afterEach(async () => {
        await test.teardown()
      })

      it('should be able to close the connection after being created', async () => {
        expect(connection.stat.timeline.close).to.not.exist()
        await connection.close()

        expect(connection.stat.timeline.close).to.exist()
        expect(connection.stat.status).to.equal('closed')
      })

      it('should be able to close the connection after opening a stream', async () => {
        // Open stream
        const protocol = '/echo/0.0.1'
        await connection.newStream(protocol)

        // Close connection
        expect(connection.stat.timeline.close).to.not.exist()
        await connection.close()

        expect(connection.stat.timeline.close).to.exist()
        expect(connection.stat.status).to.equal('closed')
      })

      it('should fail to create a new stream if the connection is closing', async () => {
        expect(connection.stat.timeline.close).to.not.exist()
        connection.close()

        try {
          const protocol = '/echo/0.0.1'
          await connection.newStream(protocol)
        } catch (err) {
          expect(err).to.exist()
          return
        }

        throw new Error('should fail to create a new stream if the connection is closing')
      })

      it('should fail to create a new stream if the connection is closed', async () => {
        expect(connection.stat.timeline.close).to.not.exist()
        await connection.close()

        try {
          const protocol = '/echo/0.0.1'
          await connection.newStream(protocol)
        } catch (err) {
          expect(err).to.exist()
          expect(err.code).to.equal('ERR_CONNECTION_CLOSED')
          return
        }

        throw new Error('should fail to create a new stream if the connection is closing')
      })
    })
  })
}
