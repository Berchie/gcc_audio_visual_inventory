import React, { useState, useEffect } from 'react';
import { X, Printer, CheckSquare, Square, Tag, QrCode } from 'lucide-react';
import { EquipmentItem } from '../../types';
import { useApp } from '../../context/AppContext';
import { generateAssetQRCode } from '../../utils/qrCodeGenerator';

interface PrintLabelsModalProps {
  onClose: () => void;
}

export const PrintLabelsModal: React.FC<PrintLabelsModalProps> = ({ onClose }) => {
  const { equipment } = useApp();
  const [selectedIds, setSelectedIds] = useState<string[]>(
    equipment.slice(0, 8).map((e) => e.id)
  );
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [labelSize, setLabelSize] = useState<'standard' | 'compact'>('standard');

  useEffect(() => {
    // Generate QR codes for all selected items
    const generateAll = async () => {
      const results: Record<string, string> = {};
      for (const item of equipment) {
        if (selectedIds.includes(item.id)) {
          results[item.id] = await generateAssetQRCode(item.id);
        }
      }
      setQrCodes(results);
    };
    generateAll();
  }, [selectedIds, equipment]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedIds(equipment.map((e) => e.id));
  };

  const deselectAll = () => {
    setSelectedIds([]);
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedItems = equipment.filter((e) => selectedIds.includes(e.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-slate-900/90 no-print">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
              <Printer className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Print QR Asset Tag Stickers</h2>
              <p className="text-xs text-slate-400">
                Avery-compatible printable sheets for equipment labeling
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-850 p-4 no-print text-xs">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-300">
              {selectedIds.length} of {equipment.length} items selected
            </span>
            <button
              onClick={selectAll}
              className="text-sky-400 hover:underline font-medium"
            >
              Select All
            </button>
            <button
              onClick={deselectAll}
              className="text-slate-400 hover:underline font-medium"
            >
              Deselect All
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-800 rounded-lg p-1 border border-slate-700">
              <button
                onClick={() => setLabelSize('standard')}
                className={`rounded px-2.5 py-1 text-[11px] font-medium transition ${
                  labelSize === 'standard' ? 'bg-sky-600 text-white' : 'text-slate-300'
                }`}
              >
                Standard (2x3")
              </button>
              <button
                onClick={() => setLabelSize('compact')}
                className={`rounded px-2.5 py-1 text-[11px] font-medium transition ${
                  labelSize === 'compact' ? 'bg-sky-600 text-white' : 'text-slate-300'
                }`}
              >
                Compact (1.5x2")
              </button>
            </div>

            <button
              onClick={handlePrint}
              disabled={selectedIds.length === 0}
              className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 font-semibold text-white hover:bg-sky-500 transition disabled:opacity-50 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Print Sticker Sheet</span>
            </button>
          </div>
        </div>

        {/* Sheet Content Preview */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 print:grid-cols-2 print:gap-3">
            {selectedItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border-2 border-slate-700 bg-white p-3.5 text-slate-900 shadow-md flex flex-col justify-between print:border-black print-card relative"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                      Grace Community Church Media Dept
                    </span>
                    <h4 className="font-mono text-base font-black text-slate-950 leading-tight">
                      {item.id}
                    </h4>
                  </div>
                  <span className="rounded bg-slate-100 border border-slate-300 px-1.5 py-0.5 text-[9px] font-bold text-slate-700">
                    {item.category.slice(0, 10)}
                  </span>
                </div>

                <div className="my-2.5 flex items-center justify-center">
                  {qrCodes[item.id] ? (
                    <img
                      src={qrCodes[item.id]}
                      alt={item.id}
                      className="h-28 w-28 border border-slate-200 p-1"
                    />
                  ) : (
                    <div className="h-28 w-28 bg-slate-100 flex items-center justify-center">
                      <QrCode className="h-8 w-8 text-slate-400" />
                    </div>
                  )}
                </div>

                <div>
                  <p className="font-bold text-xs text-slate-900 truncate">
                    {item.name}
                  </p>
                  <div className="flex items-center justify-between text-[9px] text-slate-600 mt-1 pt-1 border-t border-slate-200">
                    <span className="truncate">{item.location}</span>
                    <span className="font-mono">{item.serialNumber}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedItems.length === 0 && (
            <div className="text-center py-12 text-slate-500 text-xs">
              No equipment selected for print sheet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
