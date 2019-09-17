/* eslint-env mocha */

'use strict'

const chai = require('chai')
const expect = chai.expect
chai.use(require('dirty-chai'))

module.exports = (test) => {
  describe('stream', () => {
    let connection

    beforeEach(async () => {
      connection = await test.setup()
      if (!connection) throw new Error('missing connection')
    })

    afterEach(async () => {
      await connection.close()
      await test.teardown()
    })

    it('should open a stream with the proper data', async () => {
      const protocol = '/echo/0.0.1'
      const stream = await connection.newStream(protocol)

      expect(stream.id).to.exist()
      expect(stream.conn).to.exist()
      expect(stream.stat.timeline.open).to.exist()
      expect(stream.stat.timeline.close).to.not.exist()
      expect(stream.tags).to.exist()

      expect(stream.protocol).to.equal(protocol)
    })

    it.skip('should be able to sink it from a stream', async () => {
      // const stream = await connection.newStream()
      // sink

      // source
    })

    it('should be able to close a stream', async () => {
      const protocol = '/echo/0.0.1'
      const stream = await connection.newStream(protocol)

      await stream.close()

      expect(stream.stat.timeline.open).to.exist()
      expect(stream.stat.timeline.close).to.exist()
    })

    it.skip('should be able to close a stream while sinking', async () => {
      // const stream = await connection.newStream()

      // TODO
    })
  })
}
