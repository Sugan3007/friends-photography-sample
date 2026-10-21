import React, { useState } from 'react';
import { X, Check, Trash2, Plus, DollarSign, Clock, Sparkles } from 'lucide-react';
import { PricingPackage } from '../types/index';
import { studioStore } from '../services/studioStore';

interface EditPackageModalProps {
  pkg: PricingPackage | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (updated: PricingPackage) => void;
  onDeleted?: (id: string) => void;
}

export const EditPackageModal: React.FC<EditPackageModalProps> = ({
  pkg,
  isOpen,
  onClose,
  onSaved,
  onDeleted,
}) => {
  if (!isOpen || !pkg) return null;

  const [name, setName] = useState(pkg.name);
  const [price, setPrice] = useState(pkg.price);
  const [duration, setDuration] = useState(pkg.duration);
  const [tagline, setTagline] = useState(pkg.tagline);
  const [popular, setPopular] = useState(Boolean(pkg.popular));
  const [deliverables, setDeliverables] = useState<string[]>(pkg.deliverables || []);
  const [newDeliverable, setNewDeliverable] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleAddDeliverable = () => {
    if (!newDeliverable.trim()) return;
    setDeliverables([...deliverables, newDeliverable.trim()]);
    setNewDeliverable('');
  };

  const handleRemoveDeliverable = (idx: number) => {
    setDeliverables(deliverables.filter((_, i) => i !== idx));
  };

  const handleDeliverableChange = (idx: number, val: string) => {
    const updated = [...deliverables];
    updated[idx] = val;
    setDeliverables(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price.trim()) return;

    try {
      setIsSaving(true);
      const updated = await studioStore.updatePackage(pkg.id, {
        name: name.trim(),
        price: price.trim(),
        duration: duration.trim(),
        tagline: tagline.trim(),
        popular,
        deliverables: deliverables.filter((d) => d.trim().length > 0),
      });

      if (updated && onSaved) {
        onSaved(updated);
      }
      onClose();
    } catch (err) {
      console.error('Failed to update package:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${pkg.name}"?`)) return;
    try {
      setIsSaving(true);
      await studioStore.deletePackage(pkg.id);
      if (onDeleted) onDeleted(pkg.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete package:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/40">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <DollarSign className="w-4 h-4" />
            </span>
            <h3 className="font-serif text-base font-semibold text-white">Edit Studio Package</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Package Name */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1">
              Package Title
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 text-xs focus:outline-none focus:border-amber-400 font-serif"
            />
          </div>

          {/* Price & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1">
                Price (e.g. $3,800)
              </label>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-amber-300 font-semibold text-sm focus:outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1">
                Duration / Scope
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 text-xs focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Popular Choice Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-stone-950/60 border border-stone-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-stone-200">Featured / Popular Badge</span>
            </div>
            <button
              type="button"
              onClick={() => setPopular(!popular)}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                popular ? 'bg-amber-500' : 'bg-stone-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  popular ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Tagline */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1">
              Description / Tagline
            </label>
            <textarea
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 text-xs focus:outline-none focus:border-amber-400"
            />
          </div>

          {/* Deliverables List */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-400 mb-1">
              Deliverables & Inclusions
            </label>
            <div className="space-y-2 mb-2">
              {deliverables.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleDeliverableChange(idx, e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-stone-950 border border-stone-700 rounded-lg text-stone-200 text-xs focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveDeliverable(idx)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Deliverable */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newDeliverable}
                onChange={(e) => setNewDeliverable(e.target.value)}
                placeholder="Add new deliverable..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddDeliverable();
                  }
                }}
                className="flex-1 px-3 py-1.5 bg-stone-950 border border-stone-800 rounded-lg text-stone-200 text-xs focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={handleAddDeliverable}
                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs font-medium transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Package</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs tracking-wider uppercase transition-colors shadow-md disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving…' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
