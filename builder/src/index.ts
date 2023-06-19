import './common/utils/signals.js'

import config from './common/utils/config.js'
import { connectToMongoose } from './common/utils/database.js'
import { registerSigTerminate } from './common/utils/signals.js'
import processUploads from './processors/processUploads.js'
import { server } from './routes.js'

// connect to Mongo
await connectToMongoose()

await Promise.all([processUploads()])

const httpServer = server.listen(config.api.port, () => {
  console.log('Listening on port', config.api.port)
})

registerSigTerminate(httpServer)
