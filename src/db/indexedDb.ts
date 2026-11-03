import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { ProductItem, ShoppingItem, AppSettings } from '../types';
import { calculateUnitPrice } from '../utils/pricing';

interface TomoriPriceDB extends DBSchema {
  products: {
    key: string;
    value: ProductItem;
    indexes: {
      'by-category': string;
      'by-store': string;
      'by-recordedAt': string;
      'by-name': string;
    };
  };
  shoppingList: {
    key: string;
    value: ShoppingItem;
    indexes: {
      'by-completed': number;
      'by-createdAt': string;
    };
  };
  settings: {
    key: string;
    value: AppSettings;
  };
}

const DB_NAME = 'tomori_price_db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<TomoriPriceDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<TomoriPriceDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // products store
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: 'id' });
          productStore.createIndex('by-category', 'category');
          productStore.createIndex('by-store', 'storeName');
          productStore.createIndex('by-recordedAt', 'recordedAt');
          productStore.createIndex('by-name', 'name');
        }

        // shoppingList store
        if (!db.objectStoreNames.contains('shoppingList')) {
          const shoppingStore = db.createObjectStore('shoppingList', { keyPath: 'id' });
          shoppingStore.createIndex('by-completed', 'completed');
          shoppingStore.createIndex('by-createdAt', 'createdAt');
        }

        // settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      },
    });
  }
  return dbPromise;
}

// ---------------- 商品関連 ----------------

export async function getAllProducts(): Promise<ProductItem[]> {
  const db = await getDB();
  const items = await db.getAll('products');
  // 登録日降順
  return items.sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime());
}

export async function getProductById(id: string): Promise<ProductItem | undefined> {
  const db = await getDB();
  return db.get('products', id);
}

export async function saveProduct(item: ProductItem): Promise<void> {
  const db = await getDB();
  await db.put('products', item);
}

export async function saveMultipleProducts(items: ProductItem[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('products', 'readwrite');
  for (const item of items) {
    await tx.store.put(item);
  }
  await tx.done;
}

export async function deleteProduct(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('products', id);
}

// ---------------- 買い物リスト関連 ----------------

export async function getAllShoppingItems(): Promise<ShoppingItem[]> {
  const db = await getDB();
  const items = await db.getAll('shoppingList');
  return items.sort((a, b) => (a.completed === b.completed ? 0 : a.completed ? 1 : -1));
}

export async function saveShoppingItem(item: ShoppingItem): Promise<void> {
  const db = await getDB();
  await db.put('shoppingList', item);
}

export async function deleteShoppingItem(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('shoppingList', id);
}

// ---------------- 設定関連 ----------------

export const DEFAULT_SETTINGS: AppSettings = {
  defaultTaxRate: 8,
  enableVoiceInput: true,
  enableSoundFeedback: true,
  hasAgreedPrivacy: false,
};

export async function getSettings(): Promise<AppSettings> {
  const db = await getDB();
  const settings = await db.get('settings', 'app_config');
  return settings || DEFAULT_SETTINGS;
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await getDB();
  await db.put('settings', settings, 'app_config');
}

// ---------------- バックアップ・復元・CSV ----------------

export interface BackupData {
  version: string;
  exportedAt: string;
  products: ProductItem[];
  shoppingList: ShoppingItem[];
  settings?: AppSettings;
}

export async function exportBackupJson(): Promise<string> {
  const products = await getAllProducts();
  const shoppingList = await getAllShoppingItems();
  const settings = await getSettings();

  const backup: BackupData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    products,
    shoppingList,
    settings,
  };

  return JSON.stringify(backup, null, 2);
}

export interface RestoreResult {
  addedProducts: number;
  skippedProducts: number;
  addedShopping: number;
  errors: string[];
}

export async function restoreFromJson(
  jsonString: string,
  skipExisting: boolean = true
): Promise<RestoreResult> {
  const result: RestoreResult = {
    addedProducts: 0,
    skippedProducts: 0,
    addedShopping: 0,
    errors: [],
  };

  try {
    const data = JSON.parse(jsonString) as Partial<BackupData>;
    if (!data.products && !data.shoppingList) {
      throw new Error('バックアップデータの形式が不正です（productsまたはshoppingListが見つかりません）');
    }

    const db = await getDB();

    if (Array.isArray(data.products)) {
      const existing = await getAllProducts();
      const existingIds = new Set(existing.map((p) => p.id));
      const existingNamesStores = new Set(
        existing.map((p) => `${p.name}___${p.storeName}___${p.amount}___${p.unit}`)
      );

      const tx = db.transaction('products', 'readwrite');
      for (const item of data.products) {
        if (!item.id || !item.name) {
          result.errors.push(`無効な商品データがスキップされました: ${JSON.stringify(item).slice(0, 50)}`);
          continue;
        }

        const duplicateKey = `${item.name}___${item.storeName}___${item.amount}___${item.unit}`;
        if (skipExisting && (existingIds.has(item.id) || existingNamesStores.has(duplicateKey))) {
          result.skippedProducts++;
          continue;
        }

        await tx.store.put(item);
        result.addedProducts++;
      }
      await tx.done;
    }

    if (Array.isArray(data.shoppingList)) {
      const existingShopping = await getAllShoppingItems();
      const existingIds = new Set(existingShopping.map((s) => s.id));
      const tx = db.transaction('shoppingList', 'readwrite');
      for (const item of data.shoppingList) {
        if (!item.id || !item.name) continue;
        if (skipExisting && existingIds.has(item.id)) continue;
        await tx.store.put(item);
        result.addedShopping++;
      }
      await tx.done;
    }
  } catch (err: any) {
    result.errors.push(err.message || '復元処理に失敗しました');
  }

  return result;
}

