import React, { useState, useEffect, useRef } from 'react';
import { Pencil, Check, X, Loader2 } from 'lucide-react';
import { studioStore } from '../services/studioStore';

interface EditableTextProps {
  textKey: string;
  defaultText?: string;
  isAdmin?: boolean;
  multiline?: boolean;
  className?: string;
  inputClassName?: string;
  pencilClassName?: string;
  as?: React.ElementType;
  onSave?: (newValue: string) => Promise<void> | void;
  children?: React.ReactNode;
}

export const EditableText: React.FC<EditableTextProps> = ({
  textKey,
  defaultText = '',
  isAdmin = false,
  multiline = false,
  className = '',
  inputClassName = '',
  pencilClassName = '',
  as: Tag = 'span',
  onSave,
  children,
}) => {
  // Read value from store or fallback
  const storeValue = studioStore.getSiteText(textKey, defaultText);
  const displayValue = storeValue || defaultText || (typeof children === 'string' ? children : '');

  const [isEditing, setIsEditing] = useState(false);
  const [draftValue, setDraftValue] = useState(displayValue);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  // Sync draft when storeValue changes externally
  useEffect(() => {
    if (!isEditing) {
      setDraftValue(displayValue);
    }
  }, [displayValue, isEditing]);

  // Focus and select text when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDraftValue(displayValue);
    setIsEditing(true);
  };

  const handleCancel = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    setDraftValue(displayValue);
    setIsEditing(false);
  };

  const handleSave = async (e?: React.MouseEvent | React.FormEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    const clean = draftValue.trim();
    if (!clean) return;

    try {
      setIsSaving(true);
      if (onSave) {
        await onSave(clean);
      } else {
        await studioStore.updateSiteText(textKey, clean);
      }
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save editable text:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter' && (!multiline || e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  // Non-admin view: simple text
  if (!isAdmin) {
    return <Tag className={className}>{children || displayValue}</Tag>;
  }

  // Admin view - actively editing
  if (isEditing) {
    return (
      <div
        className="relative inline-flex flex-col gap-1.5 w-full my-1 z-30"
        onClick={(e) => e.stopPropagation()}
      >
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={draftValue}
            onChange={(e) => setDraftValue(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            disabled={isSaving}
            className={`w-full p-2.5 bg-stone-900 border-2 border-amber-400 rounded-xl text-stone-100 text-xs shadow-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all font-sans ${inputClassName}`}
            placeholder="Enter text..."
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            value={draftValue}
            onChange={(e) => setDraftValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSaving}
            className={`w-full px-2.5 py-1.5 bg-stone-900 border-2 border-amber-400 rounded-xl text-stone-100 text-xs shadow-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40 transition-all font-sans ${inputClassName}`}
            placeholder="Enter text..."
          />
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 self-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-[11px] shadow-md transition-colors disabled:opacity-50"
            title="Save changes (Enter)"
          >
            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            <span>Save</span>
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 font-medium text-[11px] transition-colors"
            title="Cancel (Esc)"
          >
            <X className="w-3 h-3" />
            <span>Cancel</span>
          </button>
        </div>
      </div>
    );
  }

  // Admin view - hover/clickable with pencil badge
  return (
    <Tag
      className={`group relative inline-flex items-center gap-1.5 rounded transition-all cursor-pointer hover:bg-amber-500/10 px-1 -mx-1 ${className}`}
      onClick={handleStartEdit}
      title="Click to edit (Admin Mode)"
    >
      <span>{children || displayValue}</span>
      <button
        type="button"
        onClick={handleStartEdit}
        className={`inline-flex items-center justify-center p-1 rounded-md bg-amber-500/20 group-hover:bg-amber-500 group-hover:text-stone-950 text-amber-400 border border-amber-500/40 opacity-80 group-hover:opacity-100 transition-all shrink-0 shadow-sm ${pencilClassName}`}
        aria-label={`Edit ${textKey}`}
        title="Edit text"
      >
        <Pencil className="w-2.5 h-2.5" />
      </button>
    </Tag>
  );
};
