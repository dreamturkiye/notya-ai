/** Imaging types live in schema.ts so PASI/Fitzpatrick/ImageSeries never leak into core. */
export type {
  PhotoAsset,
  ImageSeries,
  BeforeAfterPair,
  TotalBodyMap,
  Lesion,
  VisionRead,
} from '../schema'
export { PHOTO_KINDS } from '../schema'
