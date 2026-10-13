import React, { useState, useMemo } from 'react';
import {
  ClipboardList,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Wifi,
  WifiOff,
  RefreshCw,
  Sparkles,
  Search,
  Check,
  X,
  FileSpreadsheet,
  Layers,
  Clock,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useApp } from '../../context/AppContext';
import { EquipmentCondition, EquipmentItem } from '../../types';

interface AuditViewProps {
  onOpenScanner: () => void;
}

export const AuditView: React.FC<AuditViewProps> = ({ onOpenScanner }) => {
  const {
    equipment,
    currentUser,
    isOnline,
    forcedOffline,
    toggleForcedOffline,
    pendingOfflineAudits,
    recordAuditScan,
    syncPendingAudits,
    clearPendingAudits,
  } = useApp();

  const [selectedLocation, setSelectedLocation] = useState('Main Sanctuary Sound Booth');
  const [quickScanInput, setQuickScanInput] = useState('');
  const [scannedAssetIds, setScannedAssetIds] = useState<string[]>([]);
  const [inspectedCondition, setInspectedCondition] = useState<EquipmentCondition>('good');
  const [auditNotes, setAuditNotes] = useState('');
  const [lastScanMessage, setLastScanMessage] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Distinct church venue locations
  const venueLocations = [
    'Main Sanctuary Sound Booth',
    'Main Sanctuary Sanctuary Balcony',
    'Main Sanctuary Lighting Truss A',
    'Video Control Room / Center Platform',
    'Video Control Room Rack 1',
    'Media Office Safe',
    'Media Office Dry Cabinet A',
    'Media Office Dry Cabinet B',
    'Media Studio A Storage',
    'Youth Chapel Stage Rack',
    'Stage Storage Locker A',
    'Stage Storage Locker C',
    'Fellowship Hall AV Closet',
  ];

  // Equipment expected in the selected location
  const expectedItems = useMemo(() => {
    return equipment.filter((e) => e.location === selectedLocation);
  }, [equipment, selectedLocation]);

  // Verified items scanned during this audit session
  const verifiedCount = expectedItems.filter((e) => scannedAssetIds.includes(e.id)).length;
  const missingCount = expectedItems.length - verifiedCount;
  const progressPercent = expectedItems.length > 0 ? Math.round((verifiedCount / expectedItems.length) * 100) : 100;

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickScanInput.trim()) return;

    processAssetScan(quickScanInput.trim());
    setQuickScanInput('');
  };

  const processAssetScan = (assetCode: string) => {
    const item = equipment.find(
      (e) =>
        e.id.toLowerCase() === assetCode.toLowerCase() ||
        e.barcode.toLowerCase() === assetCode.toLowerCase() ||
        e.serialNumber.toLowerCase() === assetCode.toLowerCase()
    );

    if (!item) {
      setLastScanMessage(`Asset "${assetCode}" not found in church inventory.`);
      return;
    }

    const result = recordAuditScan(
      item.id,
      selectedLocation,
      inspectedCondition,
      auditNotes.trim()
    );

    setScannedAssetIds((prev) => (prev.includes(item.id) ? prev : [...prev, item.id]));
    setLastScanMessage(result.message);

    // If all expected items in this room are completed, fire celebratory confetti
    if (verifiedCount + 1 >= expectedItems.length) {
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // Confetti fallback
      }
    }
  };

  const handleTriggerSync = async () => {
    if (pendingOfflineAudits.length === 0 || !isOnline) return;
    setIsSyncing(true);
    try {
      const count = await syncPendingAudits();
      try {
        confetti({
          particleCount: 80,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // Confetti fallback
      }
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Walk-Around Inventory Audit
            </h1>
            <span className="rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 px-2.5 py-0.5 text-xs font-semibold">
              Offline-Sync Ready
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Physical room-by-room hardware verification with instant discrepancy detection
          </p>
        </div>

        {/* Offline Toggle & Sync Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={toggleForcedOffline}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
              isOnline
                ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/40'
                : 'border-amber-500/40 bg-amber-950/60 text-amber-300 animate-pulse'
            }`}
          >
            {isOnline ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
            <span>{isOnline ? 'Online (Direct Sync)' : 'Simulated Offline Mode'}</span>
          </button>

          {pendingOfflineAudits.length > 0 && (
            <button
              onClick={handleTriggerSync}
              disabled={!isOnline || isSyncing}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition shadow-sm ${
                isOnline
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 cursor-pointer'
                  : 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed opacity-60'
              }`}
            >
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync {pendingOfflineAudits.length} Offline Scans</span>
            </button>
          )}
        </div>
      </div>

      {/* Offline Status Callout Banner */}
      {!isOnline && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-4 text-xs text-amber-200 flex items-start gap-3">
          <WifiOff className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-white text-sm">Operating in Offline Walk-Around Mode</h4>
            <p className="mt-0.5 text-amber-200/90">
              Ideal for remote church storage closets, sound booths, or outdoor trailers with zero Wi-Fi signal.
              Every scanned item is cryptographically queued in local browser storage. When you return to network range, click "Sync" to update the central database.
            </p>
          </div>
        </div>
      )}

      {/* Audit Setup & Location Selector */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Location Selection & Scan Input */}
        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              1. Select Church Venue / Room
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => {
                setSelectedLocation(e.target.value);
                setScannedAssetIds([]);
                setLastScanMessage(null);
              }}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
            >
              {venueLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Scan Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              2. Scan or Enter Asset Tag
            </label>
            <form onSubmit={handleScanSubmit} className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={quickScanInput}
                  onChange={(e) => setQuickScanInput(e.target.value)}
                  placeholder="e.g. AUD-MIC-01"
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none uppercase font-mono"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500 transition shadow-sm"
                >
                  Verify
                </button>
              </div>

              <button
                type="button"
                onClick={onOpenScanner}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 py-2 text-xs font-medium text-slate-200 hover:bg-slate-750 transition"
              >
                <QrCode className="h-4 w-4 text-sky-400" />
                <span>Open Camera Scanner</span>
              </button>
            </form>
          </div>

          {/* Verified Condition Setting */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Mark Inspected Condition:
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['mint', 'good', 'fair'] as EquipmentCondition[]).map((cond) => (
                <button
                  key={cond}
                  type="button"
                  onClick={() => setInspectedCondition(cond)}
                  className={`rounded-lg py-1.5 text-[11px] font-medium capitalize text-center border transition ${
                    inspectedCondition === cond
                      ? 'border-sky-500 bg-sky-500/20 text-sky-300 font-bold'
                      : 'border-slate-800 bg-slate-850 text-slate-400 hover:text-white'
                  }`}
                >
                  {cond}
                </button>
              ))}
            </div>
          </div>

          {/* Last Scan Feedback Toast */}
          {lastScanMessage && (
            <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-3 text-xs text-sky-200 flex items-start gap-2">
              <Sparkles className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
              <span>{lastScanMessage}</span>
            </div>
          )}

          {/* Quick 1-Click Verification Chips for This Room */}
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Quick Test Verification:
            </span>
            <div className="space-y-1">
              {expectedItems.map((item) => {
                const isVerified = scannedAssetIds.includes(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => processAssetScan(item.id)}
                    className={`w-full flex items-center justify-between p-2 rounded-lg border text-left text-xs transition ${
                      isVerified
                        ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300 opacity-60'
                        : 'border-slate-800 bg-slate-850 text-slate-200 hover:border-sky-500'
                    }`}
                  >
                    <span className="font-mono font-bold">{item.id}</span>
                    <span className="truncate max-w-[140px] text-[11px] text-slate-400">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-sky-400 font-medium">
                      {isVerified ? '✓ Audited' : 'Tap to Audit'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Room Audit Checklist & Discrepancies */}
        <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg lg:col-span-2 flex flex-col justify-between">
          <div>
            {/* Room Progress Bar */}
            <div className="border-b border-slate-800 pb-4">
              <div className="flex items-center justify-between text-xs mb-2">
                <div>
                  <h3 className="font-bold text-white text-base">
                    {selectedLocation}
                  </h3>
                  <p className="text-slate-400 text-xs">
                    Auditor: <strong className="text-white">{currentUser.name}</strong> ({currentUser.role})
                  </p>
                </div>

                <div className="text-right">
                  <span className="font-bold text-lg text-emerald-400 font-mono">
                    {progressPercent}%
                  </span>
                  <span className="text-xs text-slate-400 block">
                    {verifiedCount} of {expectedItems.length} Audited
                  </span>
                </div>
              </div>

              <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-400 to-emerald-400 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Checklist Table */}
            <div className="mt-4 space-y-2 max-h-96 overflow-y-auto pr-1">
              {expectedItems.map((item) => {
                const isVerified = scannedAssetIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-3.5 flex items-center justify-between transition ${
                      isVerified
                        ? 'border-emerald-500/40 bg-emerald-950/20'
                        : 'border-slate-800 bg-slate-850/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                          isVerified
                            ? 'bg-emerald-500 text-slate-950 font-bold'
                            : 'bg-slate-800 text-slate-500'
                        }`}
                      >
                        {isVerified ? <Check className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                      </div>

                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-sky-400">
                            {item.id}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate">
                            {item.brand} {item.model}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-white truncate mt-0.5">
                          {item.name}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                        S/N: {item.serialNumber}
                      </span>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                          isVerified
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {isVerified ? 'Verified Present' : 'Pending Audit'}
                      </span>
                    </div>
                  </div>
                );
              })}

              {expectedItems.length === 0 && (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No assets currently assigned to this storage location.
                </div>
              )}
            </div>
          </div>

          {/* Pending Offline Scans Table if Any */}
          {pendingOfflineAudits.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Local Offline Sync Queue ({pendingOfflineAudits.length} items awaiting cloud sync)
                </span>
                <button
                  onClick={clearPendingAudits}
                  className="text-xs text-slate-500 hover:text-slate-300"
                >
                  Clear Queue
                </button>
              </div>

              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {pendingOfflineAudits.map((audit) => (
                  <div
                    key={audit.id}
                    className="flex items-center justify-between rounded-lg bg-slate-950 p-2 text-xs text-slate-300 border border-slate-800"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sky-400 font-bold">{audit.assetId}</span>
                      <span className="truncate max-w-[150px]">{audit.assetName}</span>
                    </div>
                    <span className="text-[10px] text-amber-400 font-medium">Pending Sync</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
