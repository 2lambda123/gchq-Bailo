import { describe, expect, test, vi } from 'vitest'

import { ModelAction } from '../../src/connectors/v2/authorisation/Base.js'
import authorisation from '../../src/connectors/v2/authorisation/index.js'
import {
  _setModelCard,
  canUserActionModelById,
  createModel,
  getModelById,
  getModelCardRevision,
  searchModels,
} from '../../src/services/v2/model.js'

vi.mock('../../src/connectors/v2/authorisation/index.js')

const modelCardRevisionModel = vi.hoisted(() => {
  const obj: any = {}

  obj.findOne = vi.fn(() => obj)
  obj.save = vi.fn(() => obj)

  const model: any = vi.fn(() => obj)
  Object.assign(model, obj)

  return model
})
vi.mock('../../src/models/v2/ModelCardRevision.js', () => ({
  default: modelCardRevisionModel,
}))

const idMocks = vi.hoisted(() => ({ convertStringToId: vi.fn(() => 'model-id') }))
vi.mock('../../src/utils/v2/id.js', () => ({
  convertStringToId: idMocks.convertStringToId,
}))

const modelMocks = vi.hoisted(() => {
  const obj: any = {}

  obj.aggregate = vi.fn(() => obj)
  obj.match = vi.fn(() => obj)
  obj.sort = vi.fn(() => obj)
  obj.lookup = vi.fn(() => obj)
  obj.append = vi.fn(() => obj)
  obj.find = vi.fn(() => obj)
  obj.findOne = vi.fn(() => obj)
  obj.updateOne = vi.fn(() => obj)
  obj.save = vi.fn(() => obj)

  const model: any = vi.fn(() => obj)
  Object.assign(model, obj)

  return model
})
vi.mock('../../src/models/v2/Model.js', () => ({ default: modelMocks }))

const authenticationMocks = vi.hoisted(() => ({
  getEntities: vi.fn(() => ['user']),
}))
vi.mock('../../src/connectors/v2/authentication/index.js', async () => ({
  default: authenticationMocks,
}))

