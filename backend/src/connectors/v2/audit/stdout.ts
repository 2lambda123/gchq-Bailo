import { Request } from 'express'

import { AccessRequestDoc } from '../../../models/v2/AccessRequest.js'
import { FileInterface, FileInterfaceDoc } from '../../../models/v2/File.js'
import { ModelCardInterface, ModelDoc, ModelInterface } from '../../../models/v2/Model.js'
import { ReleaseDoc } from '../../../models/v2/Release.js'
import { ReviewInterface } from '../../../models/v2/Review.js'
import { SchemaInterface } from '../../../models/v2/Schema.js'
import { ModelSearchResult } from '../../../routes/v2/model/getModelsSearch.js'
import { BailoError } from '../../../types/v2/error.js'
import { AuditInfo, BaseAuditConnector } from './Base.js'

interface Outcome {
  Success: boolean
  Description: string
  Permitted?: boolean
}

export class StdoutAuditConnector extends BaseAuditConnector {
  constructor() {
    super()
  }

  onCreateModel(req: Request, model: ModelDoc) {
    this.checkEventType(AuditInfo.CreateModel, req)
    const event = this.generateEvent(req, { id: model.id })
    req.log.info(event, req.audit.description)
  }

  onViewModel(req: Request, model: ModelDoc) {
    this.checkEventType(AuditInfo.ViewModel, req)
    const event = this.generateEvent(req, { name: model.name })
    req.log.info(event, req.audit.description)
  }

  onUpdateModel(req: Request, model: ModelDoc) {
    this.checkEventType(AuditInfo.UpdateModel, req)
    const event = this.generateEvent(req, { id: model.id })
    req.log.info(event, req.audit.description)
  }

  onSearchModel(req: Request, models: ModelSearchResult[]) {
    this.checkEventType(AuditInfo.SearchModels, req)
    const event = this.generateEvent(req, {
      url: req.originalUrl,
      results: models.map((model) => model.id),
    })

    req.log.info(event, req.audit.description)
  }

  onCreateModelCard(req: Request, modelId: string, modelCard: ModelCardInterface) {
    this.checkEventType(AuditInfo.CreateModelCard, req)
    const event = this.generateEvent(req, { modelId, version: modelCard.version })
    req.log.info(event, req.audit.description)
  }

  onViewModelCard(req: Request, modelId: string, modelCard: ModelCardInterface) {
    this.checkEventType(AuditInfo.ViewModelCard, req)
    const event = this.generateEvent(req, { modelId, version: modelCard.version })
    req.log.info(event, req.audit.description)
  }

  onUpdateModelCard(req: Request, modelId: string, modelCard: ModelCardInterface) {
    this.checkEventType(AuditInfo.UpdateModelCard, req)
    const event = this.generateEvent(req, { modelId, version: modelCard.version })
    req.log.info(event, req.audit.description)
  }

  onViewModelCardRevisions(req: Request, modelCards: ModelCardInterface[]) {
    this.checkEventType(AuditInfo.ViewModelCardRevisions, req)
    const event = this.generateEvent(req, { url: req.originalUrl, results: modelCards.map((model) => model.version) })
    req.log.info(event, req.audit.description)
  }

  onCreateFile(req: Request, file: FileInterfaceDoc) {
    this.checkEventType(AuditInfo.CreateFile, req)
    const event = this.generateEvent(req, { id: file._id, modelId: file.modelId })
    req.log.info(event, req.audit.description)
  }

  onViewFiles(req: Request, modelId: string, files: FileInterface[]) {
    this.checkEventType(AuditInfo.ViewFiles, req)
    const event = this.generateEvent(req, { modelId, results: files.map((file) => file.name) })
    req.log.info(event, req.audit.description)
  }

  onDeleteFile(req: Request, modelId: string, fileId: string) {
    this.checkEventType(AuditInfo.DeleteFile, req)
    const event = this.generateEvent(req, { modelId, fileId })
    req.log.info(event, req.audit.description)
  }

  onCreateRelease(req: Request, release: ReleaseDoc) {
    this.checkEventType(AuditInfo.CreateRelease, req)
    const event = this.generateEvent(req, { modelId: release.modelId, semver: release.semver })
    req.log.info(event, req.audit.description)
  }

  onViewRelease(req: Request, release: ReleaseDoc) {
    this.checkEventType(AuditInfo.ViewRelease, req)
    const event = this.generateEvent(req, { modelId: release.modelId, semver: release.semver })
    req.log.info(event, req.audit.description)
  }

  onUpdateRelease(req: Request, release: ReleaseDoc) {
    this.checkEventType(AuditInfo.UpdateRelease, req)
    const event = this.generateEvent(req, { modelId: release.modelId, semver: release.semver })
    req.log.info(event, req.audit.description)
  }

