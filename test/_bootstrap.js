import { settee } from '../.test/build/index'

export async function connect (clusterUrl, bucketName) {
  return settee.connect(
    clusterUrl || process.env.CLUSTER_URL || 'http://settee.docker',
    bucketName || process.env.BUCKET_NAME || 'testing'
  )
}