/**
 * 商品一覧をCSV文字列（BOM付きUTF-8）に変換
 */
export async function exportProductsCsv(): Promise<string> {
  const products = await getAllProducts();
  const headers = [
    '商品ID',
    '商品名',
    'ブランド/メーカー',
    'カテゴリー',
    '内容量',
    '単位',
    '登録価格(円)',
    '税区分',
    '税率(%)',
    '税込価格(円)',
    '100g/100ml等基準単価',
    '基準単位',
    '店舗名',
    '記録日時',
    'メモ',
  ];

  const rows = products.map((p) => [
    `"${p.id}"`,
    `"${(p.name || '').replace(/"/g, '""')}"`,
    `"${(p.brand || '').replace(/"/g, '""')}"`,
    `"${p.category || ''}"`,
    p.amount,
    `"${p.unit}"`,
    p.price,
    p.isTaxIncluded ? '税込' : '税抜',
    p.taxRate,
    p.taxIncludedPrice,
    p.standardUnitPrice,
    `"${p.standardUnitLabel}"`,
    `"${(p.storeName || '').replace(/"/g, '""')}"`,
    `"${p.recordedAt}"`,
    `"${(p.memo || '').replace(/"/g, '""')}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  return csvContent;
}

// ---------------- ストレージ概算 ----------------

export async function getStorageEstimate(): Promise<{ usageMB: number; itemCount: number }> {
  try {
    const products = await getAllProducts();
    let approximateBytes = 0;
    for (const p of products) {
      if (p.photoUrl) {
        approximateBytes += p.photoUrl.length;
      }
      approximateBytes += 500; // メタデータ概算
    }
    const usageMB = Math.round((approximateBytes / (1024 * 1024)) * 10) / 10;
    return { usageMB, itemCount: products.length };
  } catch {
    return { usageMB: 0, itemCount: 0 };
  }
}

// ---------------- 初期テストデータの投入 ----------------

export async function seedInitialTestDataIfEmpty(): Promise<boolean> {
  const existing = await getAllProducts();
  if (existing.length > 0) {
    return false; // 既にデータがある場合はスキップ
  }

  // 写真A・写真Bのテストデータ
  const now = new Date();
  const testItems: ProductItem[] = [
    // 写真A：オリーブオイル
    {
      id: 'test-olive-1',
      name: 'ベストプライス エキストラバージンオリーブオイル',
      brand: 'トップバリュ ベストプライス',
      category: '調味料・油',
      amount: 682,
      unit: 'g',
      price: 798,
      isTaxIncluded: false,
      taxRate: 8,
      ...calculateUnitPrice(798, 682, 'g', false, 8),
      storeName: 'イオン スーパーA店',
      recordedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      memo: '指示書テスト写真Aの候補データ（暫定読み取り）',
      aiExtracted: true,
      confidence: 0.95,
      status: 'confirmed',
    },
    {
      id: 'test-olive-2',
      name: 'レッドアイランド エキストラバージンオリーブオイル',
      brand: 'Red Island',
      category: '調味料・油',
      amount: 456,
      unit: 'g',
      price: 1080,
      isTaxIncluded: false,
      taxRate: 8,
      ...calculateUnitPrice(1080, 456, 'g', false, 8),
      storeName: 'イオン スーパーA店',
      recordedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      memo: '指示書テスト写真Aの候補データ（高品質オーストラリア産）',
      aiExtracted: true,
      confidence: 0.92,
      status: 'confirmed',
    },
    // 写真B：スパゲッティ
    {
      id: 'test-pasta-1',
      name: 'ベストプライス スパゲッティ',
      brand: 'トップバリュ ベストプライス',
      category: '麺類・パスタ',
      amount: 1,
      unit: 'kg',
      price: 228,
      isTaxIncluded: false,
      taxRate: 8,
      ...calculateUnitPrice(228, 1, 'kg', false, 8),
      storeName: 'スーパーA',
      recordedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      memo: '指示書例: 1kg／228円(税抜) → 税込246円 / 100gあたり24.6円',
      aiExtracted: true,
      confidence: 0.98,
      status: 'confirmed',
    },
    {
      id: 'test-pasta-2',
      name: 'デイリーセレクション スパゲッティ',
      brand: 'デイリー',
      category: '麺類・パスタ',
      amount: 700,
      unit: 'g',
      price: 248,
      isTaxIncluded: false,
      taxRate: 8,
      ...calculateUnitPrice(248, 700, 'g', false, 8),
      storeName: 'スーパーB',
      recordedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      memo: '指示書例: 700g／248円(税抜) → 税込268円 / 100gあたり38.3円',
      aiExtracted: true,
      confidence: 0.90,
      status: 'confirmed',
    },
  ];

  await saveMultipleProducts(testItems);
  return true;
}
