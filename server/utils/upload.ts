import config from 'config'
import { Request, Response } from 'express'
import multer from 'multer'
import { customAlphabet } from 'nanoid'
import { v4 as uuidv4 } from 'uuid'
import { ObjectId } from 'mongodb'
import { moveFile } from './minio'
import { createFileRef } from './multer'
import { createModel, findModelByUuid } from '../services/model'
import { createVersionApprovals } from '../services/approval'
import { findSchemaByRef } from '../services/schema'
import { createVersion, markVersionBuilt } from '../services/version'
import MinioStore from './MinioStore'
import { getUploadQueue } from './queues'
import { BadReq, Conflict, GenericError } from './result'
import { ensureUserRole } from './user'
import { validateSchema } from './validateSchema'
import VersionModel from '../models/Version'
import { ModelUploadType, SeldonVersion, UploadModes } from '../../types/interfaces'
import { getPropertyFromEnumValue } from './general'

// suggested framework of code
interface Files {
  docker: File
  code: File
  binary: File
}
// function uploadModel(user: User, mode: Mode, metadata: any, files: Files, modelUuid: string?) {
// return { modelUuid: model }
// }

// Are we using Minio?
export type MinioFile = Express.Multer.File & { bucket: string }
export interface MulterFiles {
  [fieldname: string]: Array<MinioFile>
}

const upload = multer({
  storage: new MinioStore({
    connection: config.get('minio'),
    bucket: () => config.get('minio.uploadBucket'),
    path: () => uuidv4(),
  }),
  limits: { fileSize: 34359738368 },
})

const nanoid = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 6)

function parseMetadata(stringMetadata: string) {
  let metadata

  try {
    metadata = JSON.parse(stringMetadata)
  } catch (e) {
    throw BadReq({ code: 'metadata_invalid_json', metadata: stringMetadata }, 'Metadata is not valid JSON')
  }

  return metadata
}

async function getMetadataSchema(metadata: any) {
  const schema = await findSchemaByRef(metadata.schemaRef)
  if (!schema) {
    throw BadReq({ code: 'schema_not_found', schemaRef: metadata.schemaRef }, 'Schema not found')
  }

  return schema
}

function validateMetadata(metadata: any, schema: any) {
  const schemaIsInvalid = validateSchema(metadata, schema.schema)
  if (schemaIsInvalid) {
    throw BadReq({ code: 'metadata_did_not_validate', errors: schemaIsInvalid }, 'Metadata did not validate correctly')
  }
}

function checkZipFile(name: string, file: Array<MinioFile>) {
  if (!file.length) {
    throw BadReq({ code: 'file_not_found', name }, `Expected '${name}' file to be uploaded.`)
  }

  if (!file[0].originalname.toLowerCase().endsWith('.zip')) {
    throw BadReq({ code: 'file_not_zip', name }, `Expected '${name}' to be a zip file.`)
  }
}

function checkTarFile(name: string, file: Array<MinioFile>) {
  if (!file.length) {
    throw BadReq({ code: 'file_not_found', name }, `Expected '${name}' file to be uploaded.`)
  }

  if (!file[0].originalname.toLowerCase().endsWith('.tar')) {
    throw BadReq({ code: 'file_not_tar', name }, `Expected '${name}' to be a tar file.`)
  }
}

function checkSeldonVersion(seldonVersion: string) {
  const seldonVersionsFromConfig: Array<SeldonVersion> = config.get('uiConfig.seldonVersions')
  if (seldonVersionsFromConfig.filter((version) => version.image === seldonVersion).length === 0) {
    throw BadReq({ seldonVersion }, `Seldon version ${seldonVersion} not recognised`)
  }
}

// need to write function to return metadata from either http or import

// need to write function that returns mode from either http or import

// need to write function that returns modelUuid from either http or import

// need to write function that returns user from either http or import

