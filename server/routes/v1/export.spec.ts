import mongoose from "mongoose"
import axios from "axios"
import { authenticatedGetRequest } from "../../utils/test/testUtils"

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

const mockManifest = {
    "schemaVersion":1,
    "name":"internal/mock-model",
    "tag":"v1.0",
    "architecture":"amd64",
    "fsLayers":[
        {"blobSum":"sha256:mocksha"}
    ]
}


describe('test export routes', () => {
    beforeEach( async () => {

    })

    test('get manifest', async () => {
        mockedAxios.get.mockResolvedValueOnce({data: mockManifest})
        const res = await authenticatedGetRequest(`/api/v1/export/mock-model/version/v1.0`);
        expect(res.body).toBeDefined()

    })

    afterAll((done) => {
        mongoose.connection.close()
        done()
    })
})