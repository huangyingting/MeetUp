import type { NextApiRequest, NextApiResponse } from 'next';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';
import { ApiError, sameOrigin, text } from '@/lib/backend/security';
import { rateLimit } from '@/lib/backend/api-rate-limit';
import { imageFilePath, MAX_IMAGE_BYTES, normalizeImage } from '@/lib/backend/media';

export const config = { api: { bodyParser: false } };

export default async function upload(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    sameOrigin(req.headers);
    const user = await getActiveUser(req, res);
    if (!user) throw new ApiError(401, 'Sign in to upload a photo', 'UNAUTHENTICATED');
    await rateLimit(`image-upload:${user.id}`, 10, 60 * 60_000);
    const groupId = text(req.query.groupId, 'Community ID');
    const caption = text(req.query.caption ?? '', 'Caption', 0, 1000);
    const membership = await prisma.groupMembership.findUnique({
      where: { userId_groupId: { userId: user.id, groupId } },
      select: { status: true, group: { select: { id: true, name: true, isDraft: true } } },
    });
    if (membership?.status !== 'ACTIVE' || membership.group.isDraft) throw new ApiError(403, 'Join this community before sharing photos', 'FORBIDDEN');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(req.headers['content-type'] || '')) throw new ApiError(415, 'Choose a JPEG, PNG or WebP image');
    if (Number(req.headers['content-length']) > MAX_IMAGE_BYTES) throw new ApiError(413, 'Choose an image no larger than 5 MB');
    const chunks: Buffer[] = [];
    let length = 0;
    for await (const chunk of req.iterator({ destroyOnReturn: false })) {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      length += buffer.length;
      if (length > MAX_IMAGE_BYTES) { req.resume(); throw new ApiError(413, 'Choose an image no larger than 5 MB'); }
      chunks.push(buffer);
    }
    const image = await normalizeImage(Buffer.concat(chunks));
    const photoId = randomUUID();
    const filename = imageFilePath(photoId);
    await mkdir(path.dirname(filename), { recursive: true, mode: 0o700 });
    await writeFile(filename, image, { flag: 'wx', mode: 0o600 });
    try {
      const photo = await prisma.$transaction(async tx => {
        const current = await tx.groupMembership.findUnique({ where: { userId_groupId: { userId: user.id, groupId } }, select: { status: true } });
        if (current?.status !== 'ACTIVE') throw new ApiError(403, 'Join this community before sharing photos', 'FORBIDDEN');
        let album = await tx.photoAlbum.findFirst({ where: { groupId } });
        if (!album) album = await tx.photoAlbum.create({ data: { albumId: randomUUID(), groupId, title: `${membership.group.name} photos` } });
        const created = await tx.photo.create({ data: { photoId, albumId: album.id, uploadedById: user.id, caption, url: `/api/media/${photoId}` }, select: { photoId: true, url: true, caption: true } });
        await tx.photoAlbum.update({ where: { id: album.id }, data: { photosCount: { increment: 1 } } });
        return created;
      }, { isolationLevel: 'Serializable' });
      return res.status(201).json({ photo });
    } catch (error) {
      try { await unlink(filename); } catch (cleanupError) { console.error('Image cleanup failed', cleanupError instanceof Error ? cleanupError.name : 'Unknown error'); }
      throw error;
    }
  } catch (error) {
    if (error instanceof ApiError) return res.status(error.status).json({ error: error.message, code: error.code });
    console.error('Image upload failed', error instanceof Error ? error.name : 'Unknown error');
    return res.status(500).json({ error: 'Your photo could not be stored. Please try again.' });
  }
}
