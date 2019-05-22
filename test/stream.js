/* eslint-env mocha */

'use strict'

const chai = require('chai')
const expect = chai.expect
chai.use(require('dirty-chai'))

const { ROLE } = require('../src/types')

module.exports = (test) => {
  describe('stream', () => {
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

    it('should open a stream as expected', async () => {
      const stream = await connection.newStream()

      expect(stream.id).to.exist()
      expect(stream.connection).to.exist()
      expect(stream.role).to.equal(ROLE.INITIATOR)
      expect(stream.timeline.open).to.exist()
      expect(stream.timeline.close).to.not.exist()
      expect(stream.tags).to.exist()
    })

    it('should open a stream with a specified protocol', async () => {
      const protocol = '/echo/0.0.1'
      const stream = await connection.newStream(protocol)

      expect(stream.protocol).to.equal(protocol)
    })

    it.skip('should be able to sink it from a stream', async () => {
      // const stream = await connection.newStream()
      // sink

      // source
    })

    it('should be able to close a stream', async () => {
      const stream = await connection.newStream()

      await stream.close()

      expect(stream.timeline.open).to.exist()
      expect(stream.timeline.close).to.exist()
    })

    it.skip('should be able to close a stream while sinking', async () => {
      // const stream = await connection.newStream()

      // TODO
    })
  })
}
