import React, { useState } from 'react';
import { X, Plus, Save, Tag, MapPin, PoundSterling, Wrench } from 'lucide-react';
import { EquipmentItem, EquipmentCategory, EquipmentCondition, EquipmentStatus } from '../../types';
import { useApp } from '../../context/AppContext';
import { ItemImageField } from './ItemImageField';

interface AddEditEquipmentModalProps {
  itemToEdit?: EquipmentItem | null;
  onClose: () => void;
}

export const AddEditEquipmentModal: React.FC<AddEditEquipmentModalProps> = ({
  itemToEdit,
  onClose,
}) => {
  const { addEquipment, updateEquipment, equipment, categories: dynamicCategories, locations: dynamicLocations } = useApp();

  const isEditing = Boolean(itemToEdit);

  // Form state
  const [id, setId] = useState(itemToEdit?.id || '');
  const [name, setName] = useState(itemToEdit?.name || '');
  const [category, setCategory] = useState<EquipmentCategory>(itemToEdit?.category || 'Audio');
  const [subCategory, setSubCategory] = useState(itemToEdit?.subCategory || 'Wireless Microphones');
  const [brand, setBrand] = useState(itemToEdit?.brand || '');
  const [model, setModel] = useState(itemToEdit?.model || '');
  const [serialNumber, setSerialNumber] = useState(itemToEdit?.serialNumber || '');
  const [location, setLocation] = useState(itemToEdit?.location || 'Main Sanctuary Sound Booth');
  const [status, setStatus] = useState<EquipmentStatus>(itemToEdit?.status || 'available');
  const [condition, setCondition] = useState<EquipmentCondition>(itemToEdit?.condition || 'good');
  const [purchaseDate, setPurchaseDate] = useState(
    itemToEdit?.purchaseDate || new Date().toISOString().slice(0, 10)
  );
  const [replacementCost, setReplacementCost] = useState(itemToEdit?.replacementCost || 500);
  const [maintenanceIntervalDays, setMaintenanceIntervalDays] = useState(
    itemToEdit?.maintenanceIntervalDays || 60
  );
  const [imageUrl, setImageUrl] = useState(itemToEdit?.imageUrl || '');
  const [notes, setNotes] = useState(itemToEdit?.notes || '');
  const [error, setError] = useState('');

  // Auto-generate ID if empty
  const handleAutoGenerateId = () => {
    let prefix = 'AUD';
    if (category.startsWith('Video')) prefix = 'VID';
    if (category.startsWith('Lighting')) prefix = 'LGT';
    if (category.startsWith('Computing')) prefix = 'CMP';
    if (category.startsWith('Cables')) prefix = 'CAB';
    if (category.startsWith('Staging')) prefix = 'STG';

    const count = equipment.filter((e) => e.category === category).length + 1;
    const padded = count.toString().padStart(2, '0');
    setId(`${prefix}-AST-${padded}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim() || !name.trim() || !brand.trim() || !model.trim()) {
      setError('Please fill in all required fields (ID, Name, Brand, Model).');
      return;
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const nextMaintenanceStr = new Date(
      Date.now() + maintenanceIntervalDays * 24 * 60 * 60 * 1000
    )
      .toISOString()
      .slice(0, 10);

    if (isEditing && itemToEdit) {
      updateEquipment({
        ...itemToEdit,
        name: name.trim(),
        category,
        subCategory: subCategory.trim(),
        brand: brand.trim(),
        model: model.trim(),
        serialNumber: serialNumber.trim(),
        barcode: id.trim(),
        location,
        status,
        condition,
        purchaseDate,
        replacementCost: Number(replacementCost) || 0,
        maintenanceIntervalDays: Number(maintenanceIntervalDays) || 60,
        imageUrl: imageUrl.trim() || undefined,
        notes: notes.trim(),
      });
    } else {
      // Check ID uniqueness
      if (equipment.some((eq) => eq.id.toLowerCase() === id.trim().toLowerCase())) {
        setError(`Asset ID "${id}" is already used by another item.`);
        return;
      }

      addEquipment({
        id: id.trim().toUpperCase(),
        name: name.trim(),
        category,
        subCategory: subCategory.trim(),
        brand: brand.trim(),
        model: model.trim(),
        serialNumber: serialNumber.trim(),
        barcode: id.trim().toUpperCase(),
        location,
        status,
        condition,
        purchaseDate,
        replacementCost: Number(replacementCost) || 0,
        maintenanceIntervalDays: Number(maintenanceIntervalDays) || 60,
        lastMaintenanceDate: todayStr,
        nextMaintenanceDate: nextMaintenanceStr,
        lastAuditedDate: todayStr,
        imageUrl: imageUrl.trim() || undefined,
        notes: notes.trim(),
      });
    }

    onClose();
  };

  const categoryNames = dynamicCategories && dynamicCategories.length > 0
    ? dynamicCategories.map((c) => c.name)
    : [
        'Audio',
        'Video & Cameras',
        'Lighting',
        'Computing & Media',
        'Cables & Interconnects',
        'Staging & Rigging',
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
              {isEditing ? <Save className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isEditing ? `Edit Asset: ${itemToEdit?.id}` : 'Add New Equipment Asset'}
              </h2>
              <p className="text-xs text-slate-400">
                Register media hardware into church central inventory
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

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-2.5 text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* ID and Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Asset ID / Barcode *
                </label>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={handleAutoGenerateId}
                    className="text-[10px] text-sky-400 hover:text-sky-300"
                  >
                    Auto Generate
                  </button>
                )}
              </div>
              <input
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                disabled={isEditing}
                required
                placeholder="e.g. AUD-MIC-05"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white uppercase font-mono placeholder-slate-500 focus:border-sky-500 focus:outline-none disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EquipmentCategory)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
              >
                {categoryNames.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Item Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Descriptive Item Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Shure Beta 58A Supercardioid Dynamic Mic"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* Brand, Model, Serial */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Brand *
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                required
                placeholder="Shure, Sony, Blackmagic"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Model *
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                required
                placeholder="Beta 58A"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Serial Number
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="SN-998124"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Location, Condition, Status */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Default Location *
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-sky-500 focus:outline-none"
              >
                {dynamicLocations && dynamicLocations.length > 0 ? (
                  dynamicLocations.map((l) => (
                    <option key={l.id} value={l.name}>
                      {l.name}
                    </option>
                  ))
                ) : (
                  <option value="Main Sanctuary Sound Booth">Main Sanctuary Sound Booth</option>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Condition
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as EquipmentCondition)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white capitalize focus:border-sky-500 focus:outline-none"
              >
                <option value="mint">Mint</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="needs_attention">Needs Attention</option>
                <option value="damaged">Damaged</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EquipmentStatus)}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white capitalize focus:border-sky-500 focus:outline-none"
              >
                <option value="available">Available</option>
                <option value="checked_out">Checked Out</option>
                <option value="in_maintenance">In Maintenance</option>
                <option value="reserved">Reserved</option>
                <option value="retired">Retired</option>
              </select>
            </div>
          </div>

          {/* Cost & Maintenance Interval */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Replacement Cost (£ GBP)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">£</span>
                <input
                  type="number"
                  min="0"
                  value={replacementCost}
                  onChange={(e) => setReplacementCost(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 pl-7 pr-3 py-2 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Maintenance Interval (Days)
              </label>
              <input
                type="number"
                min="7"
                max="365"
                value={maintenanceIntervalDays}
                onChange={(e) => setMaintenanceIntervalDays(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white font-mono focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Equipment Photo Picker & Online Search */}
          <ItemImageField
            imageUrl={imageUrl}
            onChange={setImageUrl}
            itemName={name}
            category={category}
            brand={brand}
            model={model}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Internal Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              placeholder="e.g. Purchased with 2024 tech enhancement grant. Keep in dedicated shock mount."
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-500 transition shadow-sm"
            >
              <Save className="h-4 w-4" />
              <span>{isEditing ? 'Save Changes' : 'Create Asset Tag'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
