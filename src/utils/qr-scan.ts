interface DetectedBarcode {
  rawValue: string;
}

interface BarcodeDetectorInstance {
  detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]>;
}

interface BarcodeDetectorConstructor {
  new (options: { formats: string[] }): BarcodeDetectorInstance;
  getSupportedFormats: () => Promise<string[]>;
}

const MAX_SCAN_SIZE = 1024;

let nativeDetector: Promise<BarcodeDetectorInstance | null> | undefined;

const getNativeDetector = () => {
  nativeDetector ??= (async () => {
    const Detector = (globalThis as { BarcodeDetector?: BarcodeDetectorConstructor })
      .BarcodeDetector;
    if (!Detector) return null;
    try {
      const formats = await Detector.getSupportedFormats();
      return formats.includes('qr_code') ? new Detector({ formats: ['qr_code'] }) : null;
    } catch {
      return null;
    }
  })();
  return nativeDetector;
};

const decodeWithJsQr = async (
  source: CanvasImageSource,
  width: number,
  height: number,
  canvas: HTMLCanvasElement
) => {
  const scale = Math.min(1, MAX_SCAN_SIZE / Math.max(width, height));
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return null;
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const jsQR = (await import('jsqr')).default;
  return jsQR(image.data, image.width, image.height)?.data ?? null;
};

export const decodeQr = async (
  source: CanvasImageSource,
  width: number,
  height: number,
  canvas: HTMLCanvasElement
) => {
  const detector = await getNativeDetector();
  if (detector) {
    try {
      const [code] = await detector.detect(source);
      if (code?.rawValue) return code.rawValue;
    } catch {}
  }
  return decodeWithJsQr(source, width, height, canvas);
};

export const decodeQrFromFile = async (file: File) => {
  const bitmap = await createImageBitmap(file);
  try {
    return await decodeQr(bitmap, bitmap.width, bitmap.height, document.createElement('canvas'));
  } finally {
    bitmap.close();
  }
};
