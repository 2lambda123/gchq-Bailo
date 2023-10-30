import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { ReleaseInterface } from '../../../models/v2/Release.js'
import { createRelease } from '../../../services/v2/release.js'
import { registerPath, releaseInterfaceSchema } from '../../../services/v2/specification.js'
import { parse } from '../../../utils/validate.js'

export const postReleaseSchema = z.object({
  params: z.object({
    modelId: z.string({
      required_error: 'Must specify model id as URL parameter',
    }),
  }),
  body: z.object({
    modelCardVersion: z.coerce.number(),

    semver: z.string(),
    notes: z.string(),

    minor: z.coerce.boolean().optional().default(false),
    draft: z.coerce.boolean().optional().default(false),

    fileIds: z.array(z.string()),
    images: z.array(z.string()),
  }),
})

registerPath({
  method: 'post',
  path: '/api/v2/model/{modelId}/releases',
  tags: ['release'],
  description: 'Create a new release for a model.',
  schema: postReleaseSchema,
  responses: {
    200: {
      description: 'A release instance.',
      content: {
        'application/json': {
          schema: z.object({
            card: releaseInterfaceSchema,
          }),
        },
      },
    },
  },
})

interface PostReleaseResponse {
  release: ReleaseInterface
}

export const postRelease = [
  bodyParser.json(),
  async (req: Request, res: Response<PostReleaseResponse>) => {
    const {
      params: { modelId },
      body,
    } = parse(req, postReleaseSchema)

    const release = await createRelease(req.user, { modelId, ...body })

    return res.json({
      release,
    })
  },
]
