import React, { useState, useEffect } from 'react';
import {
  X,
  QrCode,
  Printer,
  Calendar,
  MapPin,
  Clock,
  User,
  ShieldCheck,
  AlertTriangle,
  Wrench,
  CheckCircle2,
  PoundSterling,
  Share2,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { EquipmentItem, EquipmentCondition } from '../../types';
import { useApp } from '../../context/AppContext';
import { generateAssetQRCode, generateBarcodeSVG } from '../../utils/qrCodeGenerator';

interface EquipmentDetailModalProps {
  item: EquipmentItem | null;
  onClose: () => void;
  onOpenCheckOut: (item: EquipmentItem) => void;
  onOpenCheckIn: (item: EquipmentItem) => void;
  onFlagMaintenance: (item: EquipmentItem) => void;
}

export const EquipmentDetailModal: React.FC<EquipmentDetailModalProps> = ({
  item,
  onClose,
  onOpenCheckOut,
  onOpenCheckIn,
  onFlagMaintenance,
}) => {
  const { auditLogs, currentUser, hasPermission } = useApp();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (item) {
      generateAssetQRCode(item.id).then((url) => setQrDataUrl(url));
    }
  }, [item]);

  if (!item) return null;

  const canCheckout = hasPermission('can_checkout_checkin');
  const canMaint = hasPermission('can_manage_maintenance');
  const canPrint = hasPermission('can_manage_equipment') || hasPermission('can_manage_master_data');

  const itemAuditLogs = auditLogs.filter(
    (l) => l.assetId.toLowerCase().includes(item.id.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'checked_out':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      case 'in_maintenance':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'reserved':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  const getConditionColor = (cond: EquipmentCondition) => {
    switch (cond) {
      case 'mint':
        return 'text-emerald-400';
      case 'good':
        return 'text-sky-400';
      case 'fair':
        return 'text-amber-400';
      case 'needs_attention':
      case 'damaged':
        return 'text-rose-400';
      default:
        return 'text-slate-400';
    }
  };

  const handleCopyTag = () => {
    navigator.clipboard.writeText(item.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrintLabel = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Asset Tag - ${item.id}</title>
          <style>
            body { font-family: sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #fff; }
            .tag { border: 2px solid #000; border-radius: 8px; padding: 16px; width: 280px; text-align: center; }
            .church { font-size: 11px; text-transform: uppercase; font-weight: 800; letter-spacing: 1px; color: #333; margin-bottom: 4px; }
            .id { font-size: 20px; font-weight: 900; font-family: monospace; margin: 4px 0; color: #000; }
            .name { font-size: 13px; font-weight: bold; margin-bottom: 8px; }
            .qr { width: 140px; height: 140px; margin: 8px auto; }
            .meta { font-size: 10px; color: #555; margin-top: 6px; }
          </style>
        </head>
        <body>
          <div class="tag">
            <div class="church">Grace Community Church Media & Comms</div>
            <div class="id">${item.id}</div>
            <div class="name">${item.name}</div>
            <img class="qr" src="${qrDataUrl}" alt="QR" />
            <div class="meta">${item.location} | S/N: ${item.serialNumber}</div>
          </div>
          <script>window.onload = function() { window.print(); window.close(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 p-5 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/30">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-sky-400">
                  {item.id}
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${getStatusBadge(
                    item.status
                  )}`}
                >
                  {item.status.replace('_', ' ')}
                </span>
                <span className="text-xs text-slate-400">|</span>
                <span className="text-xs text-slate-300">{item.category}</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white mt-0.5">
                {item.name}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Quick Actions Row */}
          <div className="flex flex-wrap items-center gap-2.5 p-3 rounded-xl bg-slate-850 border border-slate-800">
            {canCheckout && item.status === 'available' && (
              <button
                onClick={() => {
                  onClose();
                  onOpenCheckOut(item);
                }}
                className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-sky-500 transition shadow-sm cursor-pointer"
              >
                <ArrowRight className="h-3.5 w-3.5" />
                <span>Check Out to Volunteer/Team</span>
              </button>
            )}

            {canCheckout && item.status === 'checked_out' && (
              <button
                onClick={() => {
                  onClose();
                  onOpenCheckIn(item);
                }}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition shadow-sm cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Check In / Return Equipment</span>
              </button>
            )}

            {canMaint && (
              <button
                onClick={() => {
                  onClose();
                  onFlagMaintenance(item);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition cursor-pointer"
              >
                <Wrench className="h-3.5 w-3.5 text-amber-400" />
                <span>Flag Maintenance</span>
              </button>
            )}

            {canPrint && (
              <button
                onClick={handlePrintLabel}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5 text-sky-400" />
                <span>Print Asset Label</span>
              </button>
            )}

            <button
              onClick={handleCopyTag}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>{copied ? 'Copied ID!' : 'Copy ID'}</span>
            </button>
          </div>

          {/* Currently Checked Out Details Alert */}
          {item.status === 'checked_out' && (
            <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-4">
              <div className="flex items-center justify-between text-xs font-semibold text-sky-300">
                <span className="flex items-center gap-1.5">
                  <User className="h-4 w-4" /> Currently Checked Out To
                </span>
                <span className="font-mono text-slate-300">
                  Due: {item.dueAt ? new Date(item.dueAt).toLocaleDateString() : 'Next Service'}
                </span>
              </div>
              <div className="mt-2 text-sm font-bold text-white">
                {item.assignedTo} ({item.borrowerDepartment || 'Media Team'})
              </div>
              <p className="mt-1 text-xs text-slate-300">
                Purpose: <span className="text-white font-medium">{item.checkoutEvent || 'Program Operation'}</span>
              </p>
            </div>
          )}

          {/* Grid of Key Properties & QR Label Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Properties */}
            <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-850/50 p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Equipment Details
              </h3>

              <div className="grid grid-cols-2 gap-y-2.5 text-xs">
                <div>
                  <span className="text-slate-400">Brand & Model:</span>
                  <p className="font-medium text-white">{item.brand} {item.model}</p>
                </div>
                <div>
                  <span className="text-slate-400">Serial Number:</span>
                  <p className="font-mono text-white">{item.serialNumber}</p>
                </div>
                <div>
                  <span className="text-slate-400">Permanent Location:</span>
                  <p className="font-medium text-white flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-sky-400 shrink-0" />
                    <span>{item.location}</span>
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Physical Condition:</span>
                  <p className={`font-semibold capitalize ${getConditionColor(item.condition)}`}>
                    {item.condition.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Replacement Cost:</span>
                  <p className="font-mono font-bold text-emerald-400">
                    £{item.replacementCost.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Lifetime Checkouts:</span>
                  <p className="font-semibold text-white">{item.totalCheckoutsCount} times</p>
                </div>
                <div>
                  <span className="text-slate-400">Last Audited:</span>
                  <p className="text-slate-200">{item.lastAuditedDate} by {item.lastAuditedBy || 'Staff'}</p>
                </div>
                <div>
                  <span className="text-slate-400">Next Service Due:</span>
                  <p className="text-amber-400">{item.nextMaintenanceDate}</p>
                </div>
              </div>

              {item.notes && (
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-xs text-slate-400">Internal Operational Notes:</span>
                  <p className="text-xs text-slate-200 mt-0.5 italic">"{item.notes}"</p>
                </div>
              )}
            </div>

            {/* QR Code & Barcode Physical Label Preview */}
            <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-white p-4 text-slate-900 shadow-inner">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                Church Media Asset QR Tag
              </span>
              <span className="font-mono text-sm font-black text-slate-900 mt-0.5">
                {item.id}
              </span>

              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={item.id}
                  className="my-2 h-32 w-32 rounded border border-slate-200 bg-white p-1"
                />
              ) : (
                <div className="my-2 h-32 w-32 bg-slate-100 flex items-center justify-center">
                  <QrCode className="h-10 w-10 text-slate-400" />
                </div>
              )}

              <p className="text-center text-[11px] font-bold text-slate-800 truncate max-w-[200px]">
                {item.name}
              </p>
              <p className="text-center text-[9px] text-slate-500">
                Scan with any smartphone or Sanctuary scanner
              </p>
            </div>
          </div>

          {/* Audit History for this Item */}
          <div className="rounded-xl border border-slate-800 bg-slate-850/50 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Item Audit Trail & Usage History ({itemAuditLogs.length})
            </h3>

            {itemAuditLogs.length === 0 ? (
              <p className="text-xs text-slate-500 py-2">No transaction logs recorded yet.</p>
            ) : (
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {itemAuditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-lg border border-slate-800 bg-slate-900/60 p-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-200 capitalize">
                        {log.action.replace('_', ' ')}: {log.userName}
                      </span>
                      <span className="font-mono text-slate-400">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-300 mt-1">{log.details}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-800 bg-slate-900/90 p-4">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
