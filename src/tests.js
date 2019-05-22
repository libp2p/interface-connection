/* eslint-env mocha */

'use strict'

const connectionSuite = require('../test/connection')
const streamSuite = require('../test/stream')

module.exports = (test) => {
  connectionSuite(test)
  streamSuite(test)
}
