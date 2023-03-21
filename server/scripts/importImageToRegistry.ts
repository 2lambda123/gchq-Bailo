/* eslint-disable import/newline-after-import */
import config from 'config'
import https from 'https'
import defaultAxios from 'axios'
import * as fs from 'fs'
import { getAccessToken } from '../routes/v1/registryAuth'
import { ContentTypes, ImageRef } from '../utils/registry'
import { unzipFile } from '../utils/build/ExtractFiles'
import { connectToMongoose, disconnectFromMongoose } from '../utils/database'
import logger from '../utils/logger'
import { getUploadUrl, Layer, pushFile } from '../utils/build/PushDockerTar'

async function script(this: any) {
  await connectToMongoose()

  const registry = `${config.get('registry.protocol')}://${config.get('registry.host')}`
  const imageName = `internal/minimal-model-for-testing-xn6gve`
  const image: ImageRef = {
    namespace: 'internal',
    model: 'minimal-model-for-testing-xn6gve',
    version: 'v1.0',
  }

  await unzipFile('/home/ec2-user/Downloads/minimal-model-for-testing-xn6gve.zip') // Solvable by streaming

  const manifestString = fs.readFileSync('/home/ec2-user/Downloads/manifest', 'utf-8')
  const manifest = JSON.parse(manifestString)

  const tag = 'v1.0'

  const rawBlobs: any[] = []
  const CHUNK_SIZE = 8 * 1024 * 1024

  for (const { blobSum } of manifest.fsLayers) {
    rawBlobs.push(`${blobSum.slice(7)}.blob`)
  }

  const blobs: any[] = rawBlobs.filter((elem, index, self) => index === self.indexOf(elem))

  // logger.info(blobs)

  const token = await getAccessToken({ id: 'admin', _id: 'admin' }, [
    { type: 'repository', name: `${image.namespace}/${image.model}`, actions: ['pull', 'push'] },
  ])

  const authorisation = `Bearer ${token}`

  const axios = defaultAxios.create({
    maxBodyLength: CHUNK_SIZE,
    maxContentLength: CHUNK_SIZE,
    httpsAgent: new https.Agent({
      rejectUnauthorized: false,
      requestCert: true,
    }),
  })
  axios.defaults.headers.common.Authorization = authorisation

  const layers: Array<Layer> = []
  for (const layer of blobs) {
    const uploadUrl = await getUploadUrl(axios, registry, imageName)
    const { digest, size } = await pushFile(axios, registry, uploadUrl, `/home/ec2-user/Downloads/${layer}`)
    layers.push({
      digest,
      size,
      mediaType: ContentTypes.APPLICATION_LAYER,
    })
  }

  const uploadUrl = await getUploadUrl(axios, registry, imageName)
  const { digest, size } = await pushFile(axios, registry, uploadUrl, '/home/ec2-user/Downloads/manifest')
  const manifestConfig: Layer = { digest, size, mediaType: ContentTypes.APPLICATION_CONFIG }

  const headers = {
    'Content-Type': ContentTypes.APPLICATION_MANIFEST,
  }
  const url = `${registry}/v2/${imageName}/manifests/${tag}`
  const registryManifest = {
    config: manifestConfig,
    layers,
    schemaVersion: 2,
    mediaType: ContentTypes.APPLICATION_MANIFEST,
  }

  await axios.put(url, registryManifest, { headers })
  logger.info({ imageName, tag }, `Finished pushing to ${imageName}:${tag}`)

  setTimeout(disconnectFromMongoose, 50)
}

script()
