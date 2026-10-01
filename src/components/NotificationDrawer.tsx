import React from 'react';
import { Bell, X, Sparkles, ChevronRight, CheckCircle2 } from 'lucide-react';
import { PushAlert } from './PushNotificationBanner';
import { ListingItem } from '../types';
import { QualifiedLeadCard } from './QualifiedLeadCard';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: PushAlert[];
  onSelectItem: (item: ListingItem) => void;
  onClearAlerts: () => void;
  onStartChat?: (item: ListingItem) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  onSelectItem,
  onClearAlerts,
  onStartChat,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-250">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Notificações de Match</h3>
              <p className="text-[11px] text-slate-500">Cruzamentos automáticos do backend</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {alerts.length > 0 && (
              <button
                onClick={onClearAlerts}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Limpar
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Card em Destaque do Lead Qualificado para o Vendedor */}
          <QualifiedLeadCard
            buyerName="Carlos Mendes"
            buyerSearchSummary="Retroescavadeira JCB Usada"
            buyerMaxBudget={200000}
            sellerPrice={190000}
            compatibilityScore={95}
            buyerLocation="Paulínia, SP"
            onReleaseWhatsApp={() => {
              if (alerts[0]?.targetItem) {
                const phone = alerts[0].targetItem.userPhone.replace(/\D/g, '');
                window.open(`https://wa.me/55${phone}?text=Olá,%20vi%20seu%20interesse%20no%20app%20Eu%20Quero!`, '_blank');
              }
            }}
            onStartInAppChat={() => {
              if (alerts[0]?.targetItem && onStartChat) {
                onStartChat(alerts[0].targetItem);
                onClose();
              }
            }}
          />

          <div className="pt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Histórico de Notificações
            </span>

            {alerts.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                <p className="font-semibold text-slate-700">Nenhum outro alerta pendente</p>
              </div>
            ) : (
              alerts.map((al) => (
                <div
                  key={al.id}
                  onClick={() => {
                    onSelectItem(al.targetItem);
                    onClose();
                  }}
                  className="mb-2 p-3.5 bg-slate-50 hover:bg-orange-50/50 rounded-2xl border border-slate-200 hover:border-orange-200 transition-all cursor-pointer flex items-start gap-3 group"
                >
                  <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
                        Match Encontrado
                      </span>
                      <span className="text-[10px] text-slate-400">{al.timestamp}</span>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                      {al.title}
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                      {al.body}
                    </p>

                    <div className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-orange-600">
                      <span>Ver anúncio completo</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
