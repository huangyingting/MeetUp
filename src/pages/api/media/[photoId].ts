import type { NextApiRequest, NextApiResponse } from 'next';
import { readFile } from 'node:fs/promises';
import { prisma } from '@/lib/prisma';
import { getActiveUser } from '@/lib/auth-helper';
import { imageFilePath } from '@/lib/backend/media';
import { ApiError } from '@/lib/backend/security';

export default async function photo(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const photoId = typeof req.query.photoId === 'string' ? req.query.photoId : '';
    const filename = imageFilePath(photoId);
    const entry = await prisma.photo.findUnique({ where: { photoId }, select: { album: { select: { group: { select: { id: true, isPrivate: true, isDraft: true, organizerId: true } } } } } });
    if (!entry) throw new ApiError(404, 'Photo not found', 'NOT_FOUND');
    const group = entry.album.group;
    if (group.isPrivate || group.isDraft) {
      const user = await getActiveUser(req, res);
      const membership = user ? await prisma.groupMembership.findUnique({ where: { userId_groupId: { userId: user.id, groupId: group.id } }, select: { status: true } }) : null;
      if (!user || (group.organizerId !== user.id && (group.isDraft || membership?.status !== 'ACTIVE'))) throw new ApiError(404, 'Photo not found', 'NOT_FOUND');
    }
    const image = await readFile(filename);
    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Content-Length', image.length);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', 'inline; filename="community-photo.webp"');
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    res.setHeader('Vary', 'Cookie');
    return req.method === 'HEAD' ? res.status(200).end() : res.status(200).send(image);
  } catch (error) {
    if (error instanceof ApiError) return res.status(error.status).json({ error: error.message });
    console.error('Image read failed', error instanceof Error ? error.name : 'Unknown error');
    return res.status(500).json({ error: 'The photo could not be loaded' });
  }
}
