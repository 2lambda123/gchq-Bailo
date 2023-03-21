import archiver from 'archiver'
import { UserDoc } from 'server/models/User';
import { getModelVersion } from 'server/routes/v1/model';
import { findModelByUuid } from 'server/services/model';
import { findVersionById, findVersionByName } from 'server/services/version';

import { createRegistryClient, getBlobFile, getImageManifest } from 'server/utils/registry'
import logger from './logger'
import { NotFound } from './result';


export const getDockerFiles = async (user: string, uuid: string, version: string, archive: archiver.Archiver ) => {

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
        archive.append(JSON.stringify(blobFile), {name: `${blobSum}.blob`})
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

    archive.append(JSON.stringify(version,null, '\t'), {name: 'metadata'})
    return version;
}