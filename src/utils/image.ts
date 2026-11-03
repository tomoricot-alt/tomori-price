/**
 * 画像処理ユーティリティ
 */

export interface ProcessedImage {
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
  capturedAt: string;
}

/**
 * 画像ファイルをリサイズ＆圧縮してDataURLに変換
 */
export async function processAndCompressImage(
  file: File,
  maxDimension: number = 1200,
  quality: number = 0.8
): Promise<ProcessedImage> {
  const originalSize = file.size;
  // ファイルの最終更新日時を撮影日時候補として使用
  const capturedAt = file.lastModified 
    ? new Date(file.lastModified).toISOString() 
    : new Date().toISOString();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        
        // Base64からサイズ概算
        const compressedSize = Math.round((dataUrl.length * 3) / 4);

        resolve({
          dataUrl,
          originalSize,
          compressedSize,
          width,
          height,
          capturedAt,
        });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
