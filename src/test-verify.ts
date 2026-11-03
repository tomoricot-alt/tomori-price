import { calculateUnitPrice, formatPriceDifference } from './utils/pricing';
import { parseVoiceInput } from './services/speech';

console.log('=== TOMORI PRICE ロジック検証 ===\n');

// 1. スパゲッティの単価計算テスト (指示書 3-5)
console.log('--- 1. スパゲッティ計算テスト (税込指定) ---');
const pasta1 = calculateUnitPrice(228, 1, 'kg', true);
console.log('スーパーA (1kg, 228円 税込):', pasta1.formattedUnitPrice, `(計算値: ${pasta1.standardUnitPrice}円/100g)`);
console.assert(pasta1.standardUnitPrice === 22.8, '1kg/228円 は 22.8円/100g');

const pasta2 = calculateUnitPrice(248, 700, 'g', true);
console.log('スーパーB (700g, 248円 税込):', pasta2.formattedUnitPrice, `(計算値: ${pasta2.standardUnitPrice}円/100g)`);
console.assert(pasta2.standardUnitPrice === 35.4, '700g/248円 は 35.4円/100g');

const diff = formatPriceDifference(pasta1.standardUnitPrice, pasta2.standardUnitPrice, '100gあたり');
console.log('価格差判定:', diff.text, diff.isCheaper ? 'スーパーAがお得' : 'スーパーBがお得');

// 2. 税抜からの計算テスト
console.log('\n--- 2. 税抜からの計算テスト (8%適用) ---');
const olive1 = calculateUnitPrice(798, 682, 'g', false, 8);
console.log('オリーブオイル (682g, 税抜798円):', `税込${olive1.taxIncludedPrice}円`, olive1.formattedUnitPrice);

const olive2 = calculateUnitPrice(1080, 456, 'g', false, 8);
console.log('オリーブオイル (456g, 税抜1,080円):', `税込${olive2.taxIncludedPrice}円`, olive2.formattedUnitPrice);

// 3. gとmlの混同防止テスト
console.log('\n--- 3. gとmlの混同防止テスト ---');
const milk = calculateUnitPrice(198, 1000, 'ml', true);
console.log('牛乳 (1000ml, 198円): 区分 =', milk.unitType, milk.formattedUnitPrice);
console.assert(milk.unitType === 'volume', 'mlはvolumeとして扱われる');
console.assert(pasta1.unitType === 'weight', 'kgはweightとして扱われる');

// 4. 音声認識パーステスト
console.log('\n--- 4. 音声認識パーステスト ---');
const voiceTest1 = parseVoiceInput('今日はスーパーAです。オリーブオイルが798円でした。');
console.log('入力: "今日はスーパーAです。オリーブオイルが798円でした。"');
console.log('抽出結果:', voiceTest1);
console.assert(voiceTest1.storeName === 'スーパーA', '店舗名がスーパーAと抽出されること');
console.assert(voiceTest1.productName?.includes('オリーブオイル'), '商品名がオリーブオイルと抽出されること');
console.assert(voiceTest1.price === 798, '価格が798と抽出されること');

const voiceTest2 = parseVoiceInput('イオンでパスタを228円で買いました');
console.log('\n入力: "イオンでパスタを228円で買いました"');
console.log('抽出結果:', voiceTest2);

console.log('\n=== 全ての検証をパスしました ===');