describe('services > model', () => {
  test('createModel > simple', async () => {
    await createModel({} as any, {} as any)

    expect(modelMocks.save).toBeCalled()
    expect(modelMocks).toBeCalled()
  })

  test('createModel > bad authorisation', async () => {
    vi.mocked(authorisation.model).mockResolvedValue({ info: 'You do not have permission', success: false })

    expect(() => createModel({} as any, {} as any)).rejects.toThrowError(/^You do not have permission/)
    expect(modelMocks.save).not.toBeCalled()
  })

  test('getModelById > good', async () => {
    modelMocks.findOne.mockResolvedValueOnce('mocked')

    const model = await getModelById({} as any, {} as any)

    expect(modelMocks.findOne).toBeCalled()
    expect(model).toBe('mocked')
  })

  test('getModelById > bad authorisation', async () => {
    modelMocks.findOne.mockResolvedValueOnce({})
    vi.mocked(authorisation.model).mockResolvedValue({ info: 'You do not have permission', success: false })

    expect(() => getModelById({} as any, {} as any)).rejects.toThrowError(/^You do not have permission/)
  })

  test('getModelById > no model', async () => {
    modelMocks.findOne.mockResolvedValueOnce(undefined)

    expect(() => getModelById({} as any, {} as any)).rejects.toThrowError(/^The requested model was not found/)
  })

  test('canUserActionModelById > allowed', async () => {
    modelMocks.findOne.mockResolvedValueOnce({} as any)

    expect(await canUserActionModelById({} as any, 'example', {} as any)).toStrictEqual({ success: true })
  })

  test('canUserActionModelById > not allowed', async () => {
    // getModelById call should initially succeed
    vi.mocked(authorisation.model).mockResolvedValueOnce({ success: true })
    // But then the action trigger should fail
    vi.mocked(authorisation.model).mockResolvedValue({ info: 'You do not have permission', success: false })

    modelMocks.findOne.mockResolvedValueOnce({} as any)

    expect(await canUserActionModelById({} as any, 'example', {} as any)).toStrictEqual({
      success: false,
      info: 'You do not have permission',
    })
  })

  test('searchModels > no filters', async () => {
    const user: any = { dn: 'test' }
    modelMocks.sort.mockResolvedValueOnce([])

    await searchModels(user, [], [], '', undefined)
  })

  test('searchModels > all filters', async () => {
    const user: any = { dn: 'test' }
    modelMocks.sort.mockResolvedValueOnce([])

    await searchModels(user, ['library'], ['mine'], 'search', 'task')
  })

  test('searchModels > task no library', async () => {
    const user: any = { dn: 'test' }
    modelMocks.sort.mockResolvedValueOnce([])

    await searchModels(user, [], [], '', 'task')
  })

  test('searchModels > bad filter', async () => {
    const user: any = { dn: 'test' }
    modelMocks.sort.mockResolvedValueOnce([])

    expect(() => searchModels(user, [], ['asdf' as any], '')).rejects.toThrowError()
  })

  test('getModelCardRevision > should throw NotFound if modelCard does not exist', async () => {
    const mockUser = { dn: 'testUser' } as any
    const mockModelId = '123'
    const mockVersion = 1

    modelCardRevisionModel.findOne = vi.fn().mockResolvedValue(undefined)

    await expect(getModelCardRevision(mockUser, mockModelId, mockVersion)).rejects.toThrow(
      /^Version '.*' does not exist/,
    )
  })

  test('getModelCardRevision > should throw Forbidden if user does not have permission to view modelCard', async () => {
    const mockUser = { dn: 'testUser' } as any
    const mockModelId = '123'
    const mockVersion = 1
    const mockModelCard = { modelId: mockModelId, version: mockVersion }

    modelCardRevisionModel.findOne = vi.fn().mockResolvedValue(mockModelCard)
    vi.mocked(authorisation.model).mockResolvedValue({ info: 'You do not have permission', success: false })

    await expect(getModelCardRevision(mockUser, mockModelId, mockVersion)).rejects.toThrow(
      /^You do not have permission/,
    )
  })

  test('getModelCardRevision > should return modelCard if it exists and user has permission to view it', async () => {
    const mockUser = { dn: 'testUser' } as any
    const mockModelId = '123'
    const mockVersion = 1
    const mockModelCard = { modelId: mockModelId, version: mockVersion }

    modelCardRevisionModel.findOne = vi.fn().mockResolvedValue(mockModelCard)

    const result = await getModelCardRevision(mockUser, mockModelId, mockVersion)

    expect(result).toEqual(mockModelCard)
  })

  test('_setModelCard > should throw Forbidden if user does not have write permission', async () => {
    const mockUser = { dn: 'testUser' } as any
    const mockModelId = '123'
    const mockSchemaId = 'abc'
    const mockVersion = 1
    const mockMetadata = { key: 'value' }

    vi.mocked(authorisation.model).mockImplementation(async (_user, _model, action) => {
      if (action === ModelAction.View) return { success: true }
      if (action === ModelAction.Write)
        return { success: false, info: 'You do not have permission to update this model card' }

      return { success: false, info: 'Unknown action.' }
    })

    await expect(_setModelCard(mockUser, mockModelId, mockSchemaId, mockVersion, mockMetadata)).rejects.toThrow(
      /^You do not have permission to update this model card/,
    )
    expect(modelCardRevisionModel.save).not.toBeCalled()
  })

  test('_setModelCard > should save and update model card if user has write permission', async () => {
    const mockUser = { dn: 'testUser' } as any
    const mockModelId = '123'
    const mockSchemaId = 'abc'
    const mockVersion = 1
    const mockMetadata = { key: 'value' }

    const result = await _setModelCard(mockUser, mockModelId, mockSchemaId, mockVersion, mockMetadata)

    expect(result).toBeDefined()
    expect(modelCardRevisionModel.save).toBeCalled()
  })
})
