import config from 'config'
import multer from 'multer'
import { customAlphabet } from 'nanoid'
import { v4 as uuidv4 } from 'uuid'
import { ObjectId } from 'mongodb'
import Logger from 'bunyan'
import { moveFile } from './minio'
import { createFileRef } from './multer'
import { createModel, findModelByUuid } from '../services/model'
import { createVersionApprovals } from '../services/approval'
import { findSchemaByRef } from '../services/schema'
import { createVersion, markVersionBuilt } from '../services/version'
import MinioStore from './MinioStore'
import { getUploadQueue } from './queues'
import { BadReq, Conflict, GenericError, Forbidden } from './result'
import { validateSchema } from './validateSchema'
import VersionModel from '../models/Version'
import { ModelMetadata, ModelUploadType, SeldonVersion, UploadModes } from '../../types/interfaces'
import { getPropertyFromEnumValue } from './general'

export const upload = multer({
  storage: new MinioStore({
    connection: config.get('minio'),
    bucket: () => config.get('minio.uploadBucket'),
    path: () => uuidv4(),
  }),
  limits: { fileSize: 34359738368 },
})

export function parseMetadata(stringMetadata: string) {
  let metadata

  try {
    metadata = JSON.parse(stringMetadata)
  } catch (e) {
    throw BadReq({ code: 'metadata_invalid_json', metadata: stringMetadata }, 'Metadata is not valid JSON')
  }

  return metadata
}

export async function getMetadataSchema(metadata: any) {
  const schema = await findSchemaByRef(metadata.schemaRef)
  if (!schema) {
    throw BadReq({ code: 'schema_not_found', schemaRef: metadata.schemaRef }, 'Schema not found')
  }

  return schema
}

export function validateMetadata(metadata: any, schema: any) {
  const schemaIsInvalid = validateSchema(metadata, schema.schema)
  if (schemaIsInvalid) {
    throw BadReq({ code: 'metadata_did_not_validate', errors: schemaIsInvalid }, 'Metadata did not validate correctly')
  }
}

export function checkZipFile(name: string, file: Array<MinioFile>) {
  if (!file.length) {
    throw BadReq({ code: 'file_not_found', name }, `Expected '${name}' file to be uploaded.`)
  }

  if (!file[0].originalname.toLowerCase().endsWith('.zip')) {
    throw BadReq({ code: 'file_not_zip', name }, `Expected '${name}' to be a zip file.`)
  }
}

export function checkTarFile(name: string, file: Array<MinioFile>) {
  if (!file.length) {
    throw BadReq({ code: 'file_not_found', name }, `Expected '${name}' file to be uploaded.`)
  }

  if (!file[0].originalname.toLowerCase().endsWith('.tar')) {
    throw BadReq({ code: 'file_not_tar', name }, `Expected '${name}' to be a tar file.`)
  }
}

export function checkSeldonVersion(seldonVersion: string) {
  const seldonVersionsFromConfig: Array<SeldonVersion> = config.get('uiConfig.seldonVersions')
  if (seldonVersionsFromConfig.filter((version) => version.image === seldonVersion).length === 0) {
    throw BadReq({ seldonVersion }, `Seldon version ${seldonVersion} not recognised`)
  }
}

export async function handleMetadata(metadata: string): Promise<ModelMetadata> {
  const parsedMetadata = parseMetadata(metadata)
  parsedMetadata.timeStamp = new Date().toISOString()

  const schema = await getMetadataSchema(metadata)
  validateMetadata(parsedMetadata, schema)

  return parsedMetadata
}
