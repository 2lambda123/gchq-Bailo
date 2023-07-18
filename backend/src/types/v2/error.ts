import Logger from 'bunyan'

export interface BailoError extends Error {
  // Inherited from 'Error'
  // name: string
  // message: string

  // An HTTP response code that represents the error
  code: number

  // This data is logged publicly to the frontend
  context?: {
    documentationUrl?: string

    [key: string]: unknown
  }

  // A custom logger may be provided, otherwise a default is used
  logger?: Logger
}
