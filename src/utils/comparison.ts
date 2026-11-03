import type { ProductItem } from '../types';

export interface ComparisonResult {
  mode: 'exact' | 'similar'; // 同一商品 または 類似商品
  groupTitle: string;
  category: string;
  standardUnitLabel: string;
  items: (ProductItem & {
    isLowest: boolean;
    diffFromLowest: number; // 最安値との単価差
    diffText: string;
  })[];
  lowestItem: ProductItem;
  maxPriceDiff: number;
}

/**
 * 商品名やブランド名、カテゴリーから「同一商品グループ」または「類似商品グループ」を生成
 */
export function buildComparisonGroups(
  products: ProductItem[],
  mode: 'exact' | 'similar' = 'similar'
): ComparisonResult[] {
  // 単価計算が有効（0より大きい）なものだけを対象
  const validProducts = products.filter((p) => p.standardUnitPrice > 0);

  const groupsMap = new Map<string, ProductItem[]>();

  for (const item of validProducts) {
    let key = '';
    if (mode === 'exact') {
      // 同一商品: ブランド + 商品名 (空白・記号正規化) + 単位区分
      const cleanBrand = (item.brand || '').trim().toLowerCase();
      const cleanName = item.name.trim().toLowerCase();
      key = `${cleanBrand}___${cleanName}___${item.unitType}`;
    } else {
      // 類似商品: カテゴリー + 単位区分 (例: 麺類・パスタの重量商品, 調味料・油の重量商品)
      // または主要キーワード（スパゲッティ、オリーブオイル等）
      const keyword = detectKeyword(item.name);
      key = `${item.category}___${keyword || item.category}___${item.unitType}`;
    }

    if (!groupsMap.has(key)) {
      groupsMap.set(key, []);
    }
    groupsMap.get(key)!.push(item);
  }

  const results: ComparisonResult[] = [];

  for (const [key, items] of groupsMap.entries()) {
    // 比較には2件以上あるのが理想だが、1件でも表示可能にする
    // 単価昇順でソート（最安値が先頭）
    const sorted = [...items].sort((a, b) => a.standardUnitPrice - b.standardUnitPrice);
    const lowest = sorted[0];
    const highest = sorted[sorted.length - 1];
    const maxDiff = Math.round((highest.standardUnitPrice - lowest.standardUnitPrice) * 10) / 10;

    let groupTitle = '';
    if (mode === 'exact') {
      groupTitle = lowest.brand ? `${lowest.brand} ${lowest.name}` : lowest.name;
    } else {
      const parts = key.split('___');
      groupTitle = parts[1] || lowest.category;
    }

    const itemsWithComparison = sorted.map((item, index) => {
      const diff = Math.round((item.standardUnitPrice - lowest.standardUnitPrice) * 10) / 10;
      let diffText = '最安値';
      if (index > 0) {
        diffText = `+¥${diff} (${lowest.storeName}より高)`;
      }
      return {
        ...item,
        isLowest: index === 0,
        diffFromLowest: diff,
        diffText,
      };
    });

    results.push({
      mode,
      groupTitle,
      category: lowest.category,
      standardUnitLabel: lowest.standardUnitLabel,
      items: itemsWithComparison,
      lowestItem: lowest,
      maxPriceDiff: maxDiff,
    });
  }

  // 比較件数が多いグループ順に並べ替え
  return results.sort((a, b) => b.items.length - a.items.length);
}

/**
 * 商品名から類似比較用の主要名詞（スパゲッティ、オリーブオイル、牛乳、マヨネーズ等）を検出
 */
function detectKeyword(name: string): string {
  const commonKeywords = [
    'オリーブオイル',
    'スパゲッティ',
    'パスタ',
    'うどん',
    'そば',
    '米',
    '食パン',
    '牛乳',
    'ヨーグルト',
    '卵',
    'マヨネーズ',
    'ケチャップ',
    '醤油',
    'みりん',
    'キャノーラ油',
    'サラダ油',
    '豆腐',
    '納豆',
    'バター',
    'チーズ',
    'コーヒー',
    'ティッシュ',
    'トイレットペーパー',
  ];

  for (const kw of commonKeywords) {
    if (name.includes(kw)) {
      return kw;
    }
  }

  // なければ先頭の主要名詞
  return name.split(/[\s・]/)[0] || name;
}
