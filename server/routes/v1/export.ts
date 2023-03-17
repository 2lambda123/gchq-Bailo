import config from 'config'
import https from 'https'
import axios from 'axios'
import archiver from 'archiver'
import * as fs from 'fs'
import { Request, Response } from 'express'
import bodyParser from 'body-parser'
import { ensureUserRole } from '../../utils/user'
import { getAccessToken } from './registryAuth'
import { connectToMongoose, disconnectFromMongoose } from '../../utils/database'
import logger from '../../utils/logger'
import { UserDoc } from 'server/models/User'
import { Stream } from 'stream'
import { createRegistryClient, getBlobFile, getImageManifest } from 'server/utils/registry'

export const exportModel = [
    ensureUserRole('user'),
    bodyParser.json(),
    async (req: Request, res: Response) => {
        // Get model params
        const { uuid, version } = req.params
        
        // Set .zip extension to request header
        res.set('Content-disposition', `attachment; filename=${uuid}.zip`)
        res.set('Content-Type', 'application/zip')
        res.set('Cache-Control', 'private, max-age=604800, immutable')
        const archive = archiver('zip')

        
        archive.on('error', (err) => {
            logger.error(err, `Errored during archiving.`)
            throw err
        })
        archive.pipe(res);

        // Get Metadata
        // Get Model Schema information

        // Get Code bundle

        // Get Binaries bundle

        // Get Docker Files from registry
        await getDockerFiles(req.user.id, uuid, version, archive)
        // Bundle all information into .zip/.tar


        // Send bundled file 
        archive.finalize()
        
    }
]


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

