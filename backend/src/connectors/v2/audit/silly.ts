/* eslint-disable @typescript-eslint/no-empty-function */
import { Request } from 'express'

import { AccessRequestDoc } from '../../../models/v2/AccessRequest.js'
import { FileInterface, FileInterfaceDoc } from '../../../models/v2/File.js'
import { ModelCardInterface, ModelDoc, ModelInterface } from '../../../models/v2/Model.js'
import { ReleaseDoc } from '../../../models/v2/Release.js'
import { ReviewInterface } from '../../../models/v2/Review.js'
import { SchemaInterface } from '../../../models/v2/Schema.js'
import { ModelSearchResult } from '../../../routes/v2/model/getModelsSearch.js'
import { BailoError } from '../../../types/v2/error.js'
import { BaseAuditConnector } from './Base.js'

export class SillyAuditConnector extends BaseAuditConnector {
  constructor() {
    super()
  }

  onCreateModel(_req: Request, _model: ModelDoc) {}
  onViewModel(_req: Request, _model: ModelDoc) {}
  onUpdateModel(_req: Request, _model: ModelDoc) {}
  onSearchModel(_req: Request, _models: ModelSearchResult[]) {}
  onCreateModelCard(_req: Request, _modelId: string, _modelCard: ModelCardInterface) {}
  onViewModelCard(_req: Request, _modelId: string, _modelCard: ModelCardInterface) {}
  onUpdateModelCard(_req: Request, _modelId: string, _modelCard: ModelCardInterface) {}
  onViewModelCardRevisions(_req: Request, _modelCards: ModelCardInterface[]) {}
  onCreateFile(_req: Request, _file: FileInterfaceDoc) {}
  onViewFiles(_req: Request, _modelId: string, _files: FileInterface[]) {}
  onDeleteFile(_req: Request, _modelId: string, _fileId: string) {}
  onCreateRelease(_req: Request, _release: ReleaseDoc) {}
  onViewRelease(_req: Request, _release: ReleaseDoc) {}
  onUpdateRelease(_req: Request, _release: ReleaseDoc) {}
  onDeleteRelease(_req: Request, _modelId: string, _semver: string) {}
  onSearchReleases(_req: Request, _releases: ReleaseDoc[]) {}
  onCreateAccessRequest(_req: Request, _accessRequest: AccessRequestDoc) {}
  onViewAccessRequest(_req: Request, _accessRequest: AccessRequestDoc) {}
  onUpdateAccessRequest(_req: Request, _accessRequest: AccessRequestDoc) {}
  onDeleteAccessRequest(_req: Request, _accessRequestId: string) {}
  onSearchAccessRequests(_req: Request, _accessRequests: AccessRequestDoc[]) {}
  onSearchReviews(_req: Request, _reviews: (ReviewInterface & { model: ModelInterface })[]) {}
  onCreateReviewResponse(_req: Request, _review: ReviewInterface) {}
  onSearchSchemas(_req: Request, _schemas: SchemaInterface[]) {}
  onCreateSchema(_req: Request, _schema: SchemaInterface) {}
  onViewSchema(_req: Request, _schema: SchemaInterface) {}
  onViewModelImages(_req: Request, _modelId: string, _images: { repository: string; name: string; tags: string[] }[]) {}
  onError(_req: Request, _error: BailoError) {}
}
