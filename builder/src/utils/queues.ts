import mongoose from 'mongoose'
import { PMongoQueue } from 'p-mongo-queue'

import { connectToMongoose } from './../common/utils/database.js'

let uploadQueue: PMongoQueue | undefined
let mongoClient: mongoose.Connection | undefined

export async function closeMongoInstance() {
  return mongoClient?.close()
}

export async function getMongoInstance() {
  if (mongoClient === undefined) {
    await connectToMongoose()
    mongoClient = mongoose.connection
  }

  return mongoClient
}

export async function getUploadQueue() {
  if (!uploadQueue) {
    const client = await getMongoInstance()
    const uploadDeadQueue = new PMongoQueue(client.db, 'queue-uploads-dead')
    uploadQueue = new PMongoQueue(client.db, 'queue-uploads', {
      deadQueue: uploadDeadQueue,
      maxRetries: 2,
      visibility: 60 * 9,
    })

    /*

      Removed these to keep this initial app small and simple. Future- backend handle these events (sending emails etc)?

    uploadQueue.on('succeeded', async (message: QueueMessage) => {
      await setUploadState(message, 'succeeded')
    })

    uploadQueue.on('retrying', async (message: QueueMessage, e: any) => {
      await setUploadState(message, 'retrying', e)
    })

    uploadQueue.on('failed', async (message: QueueMessage, e: any) => {
      await setUploadState(message, 'failed', e)
    })
  */
  }

  return uploadQueue
}