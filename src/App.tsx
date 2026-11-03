import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import type { TabType } from './components/Navigation';
import { HomePage } from './pages/HomePage';
import { CapturePage } from './pages/CapturePage';
import { ProductsPage } from './pages/ProductsPage';
import { ComparisonPage } from './pages/ComparisonPage';
import { ShoppingPage } from './pages/ShoppingPage';
import { SettingsPage } from './pages/SettingsPage';
import type { ProductItem, ShoppingItem, AppSettings } from './types';
import {
  getAllProducts,
  getAllShoppingItems,
  getSettings,
  saveMultipleProducts,
  saveProduct,
  deleteProduct,
  saveShoppingItem,
  deleteShoppingItem,
  saveSettings,
  seedInitialTestDataIfEmpty,
} from './db/indexedDb';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    defaultTaxRate: 8,
    enableVoiceInput: true,
    enableSoundFeedback: true,
    hasAgreedPrivacy: false,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 初期ロード
  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    try {
      setIsLoading(true);
      // 初回起動時、テストデータをシード
      await seedInitialTestDataIfEmpty();
      await refreshAllData();
    } catch (err) {
      console.error('Failed to initialize app DB:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAllData = async () => {
    const [pList, sList, sett] = await Promise.all([
      getAllProducts(),
      getAllShoppingItems(),
      getSettings(),
    ]);
    setProducts(pList);
    setShoppingItems(sList);
    setSettings(sett);
  };

  // 商品の一括保存（写真解析画面から）
  const handleSaveProducts = async (newProducts: ProductItem[]) => {
    await saveMultipleProducts(newProducts);
    await refreshAllData();
    // 保存後は商品一覧画面へ自動遷移
    setActiveTab('products');
  };

  // 商品の個別更新
  const handleUpdateProduct = async (product: ProductItem) => {
    await saveProduct(product);
    await refreshAllData();
  };

  // 商品の削除
  const handleDeleteProduct = async (id: string) => {
    await deleteProduct(id);
    await refreshAllData();
  };

  // 買い物リストへ追加
  const handleAddToShoppingList = async (product: ProductItem) => {
    const newItem: ShoppingItem = {
      id: `shop_${Date.now()}`,
      name: product.name,
      category: product.category,
      quantity: 1,
      completed: false,
      suggestedStore: product.storeName,
      lowestUnitPrice: product.standardUnitPrice,
      lowestPrice: product.taxIncludedPrice,
      photoUrl: product.photoUrl,
      createdAt: new Date().toISOString(),
    };
    await saveShoppingItem(newItem);
    await refreshAllData();
    setActiveTab('shopping');
  };

  // 買い物アイテムの保存
  const handleSaveShoppingItem = async (item: ShoppingItem) => {
    await saveShoppingItem(item);
    await refreshAllData();
  };

  // 買い物アイテムの削除
  const handleDeleteShoppingItem = async (id: string) => {
    await deleteShoppingItem(id);
    await refreshAllData();
  };

  // 設定の更新
  const handleUpdateSettings = async (newSettings: AppSettings) => {
    await saveSettings(newSettings);
    setSettings(newSettings);
  };

  // タブ別タイトルの取得
  const getHeaderInfo = () => {
    switch (activeTab) {
      case 'home':
        return { title: 'ホーム', subtitle: '撮るだけ、話すだけ。いつもの買い物をもっと賢く。' };
      case 'capture':
        return { title: '写真・音声登録', subtitle: '商品棚の写真を撮るか、店舗名を話してください' };
      case 'products':
        return { title: '商品一覧', subtitle: '登録された商品と100gあたりの単価一覧' };
      case 'comparison':
        return { title: '店舗別価格比較', subtitle: '店舗ごとの最安値と単価差を徹底比較' };
      case 'shopping':
        return { title: '買い物リスト', subtitle: '最安値店舗を提案するスマートお買い物メモ' };
      case 'settings':
        return { title: '設定・データ管理', subtitle: 'バックアップ、復元、Gemini API設定' };
      default:
        return { title: undefined, subtitle: undefined };
    }
  };

  const { title, subtitle } = getHeaderInfo();
  const uncompletedShoppingCount = shoppingItems.filter((i) => !i.completed).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-tomori-bg flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-tomori-primary flex items-center justify-center text-white shadow-lg animate-pulse">
          <span className="text-xl font-bold text-amber-300">灯</span>
        </div>
        <p className="text-xs font-semibold text-tomori-primary">TOMORI PRICE を起動中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tomori-bg flex flex-col selection:bg-tomori-light selection:text-tomori-primary">
      {/* 共通ヘッダー */}
      <Header title={title} subtitle={subtitle} />

      {/* メイン画面コンテンツ */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <HomePage
            products={products}
            shoppingItems={shoppingItems}
            onChangeTab={setActiveTab}
            onSelectProduct={() => setActiveTab('products')}
          />
        )}

        {activeTab === 'capture' && (
          <CapturePage
            onSaveProducts={handleSaveProducts}
            apiKey={settings.geminiApiKey}
          />
        )}

        {activeTab === 'products' && (
          <ProductsPage
            products={products}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onAddToShoppingList={handleAddToShoppingList}
          />
        )}

        {activeTab === 'comparison' && (
          <ComparisonPage products={products} />
        )}

        {activeTab === 'shopping' && (
          <ShoppingPage
            items={shoppingItems}
            products={products}
            onSaveItem={handleSaveShoppingItem}
            onDeleteItem={handleDeleteShoppingItem}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPage
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onRefreshData={refreshAllData}
          />
        )}
      </main>

      {/* 下部固定ナビゲーションバー */}
      <Navigation
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        shoppingCount={uncompletedShoppingCount}
      />
    </div>
  );
};

export default App;
