import { QueueMessage } from 'p-mongo-queue'

import { Build, BuildTasks } from '../builders/Build.js'
import createWorkingDirectory from '../buildSteps/CreateWorkingDirectory.js'
import extractFiles from '../buildSteps/ExtractFiles.js'
import getRawFiles from '../buildSteps/GetRawFiles.js'
import getSeldonDockerfile from '../buildSteps/GetSeldonDockerfile.js'
import imgBuildDockerfile from '../buildSteps/ImgBuildDockerfile.js'
import openshiftBuildDockerfile from '../buildSteps/OpenShiftBuildDockerfile.js'
import pushDockerTar from '../buildSteps/PushDockerTar.js'
import VersionModel from '../common/models/Version.js'
import { ModelUploadType } from '../common/types/types.js'
import config from '../common/utils/config.js'
import logger from '../common/utils/logger.js'
import { getUserByInternalId } from '../services/user.js'
import { markVersionBuilt } from '../services/version.js'
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

    const build = new Build(tasks)
    await build.process(version, {
      binary: msg.payload.binary,
      code: msg.payload.code,
      docker: msg.payload.docker,
    })

    markVersionBuilt(version._id)
  })
}
