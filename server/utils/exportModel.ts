import archiver from 'archiver'
import config from 'config';
import * as Minio from 'minio';
import { UserDoc } from 'server/models/User';
import { getModelVersion } from 'server/routes/v1/model';
import { findDeploymentByUuid } from 'server/services/deployment';
import { findModelByUuid } from 'server/services/model';
import { findSchemaByRef } from 'server/services/schema';
import { findVersionById, findVersionByName } from 'server/services/version';

import { createRegistryClient, getBlobFile, getImageManifest } from 'server/utils/registry'
import logger from './logger'
import { NotFound } from './result';


export const getDockerFiles = async (uuid: string, version: string, archive: archiver.Archiver ) => {

    const registry = await createRegistryClient();
    const image = {
        namespace: 'internal',
        model: uuid,
        version
    }

    const manifest = await getImageManifest(registry, image)
    archive.append(JSON.stringify(manifest), {name: 'manifest'})

    const layers = manifest? manifest.fsLayers: [];
    
    for ( const {blobSum} of layers ) {
        logger.info(blobSum, 'Getting blob file')
        const blobFile = await getBlobFile(blobSum, registry, image);
        logger.info(uuid, 'Blob downloaded successfully')
        archive.append(JSON.stringify(blobFile), {name: `${blobSum}`})
    }
}

export const getModelMetadata = async (user:UserDoc, uuid: string, versionName: string, archive: archiver.Archiver) => {
    const model = await findModelByUuid(user, uuid)

    if (!model) {
      throw NotFound({ code: 'model_not_found', uuid }, `Unable to find model '${uuid}'`)
    }

    let version
    if (versionName === 'latest') {
      version = await findVersionById(user, model.versions[model.versions.length - 1])
    } else {
      version = await findVersionByName(user, model._id, versionName)
    }

    if (!version) {
      throw NotFound({ code: 'version_not_found', versionName }, `Unable to find version '${versionName}'`)
    }

    archive.append(JSON.stringify(version,null, '\t'), {name: 'metadata.json'})
    return version;
}

export const getModelSchema = async (schemaRef: string, archive: archiver.Archiver) => {
    const schema = await findSchemaByRef(schemaRef);
    if (!schema) {
      throw NotFound(
        { code: 'schema_not_found', schemaRef },
        `Unable to find schema '${schemaRef}'`
      )
    }
  archive.append(JSON.stringify(schema, null, '\t'), {name: 'model_schema.json'})
}

export const getCodeFiles = async (uuid: string, version: string, user: UserDoc, archive: archiver.Archiver) => {
  const deployment = await findDeploymentByUuid(user, uuid)

  if (deployment === null) {
    throw NotFound({ deploymentUuid: uuid }, `Unable to find deployment for uuid ${uuid}`)
  }

  const versionDocument = await findVersionByName(user, deployment.model, version)

  if (!versionDocument) {
    throw NotFound({ deployment, version }, `Version ${version} not found for deployment ${deployment.uuid}.`)
  }

  const filePath = versionDocument.files.rawCodePath

  const bucketName: string = config.get('minio.uploadBucket')
  const client = new Minio.Client(config.get('minio'))

  if (filePath) {
    const { size } = await client.statObject(bucketName, filePath)

    const codeFile = await client.getObject(bucketName, filePath)
    if (!codeFile) {
      throw NotFound({ code: 'object_fetch_failed', bucketName, filePath }, 'Failed to fetch object from storage')
    }
    logger.info(`Code file fetched from storage - size: ${size}`)
    archive.append(codeFile, { name: 'code.zip' })
  } else {
    throw NotFound({ filePath }, 'Unknown file type specified')
  }
}

export const getBinaryFiles = async (uuid: string, version: string, user: UserDoc, archive: archiver.Archiver) => {
  const deployment = await findDeploymentByUuid(user, uuid)

  if (deployment === null) {
    throw NotFound({ deploymentUuid: uuid }, `Unable to find deployment for uuid ${uuid}`)
  }

  const versionDocument = await findVersionByName(user, deployment.model, version)

  if (!versionDocument) {
    throw NotFound({ deployment, version }, `Version ${version} not found for deployment ${deployment.uuid}.`)
  }

  const filePath = versionDocument.files.rawBinaryPath

  const bucketName: string = config.get('minio.uploadBucket')
  const client = new Minio.Client(config.get('minio'))

  if (filePath) {
    const { size } = await client.statObject(bucketName, filePath)

    const binaryFile = await client.getObject(bucketName, filePath)
    if (!binaryFile) {
      throw NotFound({ code: 'object_fetch_failed', bucketName, filePath }, 'Failed to fetch object from storage')
    }
    logger.info(`binary file fetched from storage - size: ${size}`)
    archive.append(binaryFile, { name: 'binary.bin' })
  } else {
    throw NotFound({ filePath }, 'Unknown file type specified')
  }
}