import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { lookupBarcode, OpenFoodFactsProduct } from '../api/openFoodFacts';

interface Props {
  onResult: (product: OpenFoodFactsProduct) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onResult, onClose }: Props) {
  const { t } = useTranslation();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'camera' | 'loading' | 'not-found' | 'error'>('camera');
  const [scannedCode, setScannedCode] = useState('');
  const [manualCode, setManualCode] = useState('');
  const stoppedRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    stoppedRef.current = false;

    const barcodeFormats = [
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.UPC_E,
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.CODE_39,
    ];
    const scanner = new Html5Qrcode(el.id, { formatsToSupport: barcodeFormats, verbose: false });
    scannerRef.current = scanner;

    const qrboxFn = (vw: number, vh: number) => ({
      width: Math.min(vw * 0.85, 350),
      height: Math.min(vh * 0.4, 180),
    });

    scanner
      .start(
        { facingMode: 'environment', advanced: [{ focusMode: 'continuous' } as any] },
        { fps: 15, qrbox: qrboxFn, aspectRatio: 1.333 },
        (decodedText) => {
          if (stoppedRef.current) return;
          stoppedRef.current = true;
          scanner.stop().catch(() => {});
          handleBarcode(decodedText);
        },
        () => {},
      )
      .catch(() => {
        setStatus('error');
      });

    return () => {
      stoppedRef.current = true;
      try {
        const state = scanner.getState();
        if (state === 2 /* SCANNING */ || state === 3 /* PAUSED */) {
          scanner.stop().catch(() => {});
        }
      } catch {
        // scanner was never started or already cleared
      }
    };
  }, []);

  const handleBarcode = async (code: string) => {
    setScannedCode(code);
    setStatus('loading');
    try {
      const product = await lookupBarcode(code);
      if (stoppedRef.current) return; // component unmounted
      if (product && product.name) {
        onResult(product);
      } else {
        setStatus('not-found');
      }
    } catch {
      if (!stoppedRef.current) setStatus('not-found');
    }
  };

  const handleManualLookup = () => {
    const code = manualCode.trim();
    if (!code) return;
    handleBarcode(code);
  };

  const handleRetry = () => {
    setStatus('camera');
    setScannedCode('');
    stoppedRef.current = false;
    const el = containerRef.current;
    if (!el || !scannerRef.current) return;
    const qrboxFn = (vw: number, vh: number) => ({
      width: Math.min(vw * 0.85, 350),
      height: Math.min(vh * 0.4, 180),
    });
    scannerRef.current
      .start(
        { facingMode: 'environment', advanced: [{ focusMode: 'continuous' } as any] },
        { fps: 15, qrbox: qrboxFn, aspectRatio: 1.333 },
        (decodedText) => {
          if (stoppedRef.current) return;
          stoppedRef.current = true;
          scannerRef.current?.stop().catch(() => {});
          handleBarcode(decodedText);
        },
        () => {},
      )
      .catch(() => setStatus('error'));
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
              <div id="barcode-scanner-region" ref={containerRef} className="rounded-xl overflow-hidden bg-black min-h-[250px]" />
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">{t('barcode.hint')}</p>
            </>
          )}

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
