import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/v2/audit/Base.js'
import audit from '../../../connectors/v2/audit/index.js'
import { ReleaseInterface } from '../../../models/v2/Release.js'
import { getModelReleases } from '../../../services/v2/release.js'
import { registerPath, releaseInterfaceSchema } from '../../../services/v2/specification.js'
import { parse } from '../../../utils/v2/validate.js'

export const getReleasesSchema = z.object({
  params: z.object({
    modelId: z.string({
      required_error: 'Must specify model id as URL parameter',
    }),
  }),
})

registerPath({
  method: 'get',
  path: '/api/v2/model/{modelId}/releases',
  tags: ['release'],
  description: 'Get all releases for a model.',
  schema: getReleasesSchema,
  responses: {
    200: {
      description: 'An array of release instances.',
      content: {
        'application/json': {
          schema: z.object({
            releases: z.array(releaseInterfaceSchema),
          }),
        },
      },
    },
  },
})

interface getReleasesResponse {
  releases: Array<ReleaseInterface>
}

export const getReleases = [
  bodyParser.json(),
  async (req: Request, res: Response<getReleasesResponse>) => {
    req.audit = AuditInfo.SearchReleases
    const {
      params: { modelId },
    } = parse(req, getReleasesSchema)

    const releases = await getModelReleases(req.user, modelId)
    await audit.onSearchReleases(req, releases)

    return res.json({
      releases,
    })
  },
]
