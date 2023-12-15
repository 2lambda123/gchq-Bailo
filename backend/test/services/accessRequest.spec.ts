import { describe, expect, test, vi } from 'vitest'

import authorisation from '../../src/connectors/v2/authorisation/index.js'
import {
  createAccessRequest,
  getAccessRequestsByModel,
  removeAccessRequest,
} from '../../src/services/v2/accessRequest.js'

vi.mock('../../src/connectors/v2/authorisation/index.js')

const modelMocks = vi.hoisted(() => ({
  getModelById: vi.fn(),
}))
vi.mock('../../src/services/v2/model.js', () => modelMocks)

const schemaMocks = vi.hoisted(() => ({
  findSchemaById: vi.fn(),
}))
vi.mock('../../src/services/v2/schema.js', () => schemaMocks)

const accessRequestModelMocks = vi.hoisted(() => {
  const obj: any = {}

  obj.find = vi.fn(() => obj)
  obj.save = vi.fn(() => obj)
  obj.findOne = vi.fn(() => obj)
  obj.delete = vi.fn(() => obj)

  const model: any = vi.fn(() => obj)
  Object.assign(model, obj)

  return model
})
vi.mock('../../src/models/v2/AccessRequest.js', () => ({ default: accessRequestModelMocks }))

const mockReviewService = vi.hoisted(() => {
  return {
    createAccessRequestReviews: vi.fn(),
  }
})
vi.mock('../../src/services/v2/review.js', () => mockReviewService)

const accessRequest = {
  metadata: {
    overview: {
      name: 'example-access-request',
    },
  },
} as any

describe('services > accessRequest', () => {
  test('createAccessRequest > simple', async () => {
    modelMocks.getModelById.mockResolvedValue(undefined)
    schemaMocks.findSchemaById.mockResolvedValue({ jsonSchema: {} })

    await createAccessRequest({} as any, 'example-model', accessRequest)

    expect(accessRequestModelMocks.save).toBeCalled()
    expect(accessRequestModelMocks).toBeCalled()
    expect(mockReviewService.createAccessRequestReviews).toBeCalled()
  })

  test('createAccessRequest > bad authorisation', async () => {
    vi.mocked(authorisation.accessRequest).mockResolvedValue({
      info: 'You do not have permission',
      success: false,
      id: '',
    })

    modelMocks.getModelById.mockResolvedValue(undefined)
    schemaMocks.findSchemaById.mockResolvedValue({ jsonSchema: {} })

    expect(() => createAccessRequest({} as any, 'example-model', accessRequest)).rejects.toThrowError(
      /^You do not have permission/,
    )
  })

  test('getAccessRequestsByModel > good', async () => {
    modelMocks.getModelById.mockResolvedValue(undefined)
    accessRequestModelMocks.find.mockResolvedValue([{ _id: 'a' }, { _id: 'b' }])
    vi.mocked(authorisation.accessRequests).mockResolvedValue([
      { info: 'You do not have permission', success: false, id: '' },
      { success: true, id: '' },
    ])

    const accessRequests = await getAccessRequestsByModel({} as any, 'modelId')
    expect(accessRequests).toMatchSnapshot()
  })

  test('removeAccessRequest > success', async () => {
    expect(await removeAccessRequest({} as any, 'test')).toStrictEqual({ accessRequestId: 'test' })
  })

  test('removeAccessRequest > no permission', async () => {
    const mockAccessRequest = { _id: 'release' }

    modelMocks.getModelById.mockResolvedValue(undefined)
    accessRequestModelMocks.findOne.mockResolvedValue(mockAccessRequest)

    vi.mocked(authorisation.accessRequest).mockResolvedValueOnce({ success: true, id: '' })
    vi.mocked(authorisation.accessRequest).mockResolvedValueOnce({
      success: false,
      info: 'You do not have permission to delete this access request.',
      id: '',
    })

    expect(() => removeAccessRequest({} as any, 'test')).rejects.toThrowError(
      /^You do not have permission to delete this access request./,
    )
  })
})
