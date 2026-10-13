import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  QrCode,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Volume2,
  VolumeX,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { EquipmentItem } from '../../types';
import { useApp } from '../../context/AppContext';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onItemSelected: (item: EquipmentItem) => void;
  onCheckOutDirect?: (item: EquipmentItem) => void;
  onCheckInDirect?: (item: EquipmentItem) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onItemSelected,
  onCheckOutDirect,
  onCheckInDirect,
}) => {
  const { equipment } = useApp();

  const [manualCode, setManualCode] = useState('');
  const [scannedItem, setScannedItem] = useState<EquipmentItem | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Play audio beep on scan using Web Audio API
  const playScanBeep = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      // AudioContext may be restricted before user gesture
    }
  };

  // Start camera when modal opens
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setScannedItem(null);
      setManualCode('');
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera API not accessible in this environment.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: unknown) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError('Camera access not available. Use the rapid test presets or manual input below.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  // Process code payload
  const handleCodeDetected = (code: string) => {
    const clean = code.trim().toLowerCase();
    const match = equipment.find(
      (e) =>
        e.id.toLowerCase() === clean ||
        e.barcode.toLowerCase() === clean ||
        e.serialNumber.toLowerCase() === clean
    );

    if (match) {
      playScanBeep();
      setScannedItem(match);
    } else {
      setCameraError(`Unrecognized asset code: "${code}"`);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleCodeDetected(manualCode);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-4 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">QR & Barcode Scanner</h2>
              <p className="text-xs text-slate-400">
                Scan asset labels on camera or test with quick simulation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="rounded-lg p-1.5 text-slate-400 hover:text-white"
              title={soundEnabled ? 'Mute beep' : 'Enable beep'}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Viewfinder Window */}
        <div className="p-4 sm:p-5 space-y-4">
          <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-slate-950 border-2 border-slate-800 flex items-center justify-center">
            {cameraActive ? (
              <video
                ref={videoRef}
                playsInline
                muted
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="text-center p-6 space-y-2">
                <Camera className="mx-auto h-10 w-10 text-slate-600 animate-pulse" />
                <p className="text-xs text-slate-400 font-medium">
                  {cameraError || 'Camera initializing or running in simulated preview'}
                </p>
                <button
                  onClick={startCamera}
                  className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs text-sky-400 hover:bg-slate-700"
                >
                  Retry Camera
                </button>
              </div>
            )}

            {/* Target Laser Overlay Box */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
              <div className="relative h-44 w-44 rounded-lg border-2 border-sky-400/70 shadow-[0_0_15px_rgba(56,189,248,0.3)]">
                {/* Corner accents */}
                <div className="absolute -top-1 -left-1 h-3 w-3 border-t-2 border-l-2 border-sky-400" />
                <div className="absolute -top-1 -right-1 h-3 w-3 border-t-2 border-r-2 border-sky-400" />
                <div className="absolute -bottom-1 -left-1 h-3 w-3 border-b-2 border-l-2 border-sky-400" />
                <div className="absolute -bottom-1 -right-1 h-3 w-3 border-b-2 border-r-2 border-sky-400" />

                {/* Sweeping Laser Line Animation */}
                <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_8px_#f43f5e] animate-bounce" />
              </div>
            </div>
          </div>

          {/* Quick Simulation Presets (Super helpful for instant browser testing!) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Zap className="h-3 w-3 text-amber-400" /> Rapid Test Barcodes
              </span>
              <span className="text-[10px] text-slate-500">Click to simulate scan</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {equipment.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleCodeDetected(item.id)}
                  className="rounded-lg border border-slate-700 bg-slate-850 px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:border-sky-500 hover:bg-sky-500/10 hover:text-sky-300 transition"
                >
                  <span className="font-mono font-bold text-sky-400 mr-1">{item.id}</span>
                  <span className="text-slate-400">({item.name.slice(0, 16)}...)</span>
                </button>
              ))}
            </div>
          </div>

          {/* Manual Code Input Bar */}
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Enter Asset ID or Serial (e.g. AUD-MIC-01)"
              className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none uppercase font-mono"
            />
            <button
              type="submit"
              className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500 transition"
            >
              Lookup
            </button>
          </form>

          {/* Scanned Item Found Drawer */}
          {scannedItem && (
            <div className="rounded-xl border-2 border-emerald-500/40 bg-emerald-950/20 p-4 space-y-3 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-emerald-500/20 p-1.5 text-emerald-400">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="font-mono text-xs font-bold text-emerald-400">
                      {scannedItem.id}
                    </span>
                    <h4 className="text-sm font-bold text-white leading-tight">
                      {scannedItem.name}
                    </h4>
                  </div>
                </div>
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-300 border border-slate-700">
                  {scannedItem.status.replace('_', ' ')}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg">
                <div>
                  <span className="text-[10px] text-slate-400 block">Location:</span>
                  <span className="font-medium text-white">{scannedItem.location}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Condition:</span>
                  <span className="font-medium capitalize text-emerald-400">
                    {scannedItem.condition}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {scannedItem.status === 'available' && onCheckOutDirect && (
                  <button
                    onClick={() => {
                      onClose();
                      onCheckOutDirect(scannedItem);
                    }}
                    className="flex-1 rounded-xl bg-sky-600 py-2 text-xs font-semibold text-white hover:bg-sky-500 transition shadow-sm text-center"
                  >
                    Check Out to Person
                  </button>
                )}

                {scannedItem.status === 'checked_out' && onCheckInDirect && (
                  <button
                    onClick={() => {
                      onClose();
                      onCheckInDirect(scannedItem);
                    }}
                    className="flex-1 rounded-xl bg-emerald-600 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-sm text-center"
                  >
                    Check In / Return
                  </button>
                )}

                <button
                  onClick={() => {
                    onClose();
                    onItemSelected(scannedItem);
                  }}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
                >
                  View Full Specs
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
