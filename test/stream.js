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

    it('should remove streams from connection if streams are closed', async () => {
      // Zero streams when connection established
      let openenedStreams = connection.getStreams()
      expect(openenedStreams).to.have.lengthOf(0)

      // Open 3 streams
      const [stream1, stream2, stream3] = await Promise.all([
        connection.newStream('/echo/0.0.1'),
        connection.newStream('/echo/0.0.2'),
        connection.newStream('/echo/0.0.3')
      ])

      openenedStreams = connection.getStreams()
      expect(openenedStreams).to.have.lengthOf(3)

      // Close 1 stream
      await stream1.close()

      openenedStreams = connection.getStreams()
      expect(openenedStreams).to.have.lengthOf(2)

      // Close remaining 2 streams
      await Promise.all([
        stream2.close(),
        stream3.close()
      ])

      openenedStreams = connection.getStreams()
      expect(openenedStreams).to.have.lengthOf(0)
    })
  })
}
