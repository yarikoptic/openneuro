import { summary } from './summary.js'
import { issues } from './issues.js'
import { description } from './description.js'
import { getDraftFiles, getPartialStatus } from '../../datalad/draft.js'

// A draft must have a dataset parent
const draftFiles = dataset => args => {
  return getDraftFiles(dataset.id, dataset.revision, args)
}

export const draft = obj => ({
  id: obj.revision,
  files: draftFiles(obj),
  summary: () => summary(obj),
  issues: () => issues(obj),
  modified: obj.modified,
  partial: () => partial(obj, { datasetId: obj.id }),
  description: () =>
    description(obj, { datasetId: obj.id, revision: obj.revision }),
})

/**
 * Check if a dataset draft is partially uploaded
 */
export const partial = (obj, { datasetId }) => {
  return getPartialStatus(datasetId)
}
