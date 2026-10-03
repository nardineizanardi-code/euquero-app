import React from 'react';
import { ListingItem } from '../types';
import { ProductDetail } from './ProductDetail';
import { ProcuraPublicaDetail } from './ProcuraPublicaDetail';

interface ItemDetailModalProps {
  item: ListingItem | null;
  onClose: () => void;
  onOpenChat: (item: ListingItem) => void;
  isVideoUnlocked?: boolean;
  onUnlockVideo?: (item: ListingItem) => void;
  onEdit?: (item: ListingItem) => void;
  onDelete?: (item: ListingItem) => void;
  onTogglePause?: (item: ListingItem) => void;
  allListings?: ListingItem[];
  onTenhoEssaMaquina?: (item: ListingItem) => void;
  onSelectProcura?: (item: ListingItem) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  onClose,
  onOpenChat,
  isVideoUnlocked = false,
  onUnlockVideo,
  onEdit,
  onDelete,
  onTogglePause,
  allListings = [],
  onTenhoEssaMaquina,
  onSelectProcura,
}) => {
  if (!item) return null;

  const isBuyer = item.intent === 'buy';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl min-h-screen sm:min-h-0 my-auto">
        {isBuyer ? (
          <ProcuraPublicaDetail
            item={item}
            allListings={allListings}
            onClose={onClose}
            onTenhoEssaMaquina={onTenhoEssaMaquina || onOpenChat}
            onOpenSimilarProcura={onSelectProcura}
          />
        ) : (
          <ProductDetail
            item={item}
            onClose={onClose}
            onOpenChat={onOpenChat}
            isVideoUnlocked={isVideoUnlocked}
            onUnlockVideo={onUnlockVideo}
            onEdit={onEdit}
            onDelete={onDelete}
            onTogglePause={onTogglePause}
          />
        )}
      </div>
    </div>
  );
};
