import { Modal } from '../ui/Modal';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  sessionTitle?: string;
}

export function DeleteSessionModal({ isOpen, onClose, onConfirm, sessionTitle }: DeleteSessionModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} width={400}>
      <div className="relative p-7 text-center">
        {/* Header with Icon */}
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-400/10 text-red-400">
          <AlertTriangle className="h-7 w-7" />
        </div>

        <h3 className="mb-2 font-syne text-xl font-bold tracking-tight text-white">
          Delete Conversation?
        </h3>
        
        <p className="mb-8 font-dm-sans text-sm leading-relaxed text-[#6b7a99]">
          Are you sure you want to delete <span className="font-semibold text-[#e8edf5]">"{sessionTitle || 'this chat'}"</span>? 
          All messages will be permanently removed.
          <br /><br />
          <span className="rounded-sm bg-indigo-500/10 px-1.5 py-0.5 text-[0.7rem] font-bold text-indigo-300 ring-1 ring-inset ring-indigo-500/20 uppercase tracking-wider">Note</span>
          <span className="ml-2 text-[0.75rem] text-[#6b7a99]">
            Saved queries and dashboard visualizations will <strong>NOT</strong> be affected.
          </span>
        </p>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 cursor-pointer rounded-xl border border-white/5 bg-white/5 py-2.5 font-dm-sans text-sm font-semibold text-[#6b7a99] transition-all hover:bg-white/10 hover:text-[#e8edf5]"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-500/90 py-2.5 font-dm-sans text-sm font-bold text-white shadow-xl shadow-red-500/10 transition-all hover:bg-red-500 hover:shadow-red-500/25"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 cursor-pointer p-1 text-[#6b7a99] transition-colors hover:text-[#e8edf5]"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </Modal>
  );
}
