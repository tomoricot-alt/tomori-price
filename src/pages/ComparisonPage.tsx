import React, { useState } from 'react';
import {
  TrendingDown,
  Award,
  Store,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import type { ProductItem } from '../types';
import { buildComparisonGroups } from '../utils/comparison';

interface ComparisonPageProps {
  products: ProductItem[];
  onSelectProduct?: (product: ProductItem) => void;
}

export const ComparisonPage: React.FC<ComparisonPageProps> = ({ products }) => {
  const [comparisonMode, setComparisonMode] = useState<'similar' | 'exact'>('similar');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const groups = buildComparisonGroups(products, comparisonMode);

  const filteredGroups = selectedCategory === 'all'
    ? groups
    : groups.filter((g) => g.category === selectedCategory);

  return (
    <div className="pb-24 pt-3 px-4 max-w-md mx-auto space-y-4">
      {/* 比較モード切替タブ */}
      <div className="bg-white p-1 rounded-2xl border border-tomori-border grid grid-cols-2 shadow-sm">
        <button
          onClick={() => setComparisonMode('similar')}
          className={`py-2 text-xs font-bold rounded-xl transition-all ${
            comparisonMode === 'similar'
              ? 'bg-tomori-primary text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          類似商品で比較（おすすめ）
        </button>
        <button
          onClick={() => setComparisonMode('exact')}
          className={`py-2 text-xs font-bold rounded-xl transition-all ${
            comparisonMode === 'exact'
              ? 'bg-tomori-primary text-white shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          同一ブランド・商品で比較
        </button>
      </div>

      {/* 注意喚起・免責事項 */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-[11px] text-amber-900 flex items-start space-x-2">
        <InfoIcon className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
        <div className="space-y-0.5 leading-relaxed">
          <p className="font-bold">【価格情報に関するご確認】</p>
          <p>
            ※表示されている価格は登録時点の記録であり、現在の店頭価格を保証するものではありません。
          </p>
          <p>
            ※単価が安くても原材料・規格（エキストラバージン等の等級など）が異なる場合があります。品質の違いもあわせてご確認ください。
          </p>
        </div>
      </div>

      {/* カテゴリ絞り込み */}
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1 text-xs">
        {['all', '調味料・油', '麺類・パスタ', '米・パン・粉類', '飲料・お茶', 'その他'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition-all ${
              selectedCategory === cat
                ? 'bg-tomori-dark text-white shadow-sm'
                : 'bg-white text-gray-600 border border-tomori-border hover:bg-gray-50'
            }`}
          >
            {cat === 'all' ? 'すべて' : cat}
          </button>
        ))}
      </div>

      {/* 比較結果グループリスト */}
      {filteredGroups.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-xs text-gray-400 border border-tomori-border space-y-2">
          <TrendingDown className="w-8 h-8 text-gray-300 mx-auto" />
          <p>比較可能な商品データがまだありません。</p>
          <p className="text-[11px] text-gray-400">
            複数の店舗でオリーブオイルやパスタなどを登録すると、ここに単価比較表が表示されます。
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGroups.map((group, groupIdx) => (
            <div
              key={`${group.groupTitle}_${groupIdx}`}
              className="bg-white rounded-2xl p-4 shadow-sm border border-tomori-border space-y-3"
            >
              {/* グループヘッダー */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <div>
                  <div className="flex items-center space-x-1.5 mb-0.5">
                    <span className="text-[10px] font-bold bg-tomori-light text-tomori-primary px-1.5 py-0.5 rounded">
                      {group.category}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      基準: {group.standardUnitLabel}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-1">
                    <span>{group.groupTitle}</span>
                  </h3>
                </div>

                {group.maxPriceDiff > 0 && (
                  <div className="text-right">
                    <span className="text-[10px] text-gray-400 block">店舗間最大差</span>
                    <span className="text-xs font-bold text-rose-600">
                      ¥{group.maxPriceDiff} / {group.standardUnitLabel.replace('あたり', '')}
                    </span>
                  </div>
                )}
              </div>

              {/* 店舗別単価ランキング */}
              <div className="space-y-2.5">
                {group.items.map((item, rank) => {
                  const isTop = rank === 0;

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border transition-all ${
                        isTop
                          ? 'bg-amber-50/60 border-amber-300 shadow-sm'
                          : 'bg-tomori-bg/60 border-tomori-border'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-2.5 min-w-0 flex-1 pr-2">
                          {/* 順位バッジ */}
                          <div
                            className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5 ${
                              isTop
                                ? 'bg-amber-400 text-tomori-dark shadow'
                                : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {rank + 1}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center space-x-1 flex-wrap">
                              <span className="font-bold text-xs text-gray-800 flex items-center">
                                <Store className="w-3 h-3 mr-1 text-gray-500" />
                                {item.storeName}
                              </span>
                              {isTop && (
                                <span className="bg-amber-400/90 text-tomori-dark text-[9px] font-bold px-1.5 py-0.2 rounded-full flex items-center shadow-xs">
                                  <Award className="w-2.5 h-2.5 mr-0.5" />
                                  最安値！
                                </span>
                              )}
                            </div>

                            <h4 className="text-xs font-semibold text-gray-700 truncate mt-0.5">
                              {item.name}
                            </h4>

                            {item.memo && (
                              <p className="text-[10px] text-gray-500 truncate mt-0.5 italic">
                                特徴: {item.memo}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* 単価 ＆ 価格 */}
                        <div className="text-right flex-shrink-0">
                          <div
                            className={`text-sm font-bold ${
                              isTop ? 'text-tomori-primary' : 'text-gray-800'
                            }`}
                          >
                            ¥{item.standardUnitPrice.toLocaleString()}
                            <span className="text-[10px] font-normal text-gray-500">
                              {' '}/ {group.standardUnitLabel.replace('あたり', '')}
                            </span>
                          </div>

                          <div className="text-[10px] text-gray-500">
                            販売価格: ¥{item.taxIncludedPrice.toLocaleString()} ({item.amount}{item.unit})
                          </div>

                          {/* 最安値との価格差 */}
                          {!isTop && item.diffFromLowest > 0 && (
                            <div className="text-[10px] font-bold text-rose-600 mt-0.5">
                              +¥{item.diffFromLowest} / {group.standardUnitLabel.replace('あたり', '')} 高
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 記録日表示 */}
                      <div className="mt-2 pt-1.5 border-t border-gray-100/80 flex items-center justify-between text-[10px] text-gray-400">
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          記録日: {new Date(item.recordedAt).toLocaleDateString('ja-JP')}
                        </span>
                        {item.brand && (
                          <span className="truncate max-w-[150px]">
                            ブランド: {item.brand}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function InfoIcon(props: React.SVGProps<SVGSVGElement>) {
  return <AlertCircle {...props} />;
}
