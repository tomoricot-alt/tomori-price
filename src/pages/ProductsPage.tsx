import React, { useState, useMemo } from 'react';
import {
  Search,
  Tag,
  Trash2,
  Edit2,
  PlusCircle,
  Store,
  Calendar,
  X,
  AlertTriangle,
  ZoomIn,
} from 'lucide-react';
import type { ProductItem, ProductUnit } from '../types';
import { calculateUnitPrice } from '../utils/pricing';

interface ProductsPageProps {
  products: ProductItem[];
  onUpdateProduct: (product: ProductItem) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onAddToShoppingList: (product: ProductItem) => Promise<void>;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({
  products,
  onUpdateProduct,
  onDeleteProduct,
  onAddToShoppingList,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStore, setSelectedStore] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date-desc' | 'unit-price-asc' | 'price-asc'>('date-desc');

  // 編集モーダル
  const [editingItem, setEditingItem] = useState<ProductItem | null>(null);
  // 削除確認モーダル
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // 画像拡大モーダル
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // ユニークな店舗リスト
  const storeList = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.storeName) set.add(p.storeName);
    });
    return Array.from(set);
  }, [products]);

  // フィルタリング & ソート
  const filteredProducts = useMemo(() => {
    return products
      .filter((item) => {
        // 検索クエリ
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const matchName = item.name.toLowerCase().includes(q);
          const matchBrand = (item.brand || '').toLowerCase().includes(q);
          const matchStore = (item.storeName || '').toLowerCase().includes(q);
          const matchCategory = item.category.toLowerCase().includes(q);
          if (!matchName && !matchBrand && !matchStore && !matchCategory) return false;
        }

        // カテゴリ
        if (selectedCategory !== 'all' && item.category !== selectedCategory) {
          return false;
        }

        // 店舗
        if (selectedStore !== 'all' && item.storeName !== selectedStore) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date-desc') {
          return new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime();
        }
        if (sortBy === 'unit-price-asc') {
          // 単価未設定は末尾へ
          const aPrice = a.standardUnitPrice > 0 ? a.standardUnitPrice : 999999;
          const bPrice = b.standardUnitPrice > 0 ? b.standardUnitPrice : 999999;
          return aPrice - bPrice;
        }
        if (sortBy === 'price-asc') {
          return a.taxIncludedPrice - b.taxIncludedPrice;
        }
        return 0;
      });
  }, [products, searchQuery, selectedCategory, selectedStore, sortBy]);

  // 編集保存ハンドラー
  const handleSaveEdit = async () => {
    if (!editingItem) return;
    const pricing = calculateUnitPrice(
      editingItem.price,
      editingItem.amount,
      editingItem.unit,
      editingItem.isTaxIncluded,
      editingItem.taxRate
    );

    const updated: ProductItem = {
      ...editingItem,
      taxIncludedPrice: pricing.taxIncludedPrice,
      standardUnitPrice: pricing.standardUnitPrice,
      standardUnitLabel: pricing.standardUnitLabel,
      unitType: pricing.unitType,
      updatedAt: new Date().toISOString(),
    };

    await onUpdateProduct(updated);
    setEditingItem(null);
  };

  const handleConfirmDelete = async () => {
    if (deletingId) {
      await onDeleteProduct(deletingId);
      setDeletingId(null);
    }
  };

  return (
    <div className="pb-24 pt-3 px-4 max-w-md mx-auto space-y-4">
      {/* 検索バー */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="商品名、メーカー、店舗で検索..."
          className="w-full bg-white border border-tomori-border rounded-xl pl-10 pr-9 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-tomori-primary shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* フィルター＆ソートコントロール */}
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1 text-xs">
        {/* カテゴリ */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="bg-white border border-tomori-border rounded-lg px-2.5 py-1.5 font-medium text-gray-700 focus:outline-none shadow-sm"
        >
          <option value="all">すべてのカテゴリ</option>
          <option value="調味料・油">調味料・油</option>
          <option value="麺類・パスタ">麺類・パスタ</option>
          <option value="米・パン・粉類">米・パン・粉類</option>
          <option value="肉・魚">肉・魚</option>
          <option value="野菜・果物">野菜・果物</option>
          <option value="乳製品・卵">乳製品・卵</option>
          <option value="飲料・お茶">飲料・お茶</option>
          <option value="菓子・スナック">菓子・スナック</option>
          <option value="その他">その他</option>
        </select>

        {/* 店舗 */}
        <select
          value={selectedStore}
          onChange={(e) => setSelectedStore(e.target.value)}
          className="bg-white border border-tomori-border rounded-lg px-2.5 py-1.5 font-medium text-gray-700 focus:outline-none shadow-sm"
        >
          <option value="all">すべての店舗</option>
          {storeList.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>

        {/* ソート */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="bg-white border border-tomori-border rounded-lg px-2.5 py-1.5 font-medium text-gray-700 focus:outline-none shadow-sm flex-shrink-0"
        >
          <option value="date-desc">登録日順</option>
          <option value="unit-price-asc">単価が安い順</option>
          <option value="price-asc">価格が安い順</option>
        </select>
      </div>

      {/* 件数表示 */}
      <div className="flex items-center justify-between text-xs text-gray-500 px-1">
        <span>該当商品: <strong className="text-gray-800">{filteredProducts.length}</strong> 件</span>
      </div>

      {/* 商品一覧カード */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-xs text-gray-400 border border-tomori-border space-y-2">
          <p>該当する商品が見つかりませんでした。</p>
          <p className="text-[11px] text-gray-400">検索条件を変更するか、新しく登録してください。</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-2xl p-3.5 shadow-sm border border-tomori-border space-y-2 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start space-x-3">
                {/* サムネイル */}
                {p.photoUrl ? (
                  <div
                    onClick={() => setPreviewPhoto(p.photoUrl || null)}
                    className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 cursor-pointer flex-shrink-0 group bg-gray-100"
                  >
                    <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <ZoomIn className="w-4 h-4 text-white" />
                    </div>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-tomori-sand flex items-center justify-center text-gray-400 flex-shrink-0">
                    <Tag className="w-6 h-6" />
                  </div>
                )}

                {/* メイン詳細 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1.5 mb-0.5">
                    <span className="text-[10px] font-bold bg-tomori-light text-tomori-primary px-1.5 py-0.5 rounded">
                      {p.category}
                    </span>
                    {p.brand && (
                      <span className="text-[10px] text-gray-500 font-medium truncate">
                        {p.brand}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xs font-bold text-gray-900 leading-snug line-clamp-2">
                    {p.name}
                  </h3>
                  <div className="flex items-center space-x-2 text-[11px] text-gray-500 mt-1">
                    <span className="flex items-center truncate">
                      <Store className="w-3 h-3 mr-0.5 text-gray-400" />
                      {p.storeName}
                    </span>
                    <span>•</span>
                    <span>{p.amount}{p.unit}</span>
                  </div>
                </div>
              </div>

              {/* 価格・単価ライン */}
              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-gray-900">
                    ¥{p.taxIncludedPrice.toLocaleString()}
                    <span className="text-[10px] font-normal text-gray-500">
                      {' '}({p.isTaxIncluded ? '税込' : `税抜¥${p.price} / 込¥${p.taxIncludedPrice}`})
                    </span>
                  </div>
                </div>

                {p.standardUnitPrice > 0 && (
                  <div className="text-right">
                    <div className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/60 px-2 py-0.5 rounded-lg inline-block">
                      ¥{p.standardUnitPrice.toLocaleString()}
                      <span className="text-[10px] font-medium text-emerald-700"> / {p.standardUnitLabel.replace('あたり', '')}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* アクションバー */}
              <div className="pt-1.5 flex items-center justify-between text-[11px] text-gray-400">
                <span className="flex items-center text-[10px]">
                  <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                  {new Date(p.recordedAt).toLocaleDateString('ja-JP')} 記録
                </span>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onAddToShoppingList(p)}
                    className="p-1.5 text-gray-500 hover:text-emerald-700 rounded-lg hover:bg-emerald-50 flex items-center space-x-0.5"
                    title="買い物リストに追加"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span className="text-[10px]">買う</span>
                  </button>
                  <button
                    onClick={() => setEditingItem(p)}
                    className="p-1.5 text-gray-500 hover:text-tomori-primary rounded-lg hover:bg-tomori-light"
                    title="編集"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingId(p.id)}
                    className="p-1.5 text-gray-500 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                    title="削除"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 編集モーダル */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-3 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-gray-900">商品情報の編集</h4>
              <button onClick={() => setEditingItem(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-[10px] font-bold text-gray-500 block mb-1">商品名</label>
              <input
                type="text"
                value={editingItem.name}
                onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                className="w-full bg-tomori-bg border border-tomori-border rounded-lg px-2.5 py-1.5 text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-gray-500 block mb-1">メーカー / ブランド</label>
                <input
                  type="text"
                  value={editingItem.brand || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, brand: e.target.value })}
                  className="w-full bg-tomori-bg border border-tomori-border rounded-lg px-2.5 py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 block mb-1">店舗名</label>
                <input
                  type="text"
                  value={editingItem.storeName}
                  onChange={(e) => setEditingItem({ ...editingItem, storeName: e.target.value })}
                  className="w-full bg-tomori-bg border border-tomori-border rounded-lg px-2.5 py-1.5 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-gray-500 block mb-1">内容量</label>
                <input
                  type="number"
                  value={editingItem.amount}
                  onChange={(e) => setEditingItem({ ...editingItem, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-tomori-bg border border-tomori-border rounded-lg px-2.5 py-1.5 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 block mb-1">単位</label>
                <select
                  value={editingItem.unit}
                  onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value as ProductUnit })}
                  className="w-full bg-tomori-bg border border-tomori-border rounded-lg px-2.5 py-1.5 text-xs"
                >
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                  <option value="ml">ml</option>
                  <option value="L">L</option>
                  <option value="個">個</option>
                  <option value="本">本</option>
                  <option value="パック">パック</option>
                  <option value="枚">枚</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-gray-500 block mb-1">価格 (円)</label>
                <input
                  type="number"
                  value={editingItem.price}
                  onChange={(e) => setEditingItem({ ...editingItem, price: parseInt(e.target.value, 10) || 0 })}
                  className="w-full bg-tomori-bg border border-tomori-border rounded-lg px-2.5 py-1.5 text-xs font-bold"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center space-x-1.5 text-xs bg-tomori-bg border border-tomori-border rounded-lg p-2 w-full cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingItem.isTaxIncluded}
                    onChange={(e) => setEditingItem({ ...editingItem, isTaxIncluded: e.target.checked })}
                    className="rounded text-tomori-primary"
                  />
                  <span>税込</span>
                </label>
              </div>
            </div>

            <div className="pt-2 flex space-x-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="flex-1 bg-gray-100 text-gray-700 font-semibold text-xs py-2 rounded-xl"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="flex-1 bg-tomori-primary text-white font-bold text-xs py-2 rounded-xl shadow"
              >
                保存する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 削除確認モーダル */}
      {deletingId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-3 shadow-xl">
            <div className="flex items-center space-x-2 text-rose-600">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <h4 className="font-bold text-sm text-gray-900">商品の削除確認</h4>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              この商品データを削除してもよろしいですか？<br />
              この操作は取り消せません。
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

      {/* 画像拡大プレビュー */}
      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="max-w-md w-full relative">
            <img src={previewPhoto} alt="商品画像" className="w-full rounded-2xl max-h-[80vh] object-contain" />
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
