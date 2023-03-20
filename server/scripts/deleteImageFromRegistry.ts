/* eslint-disable import/newline-after-import */
import config from 'config'
import https from 'https'
import axios from 'axios'
import { getAccessToken } from '../routes/v1/registryAuth'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database'
import logger from '../utils/logger'
import { getImageDigest, createRegistryClient, ImageRef } from '../utils/registry'

const httpsAgent = new https.Agent({
  rejectUnauthorized: !config.get('registry.insecure'),
})

async function script() {
  await connectToMongoose()

  const registry = await createRegistryClient()
  const imageName = 'internal/minimal-model-for-testing-xn6gve'
  const image: ImageRef = {
    namespace: 'internal',
    model: 'minimal-model-for-testing-xn6gve',
    version: 'v1.0',
  }

  const token = await getAccessToken({ id: 'user', _id: 'user' }, [
    { type: 'repository', class: '', name: `${image.namespace}/${image.model}`, actions: ['delete'] },
  ])

  const authorisation = `Bearer ${token}`

  const digest = await getImageDigest(registry, image)

  const { data } = await axios.delete(`${registry.address}/${imageName}/manifests/${digest}`, {
    headers: {
      Authorization: authorisation,
    },
    httpsAgent,
  })

  logger.info(data, '')

  setTimeout(disconnectFromMongoose, 50)
}

script()
