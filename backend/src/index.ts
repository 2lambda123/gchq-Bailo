import './utils/signals.js'

import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
import shelljs from 'shelljs'
import { z } from 'zod'

import { createModelIndexes } from './models/Model.js'
import { createSchemaIndexes } from './models/Schema.js'
import processDeployments from './processors/processDeployments.js'
import processUploads from './processors/processUploads.js'
import { addDefaultSchemas } from './services/schema.js'
import { addDefaultSchemas as addDefaultSchemasv2 } from './services/v2/schema.js'
import config from './utils/config.js'
import { connectToMongoose, runMigrations } from './utils/database.js'
import logger from './utils/logger.js'
import { ensureBucketExists } from './utils/minio.js'
import { registerSigTerminate } from './utils/signals.js'

// Update certificates based on mount
shelljs.exec('update-ca-certificates', { fatal: false, async: false })

// Let Zod types have OpenAPI attributes
extendZodWithOpenApi(z)

// technically, we do need to wait for this, but it's so quick
// that nobody should notice unless they want to upload an image
// within the first few milliseconds of the _first_ time it's run
if (config.minio.automaticallyCreateBuckets) {
  ensureBucketExists(config.minio.buckets.uploads)
  ensureBucketExists(config.minio.buckets.registry)
}

// connect to Mongo
await connectToMongoose()
await runMigrations()

// lazily create indexes for full text search
createModelIndexes()
createSchemaIndexes()

// lazily add default schemas
addDefaultSchemas()
if (config.experimental.v2) {
  addDefaultSchemasv2()
}

await Promise.all([processUploads(), processDeployments()])

const { server } = await import('./routes.js')
const httpServer = server.listen(config.api.port, () => {
  logger.info('Listening on port', config.api.port)
})

registerSigTerminate(httpServer)
