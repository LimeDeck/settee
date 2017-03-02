import { settee } from '../.test/build/index'

const testingConfig = {
  cluster: process.env.CLUSTER_URL || 'http://settee.docker',
  bucket: process.env.BUCKET_NAME || 'testing'
}

export { testingConfig }

export async function connect (clusterUrl, bucketName) {
  return settee.connect(
    clusterUrl || testingConfig.cluster,
    bucketName || testingConfig.bucket
  )
}
