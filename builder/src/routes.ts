
import express from 'express'

import version from '../package.json' assert { type: "json" }

export const server = express()

server.get('/builder/info', (req, res) => {
  res.status(200).send({
    version,
  });
})