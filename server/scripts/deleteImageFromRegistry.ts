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
  const imageName = `internal/minimal-model-for-testing-knkvl5`
  const version = `v1.0`
  const blob = ``

  const token = await getAccessToken({ id: 'user', _id: 'user' }, [
    { type: 'repository', class: '', name: 'catalog', actions: ['delete'] },
  ])

  const authorisation = `Bearer ${token}`



  const { data } = await axios.delete(`${registry}/${imageName}/manifests/${version}`, {
    headers: {
      Authorization: authorisation,
    },
    httpsAgent,
  })

  logger.info(data, '')

  setTimeout(disconnectFromMongoose, 50)
}

script()
