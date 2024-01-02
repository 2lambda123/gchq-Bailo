import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { AuditInfo } from '../../../connectors/v2/audit/Base.js'
import audit from '../../../connectors/v2/audit/index.js'
import { Decision, ReviewInterface } from '../../../models/v2/Review.js'
import { respondToReview } from '../../../services/v2/review.js'
import { registerPath, reviewInterfaceSchema } from '../../../services/v2/specification.js'
import { ReviewKind } from '../../../types/v2/enums.js'
import { parse } from '../../../utils/v2/validate.js'

export const postReleaseReviewResponseSchema = z.object({
  params: z.object({
    modelId: z.string(),
    semver: z.string(),
  }),
  body: z.object({
    role: z.string(),
    comment: z.string().optional(),
    decision: z.nativeEnum(Decision),
  }),
})

registerPath({
  method: 'post',
  path: '/api/v2/model/{modelId}/release/{semver}/review',
  tags: ['release', 'review'],
  description: 'Send a review for a release.',
  schema: postReleaseReviewResponseSchema,
  responses: {
    200: {
      description: 'The created review instance.',
      content: {
        'application/json': {
          schema: z.object({
            review: reviewInterfaceSchema,
          }),
        },
      },
    },
  },
})

interface PostReleaseReviewResponse {
  review: ReviewInterface
}

export const postReleaseReviewResponse = [
  bodyParser.json(),
  async (req: Request, res: Response<PostReleaseReviewResponse>) => {
    req.audit = AuditInfo.CreateReviewResponse
    const {
      params: { modelId, semver },
      body: { role, ...body },
    } = parse(req, postReleaseReviewResponseSchema)

    const review = await respondToReview(req.user, modelId, role, body, ReviewKind.Release, semver)
    await audit.onCreateReviewResponse(req, review)

    return res.json({
      review,
    })
  },
]
