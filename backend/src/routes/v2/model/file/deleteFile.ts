import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { removeFile } from '../../../../services/v2/file.js'
import { registerPath } from '../../../../services/v2/specification.js'
import { parse } from '../../../../utils/validate.js'

export const deleteFileSchema = z.object({
  params: z.object({
    modelId: z.string(),
    fileId: z.string(),
  }),
})

registerPath({
  method: 'delete',
  path: '/api/v2/model/{modelId}/file/{fileId}',
  tags: ['file'],
  description: 'Delete a file from a model.',
  schema: deleteFileSchema,
  responses: {
    200: {
      description: 'A message confirming the removal of the file.',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string().openapi({ example: 'Successfully removed file' }),
          }),
        },
      },
    },
  },
})

interface DeleteFileResponse {
  message: string
}

export const deleteFile = [
  bodyParser.json(),
  async (req: Request, res: Response<DeleteFileResponse>) => {
    const {
      params: { modelId, fileId },
    } = parse(req, deleteFileSchema)

    await removeFile(req.user, modelId, fileId)

    return res.json({
      message: 'Successfully removed file.',
    })
  },
]
