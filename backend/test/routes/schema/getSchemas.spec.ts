import { describe, expect, test, vi } from 'vitest'

import { testGet } from '../../testUtils/routes.js'
import { testDeploymentSchema, testModelSchema } from '../../testUtils/testModels.js'

vi.mock('../../../src/utils/config.js')
vi.mock('../../../src/utils/user.js')

const mockSchemaService = vi.hoisted(() => {
  return {
    addDefaultSchemas: vi.fn(),
    findSchemasByKind: vi.fn(() => [testDeploymentSchema, testModelSchema]),
  }
})
vi.mock('../../../src/services/v2/schema.js', () => mockSchemaService)

describe('routes > schema > getSchemas', () => {
  test('returns all schemas', async () => {
    const res = await testGet(`/api/v2/schemas`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('returns only model schemas with the model parameter', async () => {
    mockSchemaService.findSchemasByKind.mockReturnValueOnce([testModelSchema])
    const res = await testGet(`/api/v2/schemas?kind=model`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('returns only deployment schemas with the accessRequest parameter', async () => {
    mockSchemaService.findSchemasByKind.mockReturnValueOnce([testDeploymentSchema])
    const res = await testGet(`/api/v2/schemas?kind=accessRequest`)

    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('rejects unknown query parameter', async () => {
    const res = await testGet(`/api/v2/schemas?kind=notValid`)

    expect(mockSchemaService.findSchemasByKind).not.toBeCalled()
    expect(res.statusCode).toBe(400)
    expect(res.body).matchSnapshot()
  })
})
