import React from 'react';
import { Home, Camera, List, TrendingDown, ShoppingBag, Settings } from 'lucide-react';

export type TabType = 'home' | 'capture' | 'products' | 'comparison' | 'shopping' | 'settings';

interface NavigationProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  shoppingCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onChangeTab,
  shoppingCount = 0,
}) => {
  const tabs = [
    { id: 'home' as TabType, label: 'ホーム', icon: Home },
    { id: 'capture' as TabType, label: '撮影・登録', icon: Camera, highlight: true },
    { id: 'products' as TabType, label: '商品一覧', icon: List },
    { id: 'comparison' as TabType, label: '価格比較', icon: TrendingDown },
    { id: 'shopping' as TabType, label: '買い物', icon: ShoppingBag, badge: shoppingCount },
    { id: 'settings' as TabType, label: '設定', icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-tomori-border z-40 pb-[env(safe-area-inset-bottom)] shadow-lg">
      <div className="max-w-md mx-auto grid grid-cols-6 h-16">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.highlight) {
            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className="relative flex flex-col items-center justify-center -top-3 group transition-transform active:scale-95"
                aria-label={tab.label}
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                    isActive
                      ? 'bg-tomori-primary text-white ring-4 ring-tomori-light'
                      : 'bg-tomori-accent text-white group-hover:bg-tomori-primary'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span
                  className={`text-[10px] font-medium mt-0.5 ${
                    isActive ? 'text-tomori-primary font-bold' : 'text-gray-500'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className="relative flex flex-col items-center justify-center pt-1 transition-colors active:scale-95"
              aria-label={tab.label}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'text-tomori-primary scale-110' : 'text-gray-400 group-hover:text-gray-600'
                  }`}
                />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2 bg-amber-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow-sm">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                ) : null}
              </div>
              <span
                className={`text-[10px] mt-1 truncate ${
                  isActive ? 'text-tomori-primary font-bold' : 'text-gray-500'
                }`}
              >
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-tomori-primary" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