  onDeleteRelease(req: Request, modelId: string, semver: string) {
    this.checkEventType(AuditInfo.DeleteRelease, req)
    const event = this.generateEvent(req, { modelId, semver })
    req.log.info(event, req.audit.description)
  }

  onSearchReleases(req: Request, releases: ReleaseDoc[]) {
    this.checkEventType(AuditInfo.SearchReleases, req)
    const event = this.generateEvent(req, {
      url: req.originalUrl,
      results: releases.map((release) => ({ modelId: release.modelId, semver: release.semver })),
    })
    req.log.info(event, req.audit.description)
  }

  onCreateAccessRequest(req: Request, accessRequest: AccessRequestDoc) {
    this.checkEventType(AuditInfo.CreateAccessRequest, req)
    const event = this.generateEvent(req, { id: accessRequest.id })
    req.log.info(event, req.audit.description)
  }

  onViewAccessRequest(req: Request, accessRequest: AccessRequestDoc) {
    this.checkEventType(AuditInfo.ViewAccessRequest, req)
    const event = this.generateEvent(req, { id: accessRequest.id })
    req.log.info(event, req.audit.description)
  }

  onUpdateAccessRequest(req: Request, accessRequest: AccessRequestDoc) {
    this.checkEventType(AuditInfo.UpdateAccessRequest, req)
    const event = this.generateEvent(req, { id: accessRequest.id })
    req.log.info(event, req.audit.description)
  }

  onDeleteAccessRequest(req: Request, accessRequestId: string) {
    this.checkEventType(AuditInfo.DeleteAccessRequest, req)
    const event = this.generateEvent(req, { accessRequestId })
    req.log.info(event, req.audit.description)
  }

  onSearchAccessRequests(req: Request, accessRequests: AccessRequestDoc[]) {
    this.checkEventType(AuditInfo.SearchAccessRequests, req)
    const event = this.generateEvent(req, {
      url: req.originalUrl,
      results: accessRequests.map((accessRequest) => ({
        id: accessRequest.id,
      })),
    })
    req.log.info(event, req.audit.description)
  }

  onSearchReviews(req: Request, reviews: (ReviewInterface & { model: ModelInterface })[]) {
    this.checkEventType(AuditInfo.SearchReviews, req)
    const event = this.generateEvent(req, {
      url: req.originalUrl,
      results: reviews.map((review) => ({
        modelId: review.modelId,
        ...(review.semver && { semver: review.semver }),
        ...(review.accessRequestId && { semver: review.accessRequestId }),
      })),
    })
    req.log.info(event, req.audit.description)
  }

  onCreateReviewResponse(req: Request, review: ReviewInterface) {
    this.checkEventType(AuditInfo.CreateReviewResponse, req)
    const event = this.generateEvent(req, {
      modelId: review.modelId,
      ...(review.semver && { semver: review.semver }),
      ...(review.accessRequestId && { semver: review.accessRequestId }),
    })
    req.log.info(event, req.audit.description)
  }

  onError(req: Request, error: BailoError) {
    if (!req.audit) {
      // No audit information has been attached to the request
      return
    }
    const outcome =
      error.code === 403
        ? {
            Description: 'User does not have permission to execute the request',
            Permitted: false,
            Success: false,
          }
        : {
            Description: error.message,
            Success: false,
          }
    const event = this.generateEvent(req, { url: req.originalUrl, httpMethod: req.method }, outcome)

    req.log.info(event, req.audit.description)
  }

  generateEvent(req: Request, resourceInfo: object, outcome?: Outcome) {
    return {
      typeId: req.audit.typeId,
      resource: resourceInfo,
      ...(outcome && { outcome }),
    }
  }

  onCreateSchema(req: Request, schema: SchemaInterface) {
    this.checkEventType(AuditInfo.CreateSchema, req)
    const event = this.generateEvent(req, { id: schema.id })
    req.log.info(event, req.audit.description)
  }

  onViewSchema(req: Request, schema: SchemaInterface) {
    this.checkEventType(AuditInfo.ViewSchema, req)
    const event = this.generateEvent(req, { id: schema.id })
    req.log.info(event, req.audit.description)
  }

  onSearchSchemas(req: Request, schemas: SchemaInterface[]) {
    this.checkEventType(AuditInfo.SearchSchemas, req)
    const event = this.generateEvent(req, {
      url: req.originalUrl,
      results: schemas.map((schema) => ({ id: schema.id })),
    })
    req.log.info(event, req.audit.description)
  }

  onViewModelImages(req: Request, modelId: string, images: { repository: string; name: string; tags: string[] }[]) {
    this.checkEventType(AuditInfo.ViewModelImages, req)
    const event = this.generateEvent(req, {
      modelId,
      images: images.map((image) => ({ repository: image.repository, name: image.name })),
    })
    req.log.info(event, req.audit.description)
  }
}
