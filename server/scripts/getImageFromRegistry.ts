/* eslint-disable import/newline-after-import */
import config from 'config'
import https from 'https'
import axios from 'axios'
import * as fs from 'fs'
import { getAccessToken } from '../routes/v1/registryAuth'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database'
import logger from '../utils/logger'


const httpsAgent = new https.Agent({
  rejectUnauthorized: !config.get('registry.insecure'),
})

async function script() {
  await connectToMongoose()

  const registry = `https://localhost:5000/v2`
  const imageName = `internal/minimal-model-for-testing-3j2cew`
  const version = `v1.0`
  const blob = `sha256:a3ed95caeb02ffe68cdd9fd84406680ae93d633cb16422d00e8a7c22955b46d4`

  const token = await getAccessToken({ id: 'user', _id: 'user' }, [
    { type: 'repository', class: '', name: imageName, actions: ['pull'] },
  ])

  const authorisation = `Bearer ${token}`

  const { data } = await axios.get(`${registry}/${imageName}/blobs/${blob}`, {
    headers: {
      Authorization: authorisation,
    },
    responseType: 'blob',
    httpsAgent,
  })
  fs.writeFileSync('/tmp/testBlob', data)

  logger.info(data, '')

  setTimeout(disconnectFromMongoose, 50)
}

script()
