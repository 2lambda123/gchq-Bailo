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

const httpsAgent = new https.Agent({
    rejectUnauthorized: !config.get('registry.insecure'),
  })

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
    await connectToMongoose()

    const registry = `https://registry:5000/v2`
    const imageName = `internal/${uuid}`

    const token = await getAccessToken({ id: `${user}`, _id: `${user}`}, [
        { type: 'repository', class: '', name: imageName , actions: ['pull'] },
    ])
    const authorisation = `Bearer ${token}`

    const { data } = await axios.get(`${registry}/${imageName}/manifests/${version}`, {
        headers: {
          Authorization: authorisation,
        },
        httpsAgent,
    });
    archive.append(JSON.stringify(data), {name: 'manifest'})
    
    

    for ( const {blobSum} of data.fsLayers) {
        logger.info(blobSum, 'Getting blob file')
        const blobFile = await getBlobFiles(blobSum, authorisation, registry, imageName);
        logger.info(blobSum, 'Blob downloaded successfully')
        archive.append(JSON.stringify(blobFile), {name: `${blobSum}.blob`})
    }


    return data;



}

const getBlobFiles = async (blobSha: string, authToken: string, registry: string, imageName:string ) => {
    const {data} = await axios.get(`${registry}/${imageName}/blobs/${blobSha}`,{
        headers: {
            Authorization: authToken,
        },
        httpsAgent,
        responseType: 'blob',
    });
    return data;
}