export const postUpload = [
  ensureUserRole('user'),
  upload.fields([{ name: 'binary' }, { name: 'code' }, { name: 'docker' }]),
  async (Files: Files, metadata, mode, modelUuid, user) => {
    const parsedMetadata = parseMetadata(metadata)
    parsedMetadata.timeStamp = new Date().toISOString()

    const schema = await getMetadataSchema(parsedMetadata)

    validateMetadata(parsedMetadata, schema)

    // are we still using Multer?
    const files = Files as unknown as MulterFiles
    const uploadType = parsedMetadata.buildOptions.uploadType as ModelUploadType

    switch (uploadType) {
      case ModelUploadType.Zip:
        checkZipFile('binary', files.binary)
        checkZipFile('code', files.code)
        checkSeldonVersion(parsedMetadata.buildOptions.seldonVersion)
        break
      case ModelUploadType.Docker:
        checkTarFile('docker', files.docker)
        break
      case ModelUploadType.ModelCard:
        // No files to check here!
        break
      default:
        throw BadReq({ uploadType }, 'Unknown upload type')
    }

    let activeMode: UploadModes

    const prop = typeof mode === 'string' ? getPropertyFromEnumValue(UploadModes, mode) : undefined

    if (!mode) {
      activeMode = UploadModes.NewModel
    } else if (prop) {
      activeMode = prop as UploadModes
    } else {
      throw BadReq(
        { code: 'upload_mode_invalid' },
        `Upload mode ${mode} is not valid.  Must be one of ${Object.keys(UploadModes).join(', ')}.`
      )
    }

    const activeModelUuid = modelUuid as string
    const name = parsedMetadata.highLevelDetails.name
      .toLowerCase()
      .replace(/[^a-z 0-9]/g, '')
      .replace(/ /g, '-')

    /** Saving the model */
    let model: any

    if (activeMode === UploadModes.NewVersion) {
      // Update an existing model's version array
      model = await findModelByUuid(user, activeModelUuid, { populate: true })
    } else {
      // Save a new model, and add the uploaded version to its array
      model = await createModel(user, {
        schemaRef: parsedMetadata.schemaRef,
        uuid: `${name}-${nanoid()}`,

        versions: [],
        // Temporarily set a new ObjectId to satisfy the type, then override below
        latestVersion: new ObjectId(),
      })
    }

    let version
    try {
      version = await createVersion(user, {
        version: parsedMetadata.highLevelDetails.modelCardVersion,
        // is this the same as the previous parsedMetadata?
        metadata,
        files: {},
      })
    } catch (err: any) {
      if (err.code === 11000) {
        throw Conflict(
          {
            version: parsedMetadata.highLevelDetails.modelCardVersion,
            model: activeModelUuid,
          },
          'This model already has a version with the same name'
        )
      }

      throw err
    }

    // how to handle logs when not http?
    req.log.info({ code: 'created_model_version', version }, 'Created model version')

    model.versions.push(version._id)
    model.latestVersion = version._id

    await model.save()

    version.model = model._id
    await version.save()
    // how to handle logs when not http?
    req.log.info({ code: 'created_model', model }, 'Created model document')

    const [managerApproval, reviewerApproval] = await createVersionApprovals({
      version: await version.populate('model').execPopulate(),
      user,
    })
    // how to handle logs when not http?
    req.log.info(
      { code: 'created_review_approvals', managerId: managerApproval._id, reviewApproval: reviewerApproval._id },
      'Successfully created approvals for review'
    )

    switch (uploadType) {
      case ModelUploadType.ModelCard:
        await markVersionBuilt(version._id)
        break
      case ModelUploadType.Zip:
        try {
          const bucket = config.get('minio.uploadBucket') as string

          const binaryFrom = `${files.binary[0].bucket}/${files.binary[0].path}`
          const rawBinaryPath = `model/${model._id}/version/${version._id}/raw/binary/${files.binary[0].path}`
          await moveFile(bucket, binaryFrom, rawBinaryPath)

          const codeFrom = `${files.code[0].bucket}/${files.code[0].path}`
          const rawCodePath = `model/${model._id}/version/${version._id}/raw/code/${files.code[0].path}`
          await moveFile(bucket, codeFrom, rawCodePath)

          await VersionModel.findOneAndUpdate({ _id: version._id }, { files: { rawCodePath, rawBinaryPath } })
          // how to handle logs when not http?
          req.log.info(
            { code: 'adding_file_paths', rawCodePath, rawBinaryPath },
            `Adding paths for raw model exports of files to version.`
          )
        } catch (e: any) {
          throw GenericError({ e }, 'Error uploading raw code and binary to Minio', 500)
        }

        break
      case ModelUploadType.Docker: {
        const bucket = config.get('minio.uploadBucket') as string

        const binaryFrom = `${files.docker[0].bucket}/${files.docker[0].path}`
        const rawDockerPath = `model/${model._id}/version/${version._id}/raw/docker/${files.docker[0].path}`

        // how to handle logs when not http?
        req.log.info({ bucket, binaryFrom, rawDockerPath })
        await moveFile(bucket, binaryFrom, rawDockerPath)

        await VersionModel.findOneAndUpdate({ _id: version._id }, { files: { rawDockerPath } })

        break
      }
      default:
        throw BadReq({}, 'Unexpected model upload type')
    }

    await version.save()

    if (uploadType === ModelUploadType.Zip) {
      const jobId = await (
        await getUploadQueue()
      ).add({
        versionId: version._id,
        userId: user._id,
        binary: createFileRef(files.binary[0], 'binary', version),
        code: createFileRef(files.code[0], 'code', version),
        uploadType,
      })
      // how to handle logs when not http?
      req.log.info({ code: 'created_upload_job', jobId }, 'Successfully created zip job in upload queue')
    }

    if (uploadType === ModelUploadType.Docker) {
      const jobId = await (
        await getUploadQueue()
      ).add({
        versionId: version._id,
        userId: user._id,
        docker: createFileRef(files.docker[0], 'docker', version),
        uploadType,
      })
      // how to handle logs when not http?
      req.log.info({ code: 'created_upload_job', jobId }, 'Successfully created docker job in upload queue')
    }

    return {
      uuid: model.uuid,
    }
  },
]
