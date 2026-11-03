// TOMORI PRICE 型定義

export type ProductUnit = 'g' | 'kg' | 'ml' | 'L' | '個' | '本' | 'パック' | '枚';

export type ProductCategory =
  | '調味料・油'
  | '麺類・パスタ'
  | '米・パン・粉類'
  | '肉・魚'
  | '野菜・果物'
  | '乳製品・卵'
  | '飲料・お茶'
  | '菓子・スナック'
  | '冷凍食品'
  | 'レトルト・缶詰'
  | '日用品・消耗品'
  | 'その他';

export interface ProductItem {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  amount: number; // 数値 (例: 1000, 700)
  unit: ProductUnit;
  price: number; // 登録価格 (税抜または税込)
  isTaxIncluded: boolean; // 税込フラグ
  taxRate: number; // 軽減税率8% または 10%
  taxIncludedPrice: number; // 計算された税込価格
  storeName: string;
  storeLocation?: string;
  photoUrl?: string; // Base64または画像データ
  recordedAt: string; // ISO 8601
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  memo?: string;
  aiExtracted?: boolean;
  confidence?: number; // 0 - 1
  status: 'confirmed' | 'draft' | 'needs_check';
  // 単価情報
  standardUnitPrice: number; // 100g / 100ml / 1個あたりの税込単価
  standardUnitLabel: string; // 例: '100gあたり', '100mlあたり', '1個あたり'
  unitType: 'weight' | 'volume' | 'count' | 'unknown'; // 換算種別（混同防止）
}

export interface ShoppingItem {
  id: string;
  name: string;
  category: ProductCategory;
  targetAmount?: string; // 例: '1kg'
  quantity: number;
  completed: boolean;
  memo?: string;
  suggestedStore?: string; // 最安値店舗名
  lowestUnitPrice?: number; // 最安単価
  lowestPrice?: number; // 最安参考価格
  photoUrl?: string;
  createdAt: string;
}

export interface ComparisonGroup {
  groupKey: string;
  displayName: string;
  category: ProductCategory;
  unitType: 'weight' | 'volume' | 'count' | 'unknown';
  standardUnitLabel: string;
  items: ProductItem[];
  lowestItem: ProductItem;
  priceDiffMax: number;
}

export interface ParsedVoiceResult {
  storeName?: string;
  productName?: string;
  price?: number;
  rawText: string;
  memo?: string;
}

export interface ExtractedAIProduct {
  name: string;
  brand: string;
  category: ProductCategory;
  amount: number;
  unit: ProductUnit;
  price: number;
  isTaxIncluded: boolean;
  taxRate: number;
  confidence: number;
  features?: string;
  priceTagText?: string;
  status: 'confirmed' | 'needs_check';
}

export interface AppSettings {
  geminiApiKey?: string;
  defaultTaxRate: number;
  enableVoiceInput: boolean;
  enableSoundFeedback: boolean;
  hasAgreedPrivacy: boolean;
  lastBackupDate?: string;
}
