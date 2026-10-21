import path from 'node:path';
import sharp from 'sharp';
import { ApiError } from './security';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function uploadDirectory(): string {
  // Runtime uploads must not be traced into the deployment bundle.
  return path.resolve(/*turbopackIgnore: true*/ process.env.UPLOAD_DIRECTORY || 'storage/uploads');
}

export function imageFilePath(photoId: string): string {
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(photoId)) throw new ApiError(404, 'Photo not found', 'NOT_FOUND');
  return path.join(uploadDirectory(), `${photoId}.webp`);
}

export async function normalizeImage(input: Buffer): Promise<Buffer> {
  if (!input.length || input.length > MAX_IMAGE_BYTES) throw new ApiError(413, 'Choose an image no larger than 5 MB');
  try {
    const image = sharp(input, { limitInputPixels: 20_000_000, failOn: 'warning', animated: false });
    const metadata = await image.metadata();
    if (!['jpeg', 'png', 'webp'].includes(metadata.format || '')) throw new Error('Unsupported image');
    return await image.rotate().resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
  } catch {
    throw new ApiError(400, 'Choose a valid JPEG, PNG or WebP image under 20 megapixels');
  }
}
