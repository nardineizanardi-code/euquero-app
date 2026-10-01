import React, { useEffect, useState } from 'react';
import { Bell, X, ChevronRight, Sparkles } from 'lucide-react';
import { ListingItem } from '../types';

export interface PushAlert {
  id: string;
  title: string;
  body: string;
  targetItem: ListingItem;
  timestamp: string;
}

interface PushNotificationBannerProps {
  alert: PushAlert | null;
  onDismiss: () => void;
  onOpenItem: (item: ListingItem) => void;
}

/**
 * Simula a notificação push nativa (iOS / Android) que aparece no topo do celular
 * quando o backend cruza os dados nos bastidores.
 */
export const PushNotificationBanner: React.FC<PushNotificationBannerProps> = ({
  alert,
  onDismiss,
  onOpenItem,
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (alert) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 300);
      }, 7000); // 7s auto-dismiss
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [alert, onDismiss]);

  if (!alert) return null;

  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md transition-all duration-300 transform ${
        visible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-6 opacity-0 scale-95 pointer-events-none'
      }`}
    >
      <div
        onClick={() => {
          onOpenItem(alert.targetItem);
          onDismiss();
        }}
        className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700/80 cursor-pointer hover:bg-slate-850 active:scale-[0.99] transition-all flex items-start gap-3"
      >
        <div className="w-9 h-9 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-md">
          <Bell className="w-5 h-5 animate-bounce" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Eu Quero Match
            </span>
            <span className="text-[10px] text-slate-400">Agora</span>
          </div>

          <h4 className="text-xs font-bold text-white truncate">
            {alert.title}
          </h4>
          <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">
            {alert.body}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0 self-center">
          <ChevronRight className="w-4 h-4 text-slate-400" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className="p-1 text-slate-400 hover:text-white rounded-md transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
