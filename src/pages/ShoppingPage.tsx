import React, { useState } from 'react';
import {
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  Store,
  ShoppingCart,
  AlertTriangle,
} from 'lucide-react';
import type { ShoppingItem, ProductCategory, ProductItem } from '../types';

interface ShoppingPageProps {
  items: ShoppingItem[];
  products: ProductItem[];
  onSaveItem: (item: ShoppingItem) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
}

export const ShoppingPage: React.FC<ShoppingPageProps> = ({
  items,
  products,
  onSaveItem,
  onDeleteItem,
}) => {
  const [newItemName, setNewItemName] = useState<string>('');
  const [newCategory] = useState<ProductCategory>('その他');
  const [newQuantity, setNewQuantity] = useState<number>(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [groupByStore, setGroupByStore] = useState<boolean>(false);

  // 新規アイテム追加
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    // 既存商品データベースから最安値店舗を自動参照
    const matchingProducts = products
      .filter((p) => p.name.includes(newItemName.trim()) || newItemName.trim().includes(p.name))
      .sort((a, b) => a.standardUnitPrice - b.standardUnitPrice);

    const bestMatch = matchingProducts[0];

    const item: ShoppingItem = {
      id: `shop_${Date.now()}`,
      name: newItemName.trim(),
      category: bestMatch ? bestMatch.category : newCategory,
      quantity: newQuantity || 1,
      completed: false,
      suggestedStore: bestMatch ? bestMatch.storeName : undefined,
      lowestUnitPrice: bestMatch ? bestMatch.standardUnitPrice : undefined,
      lowestPrice: bestMatch ? bestMatch.taxIncludedPrice : undefined,
      photoUrl: bestMatch ? bestMatch.photoUrl : undefined,
      createdAt: new Date().toISOString(),
    };

    await onSaveItem(item);
    setNewItemName('');
    setNewQuantity(1);
  };

  // チェックトグル
  const handleToggleComplete = async (item: ShoppingItem) => {
    await onSaveItem({
      ...item,
      completed: !item.completed,
    });
  };

  const handleConfirmDelete = async () => {
    if (deletingId) {
      await onDeleteItem(deletingId);
      setDeletingId(null);
    }
  };

  const uncompleted = items.filter((i) => !i.completed);
  const completed = items.filter((i) => i.completed);

  return (
    <div className="pb-24 pt-3 px-4 max-w-md mx-auto space-y-4">
      {/* 追加フォーム */}
      <form onSubmit={handleAddItem} className="bg-white rounded-2xl p-4 shadow-sm border border-tomori-border space-y-3">
        <h3 className="text-xs font-bold text-gray-800 flex items-center space-x-1.5">
          <ShoppingCart className="w-4 h-4 text-tomori-primary" />
          <span>買うものを追加</span>
        </h3>

        <div className="flex space-x-2">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="例: オリーブオイル, パスタ 1kg..."
            className="flex-1 bg-tomori-bg border border-tomori-border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-tomori-primary"
          />
          <div className="w-20">
            <input
              type="number"
              min="1"
              value={newQuantity}
              onChange={(e) => setNewQuantity(parseInt(e.target.value, 10) || 1)}
              placeholder="数量"
              className="w-full bg-tomori-bg border border-tomori-border rounded-xl px-2.5 py-2 text-xs text-center font-bold focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="bg-tomori-primary hover:bg-tomori-dark text-white p-2.5 rounded-xl shadow active:scale-95 transition-transform"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-gray-400">
          ※過去に登録した商品データから最安値店舗を自動提案します
        </p>
      </form>

      {/* リストヘッダー */}
      <div className="flex items-center justify-between text-xs text-gray-500 px-1">
        <span>買うもの: <strong className="text-gray-800">{uncompleted.length}</strong> 件</span>
        <button
          onClick={() => setGroupByStore(!groupByStore)}
          className={`px-2 py-1 rounded-lg text-[11px] font-medium border ${
            groupByStore
              ? 'bg-tomori-light text-tomori-primary border-tomori-primary'
              : 'bg-white text-gray-600 border-tomori-border'
          }`}
        >
          {groupByStore ? '店舗別まとめ中' : '店舗別にまとめる'}
        </button>
      </div>

      {/* 買うものリスト */}
      {items.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-xs text-gray-400 border border-tomori-border">
          買い物リストは空です。上から追加してください。
        </div>
      ) : (
        <div className="space-y-2">
          {uncompleted.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl p-3.5 shadow-sm border border-tomori-border flex items-center justify-between space-x-3 hover:border-gray-300 transition-colors"
            >
              <button
                type="button"
                onClick={() => handleToggleComplete(item)}
                className="text-gray-300 hover:text-emerald-600 flex-shrink-0 transition-colors"
              >
                <Circle className="w-6 h-6" />
              </button>

              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="text-xs font-bold text-gray-900 truncate">{item.name}</h4>
                  <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded font-semibold">
                    x{item.quantity}
                  </span>
                </div>

                {item.suggestedStore ? (
                  <div className="flex items-center space-x-2 text-[10px] text-emerald-800 bg-emerald-50/70 border border-emerald-200/60 rounded px-1.5 py-0.5 mt-1 w-fit">
                    <Store className="w-3 h-3 text-emerald-700" />
                    <span>最安店: <strong>{item.suggestedStore}</strong></span>
                    {item.lowestUnitPrice && (
                      <span>(¥{item.lowestUnitPrice}/100g等)</span>
                    )}
                  </div>
                ) : (
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    カテゴリ: {item.category}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setDeletingId(item.id)}
                className="text-gray-400 hover:text-rose-500 p-1 flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}

          {/* 購入済みリスト */}
          {completed.length > 0 && (
            <div className="pt-4 space-y-2">
              <h4 className="text-xs font-bold text-gray-400 px-1">
                購入済み ({completed.length})
              </h4>
              {completed.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-50/80 rounded-2xl p-3 border border-gray-200/60 flex items-center justify-between space-x-3 opacity-60"
                >
                  <button
                    type="button"
                    onClick={() => handleToggleComplete(item)}
                    className="text-emerald-600 flex-shrink-0"
                  >
                    <CheckCircle2 className="w-6 h-6" />
                  </button>

                  <div className="flex-1 min-w-0 line-through text-gray-500 text-xs">
                    {item.name} (x{item.quantity})
                  </div>

                  <button
                    type="button"
                    onClick={() => setDeletingId(item.id)}
                    className="text-gray-400 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 削除確認モーダル */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-3 shadow-xl">
            <div className="flex items-center space-x-2 text-rose-600">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <h4 className="font-bold text-sm text-gray-900">買い物アイテムの削除確認</h4>
            </div>
            <p className="text-xs text-gray-600">
              このアイテムを買い物リストから削除しますか？
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="bg-gray-100 text-gray-700 font-semibold text-xs py-2 rounded-xl"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="bg-rose-600 text-white font-bold text-xs py-2 rounded-xl shadow"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
