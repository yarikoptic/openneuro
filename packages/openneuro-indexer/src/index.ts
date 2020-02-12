import { RetryLink } from 'apollo-link-retry'
import { Client } from '@elastic/elasticsearch'
import createClient, { datasetGenerator } from 'openneuro-client/src/client'
import indexDatasets from './indexDatasets'
import { createIndices } from './createIndices'
import { indexQuery } from './indexQuery'

/**
 * Indexer entrypoint
 */
export default async function main() {
  const retryLink = new RetryLink({
    delay: {
      initial: 3000,
    },
    attempts: {
      max: 10,
    },
  })
  const apolloClient = await createClient(process.env.GRAPHQL_URI, {
    fetch,
    links: [retryLink],
  })
  const elasticClient = new Client({
    node: process.env.ELASTICSEARCH_CONNECTION,
    maxRetries: 10,
    requestTimeout: 60000,
  })
  try {
    await createIndices(elasticClient)
  } catch (err) {
    console.error('Could not create indices, skipping indexing')
    console.error(err)
  }
  const datasets = datasetGenerator(apolloClient, indexQuery)
  await indexDatasets(elasticClient, datasets)
}

main()
