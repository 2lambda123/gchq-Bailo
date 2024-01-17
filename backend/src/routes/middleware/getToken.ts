import { NextFunction, Request, Response } from 'express'

import { getTokenFromAuthHeader as getTokenFromAuthHeaderService } from '../../services/v2/token.js'
import { Forbidden } from '../../utils/v2/error.js'

export async function getTokenFromAuthHeader(req: Request, _res: Response, next: NextFunction) {
  // Unlike 'getUser' this function is currently intended to be used on methods that ONLY authenticate
  // using the authentication header.  Thus, this function WILL fail and must only be used as middleware
  // in functions that MUST use basic auth.
  // This let's us provide better error messages for common issues, but could be refactored at a later
  // point in time.
  const authorization = req.get('authorization')

  if (!authorization) {
    throw Forbidden('No authorisation header found')
  }

  const token = await getTokenFromAuthHeaderService(authorization)

  req.user = { dn: token.user }
  req.token = token

  return next()
}
