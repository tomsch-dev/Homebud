import { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { lookupBarcode, OpenFoodFactsProduct } from '../api/openFoodFacts';

interface Props {
  onResult: (product: OpenFoodFactsProduct) => void;
  onClose: () => void;
}

const hasNativeDetector = typeof window !== 'undefined' && 'BarcodeDetector' in window;

export default function BarcodeScanner({ onResult, onClose }: Props) {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  const [status, setStatus] = useState<'camera' | 'loading' | 'not-found' | 'error'>('camera');
  const [scannedCode, setScannedCode] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [zoom, setZoom] = useState(1);
  const [maxZoom, setMaxZoom] = useState(1);
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const stopCamera = useCallback(() => {
    scanningRef.current = false;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const handleBarcode = useCallback(async (code: string) => {
    if (!code || scanningRef.current === false) return;
    scanningRef.current = false;
    stopCamera();
    setScannedCode(code);
    setStatus('loading');
    try {
      const product = await lookupBarcode(code);
      if (product && product.name) {
        onResult(product);
      } else {
        setStatus('not-found');
      }
    } catch {
      setStatus('not-found');
    }
  }, [onResult, stopCamera]);

  const startCamera = useCallback(async () => {
    setStatus('camera');
    setScannedCode('');
    setZoom(1);
    setTorchOn(false);
    scanningRef.current = true;

    try {
      // Request high resolution for better small barcode detection
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = stream;

      const vTrack = stream.getVideoTracks()[0];
      const caps = vTrack.getCapabilities?.() as any;

      // Enable continuous autofocus
      try {
        await vTrack.applyConstraints({ advanced: [{ focusMode: 'continuous' } as any] });
      } catch { /* not supported */ }

      // Check zoom & torch capabilities
      if (caps?.zoom?.max) {
        setMaxZoom(Math.min(caps.zoom.max, 8));
      }
      if (caps?.torch) {
        setHasTorch(true);
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      if (hasNativeDetector) {
        startNativeDetection();
      } else {
        startFallbackDetection();
      }
    } catch {
      setStatus('error');
    }
  }, []);

  // Apply zoom to the camera track
  const applyZoom = useCallback((level: number) => {
    setZoom(level);
    const vTrack = streamRef.current?.getVideoTracks()[0];
    if (vTrack) {
      try {
        vTrack.applyConstraints({ advanced: [{ zoom: level } as any] });
      } catch { /* zoom not supported */ }
    }
  }, []);

  // Toggle flashlight
  const toggleTorch = useCallback(() => {
    const next = !torchOn;
    setTorchOn(next);
    const vTrack = streamRef.current?.getVideoTracks()[0];
    if (vTrack) {
      try {
        vTrack.applyConstraints({ advanced: [{ torch: next } as any] });
      } catch { /* torch not supported */ }
    }
  }, [torchOn]);

  // Native BarcodeDetector — fast, hardware-accelerated
  const startNativeDetection = useCallback(() => {
    const detector = new (window as any).BarcodeDetector({
      formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39'],
    });

    const detect = async () => {
      if (!scanningRef.current || !videoRef.current) return;
      try {
        const barcodes = await detector.detect(videoRef.current);
        if (barcodes.length > 0 && scanningRef.current) {
          handleBarcode(barcodes[0].rawValue);
          return;
        }
      } catch { /* frame not ready */ }
      if (scanningRef.current) {
        requestAnimationFrame(detect);
      }
    };
    requestAnimationFrame(detect);
  }, [handleBarcode]);

  // Fallback: html5-qrcode (loaded lazily only if needed)
  const startFallbackDetection = useCallback(async () => {
    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
      if (!scanningRef.current || !videoRef.current) return;

      const formats = [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
      ];
      const scanner = new Html5Qrcode('barcode-fallback-region', { formatsToSupport: formats, verbose: false });

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;

      const scanLoop = async () => {
        if (!scanningRef.current || !videoRef.current) return;
        const video = videoRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        try {
          const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), 'image/jpeg', 0.9));
          const file = new File([blob], 'frame.jpg', { type: 'image/jpeg' });
          const result = await scanner.scanFileV2(file, false);
          if (result && scanningRef.current) {
            handleBarcode(result.decodedText);
            return;
          }
        } catch { /* no barcode found in this frame */ }

        if (scanningRef.current) {
          setTimeout(scanLoop, 200);
        }
      };

      setTimeout(scanLoop, 500);
    } catch {
      // html5-qrcode failed to load
    }
  }, [handleBarcode]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const handleManualLookup = () => {
    const code = manualCode.trim();
    if (!code) return;
    scanningRef.current = true;
    handleBarcode(code);
  };

  const handleRetry = () => {
    setManualCode('');
    startCamera();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 sm:p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md overflow-hidden border border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('barcode.title')}</h2>
          <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-xl">&times;</button>
        </div>

        <div className="p-4 space-y-4">
          {/* Camera view */}
          {status === 'camera' && (
            <>
              <div className="relative rounded-xl overflow-hidden bg-black min-h-[280px]">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                  style={{ minHeight: 280 }}
                />
                {/* Scan region overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[80%] h-[35%] border-2 border-white/60 rounded-lg">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-white/70 text-[11px] font-medium whitespace-nowrap">
                      {t('barcode.alignBarcode')}
                    </div>
                  </div>
                </div>

                {/* Camera controls overlay */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2">
                  {/* Torch toggle */}
                  {hasTorch && (
                    <button
                      onClick={toggleTorch}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${torchOn ? 'bg-yellow-400 text-gray-900' : 'bg-black/50 text-white/80 hover:bg-black/70'}`}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </button>
                  )}

                  {/* Zoom slider */}
                  {maxZoom > 1 && (
                    <div className="flex-1 flex items-center gap-2 bg-black/50 rounded-full px-3 py-1.5">
                      <span className="text-white/70 text-[10px] font-medium">1x</span>
                      <input
                        type="range"
                        min={1}
                        max={maxZoom}
                        step={0.1}
                        value={zoom}
                        onChange={(e) => applyZoom(parseFloat(e.target.value))}
                        className="flex-1 h-1 accent-white appearance-none bg-white/30 rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                      />
                      <span className="text-white/70 text-[10px] font-medium">{zoom.toFixed(1)}x</span>
                    </div>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">{t('barcode.hint')}</p>
            </>
          )}

          {/* Hidden container for html5-qrcode fallback */}
          <div id="barcode-fallback-region" className="hidden" />

          {/* Error — camera not available */}
          {status === 'error' && (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                </svg>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{t('barcode.cameraError')}</p>
            </div>
          )}

          {/* Loading */}
          {status === 'loading' && (
            <div className="text-center py-8 space-y-3">
              <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('barcode.lookingUp')}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">{scannedCode}</p>
            </div>
          )}

          {/* Not found */}
          {status === 'not-found' && (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 bg-amber-100 dark:bg-amber-500/20 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl">🔍</span>
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('barcode.notFound')}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">{scannedCode}</p>
              <button onClick={handleRetry} className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-medium min-h-[44px]">
                {t('barcode.tryAgain')}
              </button>
            </div>
          )}

          {/* Manual entry — always shown when not loading */}
          {(status === 'camera' || status === 'error' || status === 'not-found') && (
            <div className="border-t border-gray-100 dark:border-gray-800 pt-3">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{t('barcode.manualEntry')}</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualLookup()}
                  className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                  placeholder={t('barcode.enterBarcode')}
                />
                <button
                  onClick={handleManualLookup}
                  disabled={!manualCode.trim()}
                  className="px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors text-sm font-medium min-h-[44px] whitespace-nowrap"
                >
                  {t('barcode.lookup')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
