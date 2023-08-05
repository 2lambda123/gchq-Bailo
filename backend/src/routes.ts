import parser from 'body-parser'
import MongoStore from 'connect-mongo'
import express from 'express'
import session from 'express-session'
import grant from 'grant'

import { expressErrorHandler as expressErrorHandlerV2 } from './middleware/expressErrorHandler.js'
import { expressLogger as expressLoggerV2 } from './middleware/expressLogger.js'
import { getApplicationLogs, getItemLogs } from './routes/v1/admin.js'
import { getApprovals, getNumApprovals, postApprovalResponse } from './routes/v1/approvals.js'
import {
  fetchRawModelFiles,
  getDeployment,
  getDeploymentAccess,
  getDeploymentApprovals,
  getExportModelVersion,
  getUserDeployments,
  postDeployment,
  postUngovernedDeployment,
  resetDeploymentApprovals,
} from './routes/v1/deployment.js'
import {
  getModelAccess,
  getModelById,
  getModelByUuid,
  getModelDeployments,
  getModels,
  getModelSchema,
  getModelVersion,
  getModelVersions,
} from './routes/v1/model.js'
import { getDockerRegistryAuth } from './routes/v1/registryAuth.js'
import { getDefaultSchema, getSchema, getSchemas, postSchema } from './routes/v1/schema.js'
import { getSpecification } from './routes/v1/specification.js'
import { getUiConfig } from './routes/v1/uiConfig.js'
import { postUpload } from './routes/v1/upload.js'
import { favouriteModel, getLoggedInUser, getUsers, postRegenerateToken, unfavouriteModel } from './routes/v1/users.js'
import {
  deleteVersion,
  getVersion,
  getVersionAccess,
  getVersionApprovals,
  getVersionFile,
  getVersionFileList,
  postRebuildModel,
  postResetVersionApprovals,
  putUpdateLastViewed,
  putVersion,
} from './routes/v1/version.js'
import { deleteFile } from './routes/v2/model/file/deleteFile.js'
import { getFiles } from './routes/v2/model/file/getFiles.js'
import { postFinishMultipartUpload } from './routes/v2/model/file/postFinishMultipartUpload.js'
import { postSimpleUpload } from './routes/v2/model/file/postSimpleUpload.js'
import { postStartMultipartUpload } from './routes/v2/model/file/postStartMultipartUpload.js'
import { getModel } from './routes/v2/model/getModel.js'
import { getModelCard } from './routes/v2/model/getModelCard.js'
import { getModels as getModelsV2 } from './routes/v2/model/getModels.js'
import { patchModel } from './routes/v2/model/patchModel.js'
import { postModel } from './routes/v2/model/postModel.js'
import { deleteRelease } from './routes/v2/release/deleteRelease.js'
import { getRelease } from './routes/v2/release/getRelease.js'
import { getReleases } from './routes/v2/release/getReleases.js'
import { postRelease } from './routes/v2/release/postRelease.js'
import { getSchema as getSchemaV2 } from './routes/v2/schema/getSchema.js'
import { getSchemas as getSchemasV2 } from './routes/v2/schema/getSchemas.js'
import { patchTeam } from './routes/v2/team/getMyTeams.js'
import { getTeam } from './routes/v2/team/getTeam.js'
import { getTeams } from './routes/v2/team/getTeams.js'
import { postTeam } from './routes/v2/team/postTeam.js'
import config from './utils/config.js'
import logger, { expressErrorHandler, expressLogger } from './utils/logger.js'
import { getUser } from './utils/user.js'

export const server = express()

if (config.oauth.enabled) {
  server.use(
    session({
      secret: config.session.secret,
      resave: true,
      saveUninitialized: true,
      cookie: { maxAge: 30 * 24 * 60 * 60000 }, // store for 30 days
      store: MongoStore.create({
        mongoUrl: config.mongo.uri,
      }),
    })
  )
}

