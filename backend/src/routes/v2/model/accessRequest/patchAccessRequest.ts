import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../../connectors/v2/audit/Base.js'
import audit from '../../../../connectors/v2/audit/index.js'
import { AccessRequestInterface } from '../../../../models/v2/AccessRequest.js'
import { updateAccessRequest } from '../../../../services/v2/accessRequest.js'
import { accessRequestInterfaceSchema, registerPath } from '../../../../services/v2/specification.js'
import { parse } from '../../../../utils/v2/validate.js'
import { accessRequestMetadata } from './postAccessRequest.js'

export const patchAccessRequestSchema = z.object({
  body: z
    .object({
      metadata: accessRequestMetadata,
      comments: z.array(
        z.object({
          comment: z.string(),
          user: z.string(),
          createdAt: z.string(),
        }),
      ),
    })
    .partial()
    .refine((data) => data.metadata || data.comments, 'You must provide either new metadata or a review comment.'),
  params: z.object({
    accessRequestId: z.string(),
  }),
})

registerPath({
  method: 'patch',
  path: '/api/v2/model/{modelId}/access-request/{accessRequestId}',
  tags: ['access-request'],
  description: 'Update an access request instance.',
  schema: patchAccessRequestSchema,
  responses: {
    200: {
      description: 'The updated access request.',
      content: {
        'application/json': {
          schema: z.object({
            accessRequest: accessRequestInterfaceSchema,
          }),
        },
      },
    },
  },
})

interface PatchAccessRequestResponse {
  accessRequest: AccessRequestInterface
}

export const patchAccessRequest = [
  bodyParser.json(),
  async (req: Request, res: Response<PatchAccessRequestResponse>) => {
    req.audit = AuditInfo.UpdateAccessRequest
    const {
      body,
      params: { accessRequestId },
    } = parse(req, patchAccessRequestSchema)

    const accessRequest = await updateAccessRequest(req.user, accessRequestId, body)

    await audit.onUpdateAccessRequest(req, accessRequest)

    return res.json({
      accessRequest,
    })
  },
]
