import bodyParser from 'body-parser'
import { Request, Response } from 'express'
import { z } from 'zod'

import { searchModels } from '../../../services/v2/model.js'
import { registerPath } from '../../../services/v2/specification.js'
import { GetModelFilters } from '../../../types/v2/enums.js'
import { coerceArray, parse } from '../../../utils/v2/validate.js'

export const getModelsSearchSchema = z.object({
  query: z.object({
    // These are all optional with defaults.  If they are not provided, they do not filter settings.
    task: z.string().optional(),

    libraries: coerceArray(z.array(z.string()).optional().default([])),
    filters: coerceArray(z.array(z.nativeEnum(GetModelFilters)).optional().default([])),
    search: z.string().optional().default(''),
  }),
})

registerPath({
  method: 'get',
  path: '/api/v2/models/search',
  tags: ['model'],
  description: 'Search through models',
  schema: getModelsSearchSchema,
  responses: {
    200: {
      description: 'Array with model summaries.',
      content: {
        'application/json': {
          schema: z.object({
            models: z.array(
              z.object({
                id: z.string().openapi({ example: 'yolo-abcdef' }),
                name: z.string().openapi({ example: 'Yolo v4' }),
                description: z.string().openapi({ example: 'You only look once' }),
                tags: z.array(z.string()).openapi({ example: ['tag', 'ml'] }),
              }),
            ),
          }),
        },
      },
    },
  },
})

interface ModelSearchResult {
  id: string
  name: string
  description: string
  tags: Array<string>
}

interface GetModelsResponse {
  models: Array<ModelSearchResult>
}

export const getModelsSearch = [
  bodyParser.json(),
  async (req: Request, res: Response<GetModelsResponse>) => {
    const {
      query: { libraries, filters, search, task },
    } = parse(req, getModelsSearchSchema)

    const foundModels = await searchModels(req.user, libraries, filters, search, task)
    const models = foundModels.map((model) => ({
      id: model.id,
      name: model.name,
      description: model.description,
      tags: model.card?.metadata?.overview?.tags || [],
    }))

    return res.json({ models })
  },
]