server.use(getUser)

server.use(expressLogger)
server.use('/api/v2', expressLoggerV2)

if (config.oauth.enabled) {
  server.use(parser.urlencoded({ extended: true }))
  server.use(grant.default.express(config.oauth.grant))

  server.get('/api/login', (req, res) => {
    res.redirect(`/api/connect/${config.oauth.provider}/login`)
  })

  server.get('/api/logout', (req, res) => {
    req.session.destroy(function (err: unknown) {
      if (err) throw err
      res.redirect('/')
    })
  })
}

// V1 APIs

server.post('/api/v1/model', ...postUpload)

server.get('/api/v1/models', ...getModels)
server.get('/api/v1/model/uuid/:uuid', ...getModelByUuid)
server.get('/api/v1/model/id/:id', ...getModelById)
server.get('/api/v1/model/:uuid/schema', ...getModelSchema)
server.get('/api/v1/model/:uuid/versions', ...getModelVersions)
server.get('/api/v1/model/:uuid/version/:version', ...getModelVersion)
server.get('/api/v1/model/:uuid/deployments', ...getModelDeployments)
server.get('/api/v1/model/:uuid/access', ...getModelAccess)

server.post('/api/v1/deployment', ...postDeployment)
server.post('/api/v1/deployment/ungoverned', ...postUngovernedDeployment)
server.get('/api/v1/deployment/:uuid', ...getDeployment)
server.get('/api/v1/deployment/:id/approvals', ...getDeploymentApprovals)
server.get('/api/v1/deployment/user/:id', ...getUserDeployments)
server.post('/api/v1/deployment/:uuid/reset-approvals', ...resetDeploymentApprovals)
server.get('/api/v1/deployment/:uuid/access', ...getDeploymentAccess)
server.get('/api/v1/deployment/:uuid/version/:version/raw/:fileType', ...fetchRawModelFiles)
server.get('/api/v1/deployment/:uuid/version/:version/export', ...getExportModelVersion)

server.get('/api/v1/version/:id', ...getVersion)
server.get('/api/v1/version/:id/contents/:file/list', ...getVersionFileList)
server.get('/api/v1/version/:id/contents/:file', ...getVersionFile)
server.get('/api/v1/version/:id/access', ...getVersionAccess)
server.get('/api/v1/version/:id/approvals', ...getVersionApprovals)
server.put('/api/v1/version/:id', ...putVersion)
server.delete('/api/v1/version/:id', ...deleteVersion)
server.post('/api/v1/version/:id/reset-approvals', ...postResetVersionApprovals)
server.post('/api/v1/version/:id/rebuild', ...postRebuildModel)
server.put('/api/v1/version/:id/lastViewed/:role', ...putUpdateLastViewed)

server.get('/api/v1/schemas', ...getSchemas)
server.get('/api/v1/schema/default', ...getDefaultSchema)
server.get('/api/v1/schema/:ref', ...getSchema)
server.post('/api/v1/schema', ...postSchema)

server.get('/api/v1/config/ui', ...getUiConfig)

server.get('/api/v1/users', ...getUsers)
server.get('/api/v1/user', ...getLoggedInUser)
server.post('/api/v1/user/token', ...postRegenerateToken)
server.post('/api/v1/user/favourite/:id', ...favouriteModel)
server.post('/api/v1/user/unfavourite/:id', ...unfavouriteModel)

server.get('/api/v1/approvals', ...getApprovals)
server.get('/api/v1/approvals/count', ...getNumApprovals)
server.post('/api/v1/approval/:id/respond', ...postApprovalResponse)

server.get('/api/v1/registry_auth', ...getDockerRegistryAuth)

server.get('/api/v1/specification', ...getSpecification)

server.get('/api/v1/admin/logs', ...getApplicationLogs)
server.get('/api/v1/admin/logs/build/:buildId', ...getItemLogs)
server.get('/api/v1/admin/logs/approval/:approvalId', ...getItemLogs)

