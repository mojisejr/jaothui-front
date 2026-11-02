import createImageUrlBuilder from '@sanity/image-url'
import type { Image } from 'sanity'

import { dataset, projectId } from '../env'

export const NEWS_EVENT_COVER_IMAGE_WIDTH = 1280
export const NEWS_EVENT_COVER_IMAGE_HEIGHT = 720

const imageBuilder = createImageUrlBuilder({
  projectId: projectId || '',
  dataset: dataset || '',
})

export const urlForImage = (source: Image) => {
  return imageBuilder?.image(source).auto('format').fit('max')
}

export const urlForNewsEventCoverImage = (source: Image) => {
  return imageBuilder
    ?.image(source)
    .width(NEWS_EVENT_COVER_IMAGE_WIDTH)
    .height(NEWS_EVENT_COVER_IMAGE_HEIGHT)
    .fit('crop')
    .auto('format')
}
