import { createServerFn } from '@tanstack/react-start'

import {
  countFeaturesSchema,
  createFeatureSchema,
  deleteFeatureSchema,
  getFeatureSchema,
  listFeaturesSchema,
  updateFeatureSchema,
} from '#/features/features/schemas/feature.ts'
import {
  countProjectFeatures,
  getProjectFeature,
  insertFeature,
  listProjectFeatures,
  removeFeature,
  updateFeature,
} from '#/features/features/server/features.server.ts'

export const listFeatures = createServerFn({ method: 'GET' })
  .validator(listFeaturesSchema)
  .handler(async ({ data }) => {
    return listProjectFeatures(data.projectId)
  })

export const getFeature = createServerFn({ method: 'GET' })
  .validator(getFeatureSchema)
  .handler(async ({ data }) => {
    return getProjectFeature(data.featureId)
  })

export const countFeatures = createServerFn({ method: 'GET' })
  .validator(countFeaturesSchema)
  .handler(async ({ data }) => {
    return countProjectFeatures(data.projectId)
  })

export const createFeature = createServerFn({ method: 'POST' })
  .validator(createFeatureSchema)
  .handler(async ({ data }) => {
    return insertFeature(data)
  })

export const updateFeatureFn = createServerFn({ method: 'POST' })
  .validator(updateFeatureSchema)
  .handler(async ({ data }) => {
    return updateFeature(data)
  })

export const deleteFeature = createServerFn({ method: 'POST' })
  .validator(deleteFeatureSchema)
  .handler(async ({ data }) => {
    return removeFeature(data.id)
  })
