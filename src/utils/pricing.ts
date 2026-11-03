import type { ProductUnit } from '../types';

export interface UnitPriceCalculation {
  taxIncludedPrice: number; // 計算された税込価格
  standardUnitPrice: number; // 基準単価 (100gあたり / 100mlあたり / 1個あたり)
  standardUnitLabel: string;
  unitType: 'weight' | 'volume' | 'count' | 'unknown';
  formattedUnitPrice: string; // 表示用文字列 (例: "¥22.8 / 100g")
  subUnitPrices?: { [label: string]: number }; // 例: 1kgあたり, 1Lあたり
  isCalculatedTax: boolean; // 税抜から計算された税込かどうか
}

/**
 * 税込価格を計算する
 */
export function calculateTaxIncludedPrice(
  price: number,
  isTaxIncluded: boolean,
  taxRate: number = 8
): { taxIncludedPrice: number; isCalculatedTax: boolean } {
  if (isTaxIncluded) {
    return { taxIncludedPrice: Math.round(price), isCalculatedTax: false };
  }
  // 税抜からの計算: 端数四捨五入（一般的な店舗レジ端数処理に準拠）
  const calculated = Math.round(price * (1 + taxRate / 100));
  return { taxIncludedPrice: calculated, isCalculatedTax: true };
}

/**
 * 単位の系統（重量、容量、個数）を判定する
 */
export function getUnitType(unit: ProductUnit): 'weight' | 'volume' | 'count' | 'unknown' {
  switch (unit) {
    case 'g':
    case 'kg':
      return 'weight';
    case 'ml':
    case 'L':
      return 'volume';
    case '個':
    case '本':
    case 'パック':
    case '枚':
      return 'count';
    default:
      return 'unknown';
  }
}

/**
 * 容量・単位と価格から基準単価を正確に計算する
 * 
 * 厳守ルール:
 * - gとmlは絶対に混同・換算しない
 * - 容量・個数が0以下の場合は除外 (0を返す)
 * - 単価計算は純粋なプログラム演算で行う
 */
export function calculateUnitPrice(
  price: number,
  amount: number,
  unit: ProductUnit,
  isTaxIncluded: boolean,
  taxRate: number = 8
): UnitPriceCalculation {
  const { taxIncludedPrice, isCalculatedTax } = calculateTaxIncludedPrice(price, isTaxIncluded, taxRate);
  const unitType = getUnitType(unit);

  if (amount <= 0 || price < 0 || unitType === 'unknown') {
    return {
      taxIncludedPrice,
      standardUnitPrice: 0,
      standardUnitLabel: '比較不可',
      unitType,
      formattedUnitPrice: '比較対象外',
      isCalculatedTax,
    };
  }

  let standardUnitPrice = 0;
  let standardUnitLabel = '';
  const subUnitPrices: { [label: string]: number } = {};

  if (unitType === 'weight') {
    // 基準は 100g
    // グラムに換算
    const weightInGrams = unit === 'kg' ? amount * 1000 : amount;
    // 100gあたりの価格 (小数第2位を四捨五入して小数第1位まで)
    const raw100gPrice = (taxIncludedPrice / weightInGrams) * 100;
    standardUnitPrice = Math.round(raw100gPrice * 10) / 10;
    standardUnitLabel = '100gあたり';

    // 1kgあたりもサブ算出
    subUnitPrices['1kgあたり'] = Math.round(raw100gPrice * 10);
  } else if (unitType === 'volume') {
    // 基準は 100ml
    // ミリリットルに換算
    const volumeInMl = unit === 'L' ? amount * 1000 : amount;
    // 100mlあたりの価格 (小数第2位を四捨五入して小数第1位まで)
    const raw100mlPrice = (taxIncludedPrice / volumeInMl) * 100;
    standardUnitPrice = Math.round(raw100mlPrice * 10) / 10;
    standardUnitLabel = '100mlあたり';

    // 1Lあたりもサブ算出
    subUnitPrices['1Lあたり'] = Math.round(raw100mlPrice * 10);
  } else if (unitType === 'count') {
    // 基準は 1個あたり
    const rawCountPrice = taxIncludedPrice / amount;
    standardUnitPrice = Math.round(rawCountPrice * 10) / 10;
    standardUnitLabel = `1${unit}あたり`;
  }

  const formattedUnitPrice = standardUnitPrice > 0
    ? `¥${standardUnitPrice.toLocaleString('ja-JP', { minimumFractionDigits: standardUnitPrice % 1 !== 0 ? 1 : 0, maximumFractionDigits: 1 })} / ${standardUnitLabel.replace('あたり', '')}`
    : '計算不可';

  return {
    taxIncludedPrice,
    standardUnitPrice,
    standardUnitLabel,
    unitType,
    formattedUnitPrice,
    subUnitPrices,
    isCalculatedTax,
  };
}

/**
 * 価格差の比較情報テキストを生成
 */
export function formatPriceDifference(
  targetUnitPrice: number,
  baseUnitPrice: number,
  unitLabel: string
): { isCheaper: boolean; diffAmount: number; text: string } {
  const diff = Math.round(Math.abs(targetUnitPrice - baseUnitPrice) * 10) / 10;
  if (targetUnitPrice < baseUnitPrice) {
    return {
      isCheaper: true,
      diffAmount: diff,
      text: `${unitLabel} ¥${diff} お得！`,
    };
  } else if (targetUnitPrice > baseUnitPrice) {
    return {
      isCheaper: false,
      diffAmount: diff,
      text: `${unitLabel} ¥${diff} 高い`,
    };
  } else {
    return {
      isCheaper: false,
      diffAmount: 0,
      text: `同価格`,
    };
  }
}
