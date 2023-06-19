import VersionModel from '../common/models/Version.js'
import { ModelId, UserDoc, VersionDoc } from '../common/types/types.js'

interface GetVersionOptions {
  thin?: boolean
  populate?: boolean
  showLogs?: boolean
  showFiles?: boolean
}

export async function findVersionById(user: UserDoc, id: ModelId | VersionDoc, opts?: GetVersionOptions) {
  let version = VersionModel.findById(id)
  if (opts?.thin) version = version.select({ state: 0, metadata: 0 })
  if (!opts?.showLogs) version = version.select({ logs: 0 })
  if (!opts?.showFiles) version = version.select({ 'files.code': 0, 'files.binary': 0 })
  if (opts?.populate) version = version.populate('model')

  return version
}

export async function markVersionBuilt(_id: ModelId) {
  return VersionModel.findByIdAndUpdate(_id, { built: true })
}
