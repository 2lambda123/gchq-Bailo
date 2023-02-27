import { Request, Response } from 'express'
import bodyParser from 'body-parser'
import { ensureUserRole } from '../../utils/user'


export const exportModel = [
    ensureUserRole('user'),
    bodyParser.json(),
    async (req: Request, res: Response) => {
        // Get model params
        const { uuid, version } = req.params
        
        // Set .zip extension to request header
        // res.set('Content-disposition', `attachment; filename=model_export.zip`)
        // res.set('Content-Type', 'application/zip')
        // res.set('Cache-Control', 'private, max-age=604800, immutable')

        // Get Metadata

        // Get Model Schema information

        // Get Code bundle

        // Get Binaries bundle

        // Get Docker Files from registry


        // Bundle all information into .zip/.tar


        // Send bundled file 
        res.send(200)
    }
]