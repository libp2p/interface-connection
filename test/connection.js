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
        expect(connection.peerInfo).to.exist()
        expect(connection.status).to.equal(STATUS.OPEN)
        expect(connection.endpoints.local).to.not.exist()
        expect(connection.endpoints.remote).to.exist()
        expect(connection.timeline.open).to.exist()
        expect(connection.timeline.close).to.not.exist()
        expect(connection.role).to.exist()
        expect(connection.multiplexer).to.not.exist()
        expect(connection.encryption).to.not.exist()
        expect(connection.streams).to.equal([])
        expect(connection.tags).to.equal([])
      })

      it('should error on new stream', async () => {
        try {
          await connection.newStream()
        } catch (err) {
          expect(err).to.have.property('code', 'ERR_NO_MULTIPLEXER_AVAILABLE')
          return
        }

        throw new Error('expected error to be thrown')
      })

      it('should return an empty array of streams', () => {
        const streams = connection.getStreams()

        expect(streams).to.equal([])
      })
    })

    describe('upgraded connection', () => {
      let connection

      beforeEach(async () => {
        connection = await test.setup()
        if (!connection) throw new Error('missing connection')

        // TODO upgrade connection

        // TODO Run identify
      })

      afterEach(async () => {
        await connection.close()
        await test.teardown()
      })

      it('should have multiplexer and encryption set', () => {
        expect(connection.multiplexer).to.exist()
        expect(connection.encryption).to.exist()
      })

      it('should have endpoints available', () => {
        expect(connection.endpoints.local).to.exist()
        expect(connection.endpoints.remote).to.exist()
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

      it('should be able to close the connection after connection upgrade', async () => {
        // TODO Upgrade connection

        // TODO Run identify

        // Close connection
        expect(connection.timeline.close).to.not.exist()
        await connection.close()

        expect(connection.timeline.close).to.exist()
        expect(connection.status).to.equal(STATUS.CLOSED)
      })

      it('should be able to close the connection after opening a stream', async () => {
        // TODO Upgrade connection

        // TODO Run identify

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
