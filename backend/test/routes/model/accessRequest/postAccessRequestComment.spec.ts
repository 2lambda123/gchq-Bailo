import { describe, expect, test, vi } from 'vitest'

import audit from '../../../../src/connectors/v2/audit/__mocks__/index.js'
import { postAccessRequestCommentSchema } from '../../../../src/routes/v2/model/accessRequest/postAccessRequestComment.js'
import { createFixture, testPost } from '../../../testUtils/routes.js'

vi.mock('../../../../src/utils/user.js')
vi.mock('../../../../src/connectors/v2/audit/index.js')
vi.mock('../../../../src/connectors/v2/authorisation/index.js')

vi.mock('../../../../src/services/v2/accessRequest.js', () => ({
  updateAccessRequestComments: vi.fn(() => ({ message: 'test' })),
}))

describe('routes > release > postReleaseComment', () => {
  test('200 > ok', async () => {
    const fixture = createFixture(postAccessRequestCommentSchema)
    const res = await testPost(
      `/api/v2/model/${fixture.params.modelId}/access-request/${fixture.params.accessRequestId}/comment`,
      fixture,
    )
    expect(res.statusCode).toBe(200)
    expect(res.body).matchSnapshot()
  })

  test('audit > expected call', async () => {
    const fixture = createFixture(postAccessRequestCommentSchema)
    const res = await testPost(
      `/api/v2/model/${fixture.params.modelId}/access-request/${fixture.params.accessRequestId}/comment`,
      fixture,
    )

    expect(res.statusCode).toBe(200)
    expect(audit.onUpdateAccessRequest).toBeCalled()
    expect(audit.onUpdateAccessRequest.mock.calls.at(0).at(1)).toMatchSnapshot()
  })
})
