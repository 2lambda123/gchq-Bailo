import { QueueMessage } from 'p-mongo-queue'

import VersionModel from '../common/models/Version.js'
import { ModelUploadType } from '../common/types/types.js'
import config from '../common/utils/config.js'
import logger from '../common/utils/logger.js'
import { getUserByInternalId } from '../services/user.js'
import { findVersionById, markVersionBuilt } from '../services/version.js'
import { BuildHandler, BuildTasks } from '../utils/BuildHandler.js'
import createWorkingDirectory from '../utils/CreateWorkingDirectory.js'
import extractFiles from '../utils/ExtractFiles.js'
import getRawFiles from '../utils/GetRawFiles.js'
import getSeldonDockerfile from '../utils/GetSeldonDockerfile.js'
import imgBuildDockerfile from '../utils/ImgBuildDockerfile.js'
import openshiftBuildDockerfile from '../utils/OpenShiftBuildDockerfile.js'
import pushDockerTar from '../utils/PushDockerTar.js'
import { getUploadQueue } from '../utils/queues.js'


export default async function processUploads() {
  ;(await getUploadQueue()).process(async (msg: QueueMessage) => {
    logger.info({ job: msg.payload }, 'Started processing upload')

    // To avoid having to add user service, include user in queue message payload
    const user = await getUserByInternalId(msg.payload.userId)
    // const user = msg.payload.user
    if (!user) {
      throw new Error(`Unable to find upload user '${msg.payload.userId}'`)
    }

    // To avoid having to add version service, include version in queue message payload
    // const version = await findVersionById(user, msg.payload.versionId, { populate: true })
    // const version = msg.payload.version
    const version = await VersionModel.findById(msg.payload.versionId)
    if (!version) {
      throw new Error(`Unable to find version '${msg.payload.versionId}'`)
    }

    let tasks: BuildTasks = [{ construct: createWorkingDirectory() }]

    switch (msg.payload.uploadType) {
      case ModelUploadType.Zip:
        tasks = tasks.concat([
          {
            construct: getRawFiles(),
            props: {
              files: [
                { path: 'binary.zip', file: 'binary' },
                { path: 'code.zip', file: 'code' },
              ],
            },
          },
          { construct: extractFiles() },
          {
            construct: getSeldonDockerfile(),
            props: {
              seldonDockerfile: version.metadata?.buildOptions?.seldonVersion,
            },
          },
        ])

        if (config.build.environment === 'openshift') {
          tasks.push({ construct: openshiftBuildDockerfile() })
        } else {
          tasks.push({ construct: imgBuildDockerfile() })
        }
        break
      case ModelUploadType.Docker:
        tasks = tasks.concat([
          { construct: getRawFiles(), props: { files: [{ path: 'docker.tar', file: 'docker' }] } },
          { construct: pushDockerTar() },
        ])
        break
      default:
        throw new Error(`Unexpected build type: ${msg.payload.uploadType}`)
    }

    const buildHandler = new BuildHandler(tasks)
    await buildHandler.process(version, {
      binary: msg.payload.binary,
      code: msg.payload.code,
      docker: msg.payload.docker,
    })

   await markVersionBuilt(version._id)
  })
}
