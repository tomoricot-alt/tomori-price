import type { ParsedVoiceResult } from '../types';

// Web Speech API の型定義
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}

/**
 * ブラウザが音声認識に対応しているか判定
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

/**
 * 音声認識インスタンスを作成
 */
export function createSpeechRecognition(): SpeechRecognitionInstance | null {
  if (!isSpeechRecognitionSupported()) return null;
  const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognitionClass) return null;

  const recognition = new SpeechRecognitionClass();
  recognition.lang = 'ja-JP';
  recognition.continuous = false;
  recognition.interimResults = true;
  return recognition;
}

/**
 * 音声で話された日本語テキストから、店舗名・商品名・価格・メモを抽出するパーサー
 * 
 * 例:
 * - 「今日はスーパーAです。オリーブオイルが798円でした。」
 *   → storeName: "スーパーA", productName: "オリーブオイル", price: 798
 * - 「イオンで牛乳を198円で買いました」
 *   → storeName: "イオン", productName: "牛乳", price: 198
 * - 「ライフ。パスタ500gが220円」
 *   → storeName: "ライフ", productName: "パスタ500g", price: 220
 */
export function parseVoiceInput(text: string): ParsedVoiceResult {
  const result: ParsedVoiceResult = {
    rawText: text,
    memo: text,
  };

  if (!text || text.trim() === '') return result;

  const cleanText = text.replace(/[\s、。]+/g, ' ').trim();

  // 1. 価格の抽出 (例: "798円", "1,200円", "248 えん", "300円でした")
  const priceRegex = /([0-9０-９,，]+)\s*(円|えん)/;
  const priceMatch = cleanText.match(priceRegex);
  if (priceMatch) {
    const rawNum = priceMatch[1]
      .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
      .replace(/[,，]/g, '');
    const num = parseInt(rawNum, 10);
    if (!isNaN(num)) {
      result.price = num;
    }
  }

  // 2. 店舗名の抽出
  // 「今日は(店舗名)です」「(店舗名)で」「(店舗名)にて」「店名は(店舗名)」
  // 「スーパー〇〇」「〇〇店」「イオン」「業務スーパー」など
  const storePatterns = [
    /今日(?:は|の店舗は)\s*([^\s、。]+?)\s*(?:です|に来ました|で買|にて)/,
    /(?:店舗|店名|お店|場所)(?:は|:)\s*([^\s、。]+)/,
    /([^\s、。]+?(?:スーパー|マート|ストア|ドラッグ|薬局|市場|イオン|ライフ|西友|コストコ|業務スーパー)[^\s、。]*?)(?:で|にて|へ|に|\s|$)/,
    /^([^\s、。]+?(?:店|スーパー))\s*/,
  ];

  for (const pattern of storePatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      let store = match[1].trim();
      // 余分な助詞の除去
      store = store.replace(/(?:です|でした|で|に|へ)$/, '').trim();
      if (store.length >= 2) {
        result.storeName = store;
        break;
      }
    }
  }

  // 3. 商品名の抽出
  // 「(商品名)が〇〇円」「(商品名)を〇〇円」
  const productPatterns = [
    /(?:今日は|スーパー[^\s]+?で|です[。、\s]*)*([^\s、。]+?)(?:が|は|を)\s*[0-9０-９,，]+\s*(?:円|えん)/,
    /([^\s、。]+?)\s*[0-9０-９,，]+\s*(?:円|えん)/,
  ];

  for (const pattern of productPatterns) {
    const match = cleanText.match(pattern);
    if (match && match[1]) {
      let prod = match[1].trim();
      // 店舗名や接続詞と被っている場合のトリミング
      if (result.storeName && prod.includes(result.storeName)) {
        prod = prod.replace(result.storeName, '').replace(/^(?:で|の|に|は|です)/, '').trim();
      }
      prod = prod.replace(/^(?:今日|今日はお店|店舗|スーパーA|買いました|でした)/, '').trim();
      if (prod.length >= 1) {
        result.productName = prod;
        break;
      }
    }
  }

  return result;
}
