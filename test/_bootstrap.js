export async function connect (clusterUrl = process.env.CLUSTER_URL, bucketName = process.env.BUCKET_NAME) {
  return new Promise((resolve, reject) => {
    const couchbase = require('couchbase')
    const cluster = new couchbase.Cluster(clusterUrl || '192.168.99.104')
    const bucket = cluster.openBucket(bucketName || 'testing')

    bucket.on('connect', () => {
      resolve(bucket)
    })

  })
}
