import { Types } from 'mongoose'

import UserModel from '../common/models/User.js'

interface GetUserOptions {
  includeToken?: boolean
}

export async function getUserByInternalId(_id: string | Types.ObjectId, opts?: GetUserOptions) {
  let user = UserModel.findById(_id)
  if (opts?.includeToken) user = user.select('+token')

  return user
}
