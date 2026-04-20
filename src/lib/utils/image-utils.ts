/**
 * Client-side image compression utility using Canvas
 */
export async function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      const result = event.target?.result;
      if (typeof result !== 'string') {
        reject(new Error("Failed to read file as data URL"));
        return;
      }
      img.src = result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Max 1600px for a CV (sufficient for OCR)
        const MAX_SIZE = 1600;
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          } else {
            reject(new Error("Canvas blob error"));
          }
        }, 'image/jpeg', 0.85); // 85% quality: excellent for OCR/size balance
      };
    };
    reader.onerror = (e) => reject(e);
  });
}
