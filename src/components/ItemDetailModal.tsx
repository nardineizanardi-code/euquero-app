import React from 'react';
import { ListingItem } from '../types';
import { ProductDetail } from './ProductDetail';

interface ItemDetailModalProps {
  item: ListingItem | null;
  onClose: () => void;
  onOpenChat: (item: ListingItem) => void;
  isVideoUnlocked?: boolean;
  onUnlockVideo?: (item: ListingItem) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  onClose,
  onOpenChat,
  isVideoUnlocked = false,
  onUnlockVideo,
}) => {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl min-h-screen sm:min-h-0 my-auto">
        <ProductDetail
          item={item}
          onClose={onClose}
          onOpenChat={onOpenChat}
          isVideoUnlocked={isVideoUnlocked}
          onUnlockVideo={onUnlockVideo}
        />
      </div>
    </div>
  );
};
