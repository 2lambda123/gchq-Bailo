/* eslint-disable @typescript-eslint/no-empty-function */
import mongoose from 'mongoose'

describe('test export routes', () => {
  beforeEach(async () => {})

  afterAll((done) => {
    mongoose.connection.close()
    done()
  })
})
