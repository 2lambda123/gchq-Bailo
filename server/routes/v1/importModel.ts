import { NextFunction, Request, Response } from 'express'
import { BadReq } from '../../utils/result'
import { ensureUserRole } from '../../utils/user'

export const importModel = [
  // each item in this list is middleware
  (req: Request, res: Response, next: NextFunction) => {
    // do nothing, call next to go to next middleware
    next()
  },

  // ensureUserRole can be used to check a user is logged in
  ensureUserRole('user'),

  // actual route handler
  async (req: Request, res: Response) => {
    if (!req.query.message) {
      // throw an error, more in server/utils/result.ts
      // first argument is server-only log data, second argument is user facing message
      throw BadReq({}, 'No message provided')
    }

    // most logic here should be in a service

    // in this example we're just returning the data given to us
    res.json({
      message: req.query.message,
    })
  },
]
