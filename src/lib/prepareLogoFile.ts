// Browser-side prep for logo uploads. Server Actions accept ~1 MB, so oversized images (phone photos,
// large PNGs) are downscaled and re-encoded as WebP before upload; small files pass through untouched.
const MAX_BYTES = 900 * 1024;
const MAX_DIMENSION = 1000;

export async function prepareLogoFile(file: File): Promise<File> {
  if (file.size <= MAX_BYTES) return file;

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  for (const quality of [0.9, 0.7, 0.5]) {
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
    if (blob && blob.size <= MAX_BYTES) {
      return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' });
    }
  }
  throw new Error('That image is too large to upload. Please use a smaller logo.');
}