/**
 ** V2 API **
 */

if (config.experimental.v2) {
  logger.info('Using experimental V2 endpoints')
  server.post('/api/v2/models', ...postModel)
  server.get('/api/v2/models', ...getModelsV2)
  // server.post('/api/v2/models/import', ...postModelImport)

  server.get('/api/v2/model/:modelId', ...getModel)
  server.patch('/api/v2/model/:modelId', ...patchModel)

  server.get('/api/v2/model/:modelId/model-cards/:version', getModelCard)

  server.post('/api/v2/model/:modelId/releases', ...postRelease)
  server.get('/api/v2/model/:modelId/releases', ...getReleases)
  server.get('/api/v2/model/:modelId/releases/:semver', ...getRelease)
  server.delete('/api/v2/model/:modelId/releases/:semver', ...deleteRelease)

  server.get('/api/v2/model/:modelId/files', ...getFiles)
  server.post('/api/v2/model/:modelId/files/upload/simple', ...postSimpleUpload)
  server.post('/api/v2/model/:modelId/files/upload/multipart/start', ...postStartMultipartUpload)
  server.post('/api/v2/model/:modelId/files/upload/multipart/finish', ...postFinishMultipartUpload)
  server.delete('/api/v2/model/:modelId/files/:fileId', ...deleteFile)

  // server.get('/api/v2/model/:modelId/images', ...getImages)
  // server.delete('/api/v2/model/:modelId/images/:imageId', ...deleteImage)

  // server.get('/api/v2/model/:modelId/releases/:semver/file/:fileCode/list', ...getModelFileList)
  // server.get('/api/v2/model/:modelId/releases/:semver/file/:fileCode/raw', ...getModelFileRaw)

  // server.get('/api/v2/template/models', ...getModelTemplates)
  // server.post('/api/v2/model/:modelId/setup/from-template', ...postFromTemplate)
  // server.post('/api/v2/model/:modelId/setup/from-existing', ...postFromExisting)
  // server.post('/api/v2/model/:modelId/setup/from-schema', ...postFromSchema)

  server.get('/api/v2/schemas', ...getSchemasV2)
  server.get('/api/v2/schema/:schemaId', ...getSchemaV2)

  // server.get('/api/v2/model/:modelId/compliance/check-request', ...getUserComplianceRequests)
  // server.post('/api/v2/model/:modelId/compliance/respond/:role', ...postComplianceResponse)

  server.post('/api/v2/teams', ...postTeam)
  server.get('/api/v2/teams', ...getTeams)
  server.get('/api/v2/teams/mine', ...getTeams)

  server.get('/api/v2/team/:teamId', ...getTeam)
  server.patch('/api/v2/team/:teamId', ...patchTeam)

  // server.post('/api/v2/teams/:teamId/members', ...postTeamMember)
  // server.get('/api/v2/teams/:teamId/members', ...getTeamMembers)
  // server.delete('/api/v2/teams/:teamId/members/:memberId', ...deleteTeamMember)
  // server.patch('/api/v2/teams/:teamId/members/:memberId', ...patchTeamMember)

  // server.get('/api/v2/teams/:teamId/roles/:memberId', ...getTeamMemberRoles)

  // server.get('/api/v2/users', ...getUsers)
  // server.get('/api/v2/users/me', ...getCurrentUser)

  // server.post('/api/v2/user/:userId/tokens', ...postUserToken)
  // server.get('/api/v2/user/:userId/tokens', ...getUserTokens)
  // server.get('/api/v2/user/:userId/token/:tokenId', ...getUserToken)
  // server.delete('/api/v2/user/:userId/token/:tokenId', ...deleteUserToken)
} else {
  logger.info('Not using experimental V2 endpoints')
}

server.use('/api/v1', expressErrorHandler)
server.use('/api/v2', expressErrorHandlerV2)
