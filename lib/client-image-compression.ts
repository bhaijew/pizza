/**
 * Client-side image compression and resizing utility using HTML5 Canvas.
 * Prevents HTTP 413 "Body exceeded 1 MB limit" errors when uploading logos or product photos.
 */

export async function compressImageFile(
  file: File,
  maxDimension: number = 512,
  quality: number = 0.85
): Promise<string> {
  // If SVG, preserve raw vector format without rasterization
  if (file.type === "image/svg+xml") {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (!src) {
        reject(new Error("Empty image file"));
        return;
      }

      const img = new Image();
      img.onerror = () => reject(new Error("Failed to decode image"));
      img.onload = () => {
        let { width, height } = img;

        // Downscale proportionally if larger than maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          // Fallback to original data URL if canvas 2D context unavailable
          resolve(src);
          return;
        }

        // Smooth image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP first (supports transparency + superior compression)
        try {
          const webpData = canvas.toDataURL("image/webp", quality);
          if (webpData.startsWith("data:image/webp")) {
            resolve(webpData);
            return;
          }
        } catch {
          // Ignore and fall back to PNG/JPEG
        }

        // Fallback: PNG for transparent images, JPEG for others
        const format = file.type === "image/png" ? "image/png" : "image/jpeg";
        resolve(canvas.toDataURL(format, quality));
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}
