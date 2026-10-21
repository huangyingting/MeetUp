import assert from 'node:assert/strict';
import test from 'node:test';
import { registerHooks } from 'node:module';
import sharp from 'sharp';

registerHooks({
  resolve(specifier, context, next) {
    if (specifier === './security' && context.parentURL?.endsWith('/media.ts')) return { url: new URL('./security.ts', context.parentURL).href, shortCircuit: true };
    return next(specifier, context);
  },
});
const { normalizeImage, imageFilePath, MAX_IMAGE_BYTES } = await import('./media.ts');

test('uploaded images are decoded, normalized to WebP, bounded and stripped of metadata', async () => {
  const input = await sharp({ create: { width: 3000, height: 1000, channels: 3, background: '#204d3b' } }).withMetadata().png().toBuffer();
  const output = await normalizeImage(input);
  const metadata = await sharp(output).metadata();
  assert.equal(metadata.format, 'webp');
  assert.equal(metadata.width, 2400);
  assert.equal(metadata.height, 800);
  assert.equal(metadata.exif, undefined);
});

test('SVG, disguised HTML, oversized files and oversized dimensions are rejected', async () => {
  for (const input of [Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>'), Buffer.from('<html>not an image</html>')]) {
    await assert.rejects(normalizeImage(input), { status: 400 });
  }
  await assert.rejects(normalizeImage(Buffer.alloc(MAX_IMAGE_BYTES + 1)), { status: 413 });
  const huge = await sharp({ create: { width: 5000, height: 5000, channels: 3, background: 'white' } }).png().toBuffer();
  await assert.rejects(normalizeImage(huge), { status: 400 });
});

test('only generated photo identifiers can select files in the private upload directory', () => {
  for (const id of ['../../.env', '/etc/passwd', 'photo.png', '', 'a'.repeat(36)]) assert.throws(() => imageFilePath(id), { status: 404 });
  assert(imageFilePath('a13f9f3f-2f6b-4d0d-8a22-cfa6810af100').endsWith('/a13f9f3f-2f6b-4d0d-8a22-cfa6810af100.webp'));
});
