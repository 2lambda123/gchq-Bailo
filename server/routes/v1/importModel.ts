import config from 'config'
import { Request, Response } from 'express'
import multer from 'multer'
import { v4 as uuidv4, version } from 'uuid'
import https from 'https'
import defaultAxios from 'axios'
import * as fs from 'fs'
import { FileRef } from 'server/utils/build/build'
import { MinioRandomAccessReader, getFileStream, listZipFiles } from 'server/utils/zip'
import { log } from 'console'
import { ContentTypes, ImageRef } from 'server/utils/registry'
import { Layer, getUploadUrl, pushFile } from 'server/utils/build/PushDockerTar'
import { Stream } from 'stream'
import path from 'path'
import { getClient } from '../../utils/minio'
import MinioStore from '../../utils/MinioStore'
import { BadReq } from '../../utils/result'
import { ensureUserRole } from '../../utils/user'
import logger from '../../utils/logger'
import { getAccessToken } from './registryAuth'

export type MinioFile = Express.Multer.File & { bucket: string }
export interface MulterFiles {
  [fieldname: string]: Array<MinioFile>
}

const filename = uuidv4()

const upload = multer({
  storage: new MinioStore({
    connection: config.get('minio'),
    bucket: () => config.get('minio.uploadBucket'),
    path: () => `/model/imports/${filename}`,
  }),
  limits: { fileSize: 34359738368 },
}) // Do same thing for Import

export const importModel = [
  ensureUserRole('user'),
  upload.fields([{ name: 'model' }]),
  async (req: Request, res: Response) => {
    const files = req.files as unknown as Express.Multer.File

    // const registry = `${config.get('registry.protocol')}://${config.get('registry.host')}`
    // const imageName = `internal/${files.filename}`
    // const image: ImageRef = {
    //   namespace: 'internal',
    //   model: `${files.filename}`,
    //   version: 'v1.0',
    // }

    const minio = getClient()
    const bucket = config.get('minio.uploadBucket') as string

    minio.putObject(bucket, filename, files.buffer)

    const dir = './importModel'
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }
    } catch (err) {
      logger.error(err)
    }

    const fileRef: FileRef = {
      bucket: config.get('minio.uploadBucket'),
      path: `/model/imports/${filename}`,
      name: filename,
    }

    // List all contents stored in the zip archive
    minio.listObjectsV2(bucket, `/model/imports/${filename}`).on('build', (request) => {
      request.httpRequest.headers['X-Minio-Extract'] = 'true'
    })

    const file = fs.createWriteStream(`${dir}/manifest`)
    ;(await minio.getObject(bucket, `/model/imports/${filename}/manifest`))
      .on('build', (request) => {
        request.httpRequest.headers['X-Minio-Extract'] = 'true'
      })
      .on('httpData', (chunk) => {
        file.write(chunk)
      })
      .on('httpDone', () => {
        file.end()
      })

    return res.json({
      model: filename,
    })
  },
]
