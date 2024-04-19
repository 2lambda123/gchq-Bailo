import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { registerPath } from '../../../services/specification.js'

export const postTokenSchema = z.object({
  body: z.object({}),
})

registerPath({
  method: 'post',
  path: '/api/v2/auth/token',
  tags: ['auth'],
  description: 'Create a new auth session from a token.',
  schema: postTokenSchema,
  responses: {
    200: {
      description: 'The created user session instance.',
      content: {
        'application/json': {
          schema: z.object({
            session: z.string().openapi({ example: '1234567890ABCDEF' }),
          }),
        },
      },
    },
  },
})

interface PostTokenResponse {
  session: string
  expiry: string
}

export const postToken = [
  bodyParser.json(),
  async (req: Request, res: Response<PostTokenResponse>) => {
    req.session.grant = {
      response: {
        jwt: {
          id_token: {
            payload: {
              email: req.user.dn,
            },
          },
        },
      },
    }

    const session = req.sessionID

    return res.json({
      session,
      expiry: (req.session as any).cookie._expires,
    })
  },
]
