/* eslint-env mocha */

'use strict'

const pipe = require('it-pipe')
const pair = require('it-pair')
const { collect } = require('streaming-iterables')

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

      await stream.close()
    })

    it('should be able to use the stream', async () => {
      const protocol = '/echo/0.0.1'
      const stream = await connection.newStream(protocol)

      const p = pair()
      const data = [1, 2, 3]

      await pipe(
        data,
        p,
        stream
      )

      const res = await pipe(
        stream.source,
        collect
      )

      expect(res).to.eql(data)

      await stream.close()
    })

    it('should be able to close a stream', async () => {
      const protocol = '/echo/0.0.1'
      const stream = await connection.newStream(protocol)

      await stream.close()

      expect(stream.stat.timeline.open).to.exist()
      expect(stream.stat.timeline.close).to.exist()
    })
  })
}
