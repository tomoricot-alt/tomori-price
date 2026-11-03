import React from 'react';
import { Camera, Mic, TrendingDown, ArrowRight, ShoppingCart, Tag, Store, Clock } from 'lucide-react';
import type { ProductItem, ShoppingItem } from '../types';
import type { TabType } from '../components/Navigation';

interface HomePageProps {
  products: ProductItem[];
  shoppingItems: ShoppingItem[];
  onChangeTab: (tab: TabType) => void;
  onSelectProduct: (product: ProductItem) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  products,
  shoppingItems,
  onChangeTab,
  onSelectProduct,
}) => {
  const recentProducts = products.slice(0, 5);
  const uncompletedShopping = shoppingItems.filter((i) => !i.completed);

  // 単価が計算されている商品の中で最安値ハイライト（お得感のある商品）
  const topDeals = [...products]
    .filter((p) => p.standardUnitPrice > 0)
    .sort((a, b) => a.standardUnitPrice - b.standardUnitPrice)
    .slice(0, 3);

  return (
    <div className="pb-24 pt-3 px-4 max-w-md mx-auto space-y-5">
      {/* ヒーローキャッチコピー */}
      <div className="bg-gradient-to-br from-tomori-primary to-tomori-dark rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
        <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="relative z-10">
          <span className="inline-block text-[11px] font-semibold tracking-wider text-amber-300 uppercase mb-1">
            TOMORI -CREATIVE OFFICE-
          </span>
          <h2 className="text-xl font-bold leading-tight mb-2">
            「撮るだけ、話すだけ。<br />
            いつもの買い物をもっと賢く。」
          </h2>
          <p className="text-xs text-tomori-light leading-relaxed mb-4">
            店頭の写真を撮影して店舗名を話すだけで、内容量を考慮した<strong className="text-amber-300 font-semibold">100gあたりの真の単価</strong>を自動計算＆比較します。
          </p>

          {/* クイックアクションボタン群 */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => onChangeTab('capture')}
              className="flex items-center justify-center space-x-2 bg-amber-400 hover:bg-amber-300 text-tomori-dark font-bold text-xs py-2.5 px-3 rounded-xl shadow transition-transform active:scale-95"
            >
              <Camera className="w-4 h-4 text-tomori-dark" />
              <span>写真で登録</span>
            </button>
            <button
              onClick={() => onChangeTab('capture')}
              className="flex items-center justify-center space-x-2 bg-white/15 hover:bg-white/20 text-white font-semibold text-xs py-2.5 px-3 rounded-xl border border-white/20 transition-transform active:scale-95 backdrop-blur-sm"
            >
              <Mic className="w-4 h-4 text-amber-300" />
              <span>音声入力</span>
            </button>
          </div>
        </div>
      </div>

      {/* 買い物リスト概要 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-tomori-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-tomori-text">買い物リスト</h3>
            {uncompletedShopping.length > 0 && (
              <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                {uncompletedShopping.length} 件
              </span>
            )}
          </div>
          <button
            onClick={() => onChangeTab('shopping')}
            className="text-xs text-tomori-accent hover:text-tomori-primary flex items-center font-medium"
          >
            一覧を見る
            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>

        {uncompletedShopping.length === 0 ? (
          <div className="text-center py-4 text-xs text-gray-400 bg-tomori-bg rounded-xl">
            現在、買うものリストは空です
          </div>
        ) : (
          <div className="space-y-2">
            {uncompletedShopping.slice(0, 3).map((item) => (
              <div
                key={item.id}
                onClick={() => onChangeTab('shopping')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-tomori-bg hover:bg-tomori-sand/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-semibold text-gray-800">{item.name}</span>
                </div>
                {item.suggestedStore && (
                  <span className="text-[10px] text-tomori-muted bg-white px-2 py-0.5 rounded border border-gray-200">
                    最安: {item.suggestedStore}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 最安値速報・単価ハイライト */}
      {topDeals.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-tomori-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <TrendingDown className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm text-tomori-text">記録済みの最安単価</h3>
            </div>
            <button
              onClick={() => onChangeTab('comparison')}
              className="text-xs text-tomori-accent hover:text-tomori-primary flex items-center font-medium"
            >
              比較表へ
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {topDeals.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectProduct(item)}
                className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/60 hover:border-amber-400 transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <span className="text-[10px] text-amber-800 font-semibold bg-amber-200/60 px-1.5 py-0.5 rounded">
                    {item.category}
                  </span>
                  <h4 className="text-xs font-bold text-gray-800 truncate mt-1">{item.name}</h4>
                  <div className="flex items-center space-x-2 text-[11px] text-gray-500 mt-0.5">
                    <span className="flex items-center truncate">
                      <Store className="w-3 h-3 mr-0.5 text-gray-400" />
                      {item.storeName}
                    </span>
                    <span>•</span>
                    <span>{item.amount}{item.unit}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-tomori-primary">
                    ¥{item.standardUnitPrice.toLocaleString()}
                    <span className="text-[10px] text-gray-500 font-normal"> / {item.standardUnitLabel.replace('あたり', '')}</span>
                  </div>
                  <div className="text-[10px] text-gray-400">
                    店頭: ¥{item.taxIncludedPrice.toLocaleString()} (税込)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 最近登録した商品 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-tomori-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-tomori-light text-tomori-primary flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-tomori-text">最近登録した商品</h3>
          </div>
          <button
            onClick={() => onChangeTab('products')}
            className="text-xs text-tomori-accent hover:text-tomori-primary flex items-center font-medium"
          >
            全件表示 ({products.length})
            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </div>

        {recentProducts.length === 0 ? (
          <div className="text-center py-6 text-xs text-gray-400 bg-tomori-bg rounded-xl">
            まだ登録された商品がありません。<br />
            「写真で登録」または「音声入力」から追加してください。
          </div>
        ) : (
          <div className="space-y-2">
            {recentProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => onSelectProduct(p)}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-tomori-bg transition-colors border border-transparent hover:border-tomori-border cursor-pointer"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  {p.photoUrl ? (
                    <img
                      src={p.photoUrl}
                      alt={p.name}
                      className="w-11 h-11 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-lg bg-tomori-sand flex items-center justify-center text-tomori-muted flex-shrink-0">
                      <Tag className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-gray-800 truncate">{p.name}</h4>
                    <p className="text-[11px] text-gray-500 truncate">
                      {p.storeName} ({p.amount}{p.unit})
                    </p>
                  </div>
                </div>

                <div className="text-right pl-2">
                  <div className="text-xs font-bold text-gray-900">
                    ¥{p.taxIncludedPrice.toLocaleString()}
                    <span className="text-[10px] font-normal text-gray-500"> (税込)</span>
                  </div>
                  {p.standardUnitPrice > 0 && (
                    <div className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                      ¥{p.standardUnitPrice} / {p.standardUnitLabel.replace('あたり', '')}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
