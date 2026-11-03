import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Mic,
  MicOff,
  Sparkles,
  Check,
  AlertCircle,
  Plus,
  Trash2,
  Store,
  Info,
  Layers,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import type { ProductItem, ProductCategory, ProductUnit } from '../types';
import { processAndCompressImage } from '../utils/image';
import type { ProcessedImage } from '../utils/image';
import { calculateUnitPrice } from '../utils/pricing';
import { analyzeProductImage } from '../services/gemini';
import {
  isSpeechRecognitionSupported,
  createSpeechRecognition,
  parseVoiceInput,
} from '../services/speech';

interface CapturePageProps {
  onSaveProducts: (products: ProductItem[]) => Promise<void>;
  apiKey?: string;
}

interface DraftItem {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  amount: number;
  unit: ProductUnit;
  price: number;
  isTaxIncluded: boolean;
  taxRate: number;
  confidence: number;
  priceTagText?: string;
  features?: string;
  status: 'confirmed' | 'needs_check';
}

const CATEGORIES: ProductCategory[] = [
  '調味料・油',
  '麺類・パスタ',
  '米・パン・粉類',
  '肉・魚',
  '野菜・果物',
  '乳製品・卵',
  '飲料・お茶',
  '菓子・スナック',
  '冷凍食品',
  'レトルト・缶詰',
  '日用品・消耗品',
  'その他',
];

const UNITS: ProductUnit[] = ['g', 'kg', 'ml', 'L', '個', '本', 'パック', '枚'];

export const CapturePage: React.FC<CapturePageProps> = ({ onSaveProducts, apiKey }) => {
  const [selectedImage, setSelectedImage] = useState<ProcessedImage | null>(null);
  const [storeName, setStoreName] = useState<string>('イオン スーパーA店');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [speechTranscript, setSpeechTranscript] = useState<string>('');
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [showMicPrivacyModal, setShowMicPrivacyModal] = useState<boolean>(false);
  const [showAiConsentModal, setShowAiConsentModal] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    setSpeechSupported(isSpeechRecognitionSupported());
  }, []);

  // 音声認識のトグル
  const toggleRecording = () => {
    if (!speechSupported) {
      alert('お使いのブラウザは音声認識に対応していません。手入力をご利用ください。');
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    try {
      const recognition = createSpeechRecognition();
      if (!recognition) {
        alert('音声認識の初期化に失敗しました。');
        return;
      }

      recognitionRef.current = recognition;

      recognition.onstart = () => {
        setIsRecording(true);
        setSpeechTranscript('');
        setErrorMessage('');
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setSpeechTranscript(currentTranscript);

        // 音声解析して店舗名や価格をリアルタイム抽出
        const parsed = parseVoiceInput(currentTranscript);
        if (parsed.storeName) {
          setStoreName(parsed.storeName);
        }

        // 候補リストがある場合、価格や商品名を反映
        if (parsed.price && draftItems.length > 0) {
          setDraftItems((prev) =>
            prev.map((item, idx) =>
              idx === 0 ? { ...item, price: parsed.price!, status: 'confirmed' } : item
            )
          );
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech error', event);
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          setErrorMessage('マイクのアクセスが許可されていません。ブラウザ設定から許可してください。');
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.start();
    } catch (err: any) {
      console.error(err);
      setIsRecording(false);
      setErrorMessage(`音声認識を開始できませんでした: ${err.message}`);
    }
  };

  // 写真選択ハンドラー
  const handleImageFile = async (file: File) => {
    try {
      setErrorMessage('');
      const processed = await processAndCompressImage(file, 1200, 0.82);
      setSelectedImage(processed);
      // 自動的にAI解析モーダルを表示または解析を準備
    } catch (err: any) {
      setErrorMessage(`画像処理に失敗しました: ${err.message}`);
    }
  };

  // サンプル写真（指示書のテスト写真A/B）のプリセット読み込み
  const handleLoadSample = (sampleType: 'olive' | 'pasta') => {
    if (sampleType === 'olive') {
      setStoreName('イオン スーパーA店');
      setDraftItems([
        {
          id: 'draft-1',
          name: 'ベストプライス エキストラバージンオリーブオイル',
          brand: 'トップバリュ ベストプライス',
          category: '調味料・油',
          amount: 682,
          unit: 'g',
          price: 798,
          isTaxIncluded: false,
          taxRate: 8,
          confidence: 0.95,
          features: '大容量・スペイン産エキストラバージン',
          priceTagText: '本体 798円 (税込 861円) 682g',
          status: 'confirmed',
        },
        {
          id: 'draft-2',
          name: 'レッドアイランド エキストラバージンオリーブオイル',
          brand: 'Red Island',
          category: '調味料・油',
          amount: 456,
          unit: 'g',
          price: 1080,
          isTaxIncluded: false,
          taxRate: 8,
          confidence: 0.91,
          features: '豪州産プレミアムオリーブオイル',
          priceTagText: '本体 1,080円 (税込 1,166円) 456g',
          status: 'confirmed',
        },
      ]);
    } else {
      setStoreName('スーパーA');
      setDraftItems([
        {
          id: 'draft-3',
          name: 'ベストプライス スパゲッティ 1.6mm',
          brand: 'トップバリュ ベストプライス',
          category: '麺類・パスタ',
          amount: 1,
          unit: 'kg',
          price: 228,
          isTaxIncluded: false,
          taxRate: 8,
          confidence: 0.98,
          features: '1kg結束タイプ デュラム小麦100%',
          priceTagText: '本体 228円 (税込 246円) 1kg',
          status: 'confirmed',
        },
        {
          id: 'draft-4',
          name: 'デイリーセレクション スパゲッティ',
          brand: 'デイリー',
          category: '麺類・パスタ',
          amount: 700,
          unit: 'g',
          price: 248,
          isTaxIncluded: false,
          taxRate: 8,
          confidence: 0.88,
          features: '700g徳用パック',
          priceTagText: '本体 248円 (税込 268円) 700g',
          status: 'confirmed',
        },
      ]);
    }
  };

  // AI解析実行
  const triggerAiAnalysis = async () => {
    setShowAiConsentModal(false);
    setIsAnalyzing(true);
    setErrorMessage('');

    try {
      const extracted = await analyzeProductImage({
        apiKey,
        imageBase64: selectedImage?.dataUrl || '',
        userStoreName: storeName,
      });

      const drafts: DraftItem[] = extracted.map((item, idx) => ({
        id: `extracted-${Date.now()}-${idx}`,
        name: item.name,
        brand: item.brand,
        category: item.category,
        amount: item.amount,
        unit: item.unit,
        price: item.price,
        isTaxIncluded: item.isTaxIncluded,
        taxRate: item.taxRate,
        confidence: item.confidence,
        priceTagText: item.priceTagText,
        features: item.features,
        status: item.status,
      }));

      setDraftItems(drafts);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'AI解析に失敗しました。手動で入力してください。');
      // フォールバックとして空の入力枠を追加
      handleAddManualItem();
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 手動で候補を追加
  const handleAddManualItem = () => {
    const newItem: DraftItem = {
      id: `manual-${Date.now()}`,
      name: '',
      brand: '',
      category: 'その他',
      amount: 100,
      unit: 'g',
      price: 0,
      isTaxIncluded: false,
      taxRate: 8,
      confidence: 1.0,
      status: 'confirmed',
    };
    setDraftItems((prev) => [...prev, newItem]);
  };

  // 候補の更新
  const updateDraft = (id: string, updates: Partial<DraftItem>) => {
    setDraftItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  // 候補の削除
  const removeDraft = (id: string) => {
    setDraftItems((prev) => prev.filter((item) => item.id !== id));
  };

  // 保存処理
  const handleSaveAll = async () => {
    if (draftItems.length === 0) {
      setErrorMessage('登録する商品がありません');
      return;
    }

    // バリデーション
    for (const d of draftItems) {
      if (!d.name || d.name.trim() === '') {
        setErrorMessage('すべての商品の商品名を入力してください');
        return;
      }
      if (d.price <= 0) {
        setErrorMessage(`「${d.name}」の価格を入力してください`);
        return;
      }
      if (d.amount <= 0) {
        setErrorMessage(`「${d.name}」の内容量を正しく入力してください`);
        return;
      }
    }

    setIsSaving(true);
    setErrorMessage('');

    try {
      const now = new Date();
      const recordedAt = selectedImage?.capturedAt || now.toISOString();

      const finalProducts: ProductItem[] = draftItems.map((d) => {
        const pricing = calculateUnitPrice(d.price, d.amount, d.unit, d.isTaxIncluded, d.taxRate);

        return {
          id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: d.name.trim(),
          brand: d.brand.trim(),
          category: d.category,
          amount: Number(d.amount),
          unit: d.unit,
          price: Number(d.price),
          isTaxIncluded: d.isTaxIncluded,
          taxRate: d.taxRate,
          taxIncludedPrice: pricing.taxIncludedPrice,
          standardUnitPrice: pricing.standardUnitPrice,
          standardUnitLabel: pricing.standardUnitLabel,
          unitType: pricing.unitType,
          storeName: storeName.trim() || '未設定店舗',
          photoUrl: selectedImage?.dataUrl,
          recordedAt,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
          memo: d.features || d.priceTagText ? `${d.features || ''} ${d.priceTagText || ''}`.trim() : undefined,
          aiExtracted: true,
          confidence: d.confidence,
          status: 'confirmed',
        };
      });

      await onSaveProducts(finalProducts);
      setSaveSuccess(true);
      setDraftItems([]);
      setSelectedImage(null);
      setSpeechTranscript('');

      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (err: any) {
      setErrorMessage(`保存エラー: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="pb-24 pt-3 px-4 max-w-md mx-auto space-y-4">
      {/* 成功通知トースト */}
      {saveSuccess && (
        <div className="fixed top-16 left-4 right-4 max-w-md mx-auto bg-emerald-600 text-white p-3 rounded-xl shadow-lg z-50 flex items-center space-x-2 animate-bounce">
          <Check className="w-5 h-5 flex-shrink-0" />
          <span className="text-xs font-bold">商品データをIndexedDBに保存しました！</span>
        </div>
      )}

      {/* エラーアラート */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 店舗名入力 ＆ 音声認識セクション */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-tomori-border space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-gray-800 flex items-center space-x-1.5">
            <Store className="w-4 h-4 text-tomori-primary" />
            <span>店舗名（音声または手入力）</span>
          </label>
          <button
            type="button"
            onClick={() => setShowMicPrivacyModal(true)}
            className="text-[11px] text-gray-400 hover:text-gray-600 flex items-center"
          >
            <Info className="w-3.5 h-3.5 mr-0.5" />
            音声入力について
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="例: イオン スーパーA店"
              className="w-full bg-tomori-bg border border-tomori-border rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-tomori-primary"
            />
          </div>
          <button
            type="button"
            onClick={toggleRecording}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              isRecording
                ? 'bg-rose-500 text-white animate-pulse shadow-md'
                : 'bg-tomori-light text-tomori-primary hover:bg-emerald-100'
            }`}
            title="音声入力（話して店舗名・商品・価格を自動抽出）"
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
        </div>

        {isRecording && (
          <div className="bg-rose-50 text-rose-700 p-2.5 rounded-xl text-xs flex items-center space-x-2 border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span className="font-medium">
              音声認識中...「今日はスーパーAです。オリーブオイルが798円でした」とお話しください
            </span>
          </div>
        )}

        {speechTranscript && (
          <div className="p-2.5 bg-tomori-bg rounded-xl border border-dashed border-tomori-border text-xs text-gray-600">
            <div className="text-[10px] text-gray-400 font-bold mb-0.5">認識テキスト:</div>
            {speechTranscript}
          </div>
        )}
      </div>

      {/* 写真撮影・画像アップロードセクション */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-tomori-border space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-gray-800 flex items-center space-x-1.5">
            <Camera className="w-4 h-4 text-tomori-primary" />
            <span>商品棚・値札写真</span>
          </label>
          {selectedImage && (
            <span className="text-[10px] text-gray-400">
              圧縮後: {Math.round(selectedImage.compressedSize / 1024)}KB ({selectedImage.width}x{selectedImage.height})
            </span>
          )}
        </div>

        {/* プレビュー表示 */}
        {selectedImage ? (
          <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-900 group">
            <img
              src={selectedImage.dataUrl}
              alt="商品棚プレビュー"
              className="w-full h-48 object-contain"
            />
            <div className="absolute top-2 right-2 flex space-x-1">
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-lg text-xs backdrop-blur-sm"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">
              撮影: {new Date(selectedImage.capturedAt).toLocaleString('ja-JP')}
            </div>
          </div>
        ) : (
          <div className="border-2 border-dashed border-tomori-border rounded-xl p-5 text-center bg-tomori-bg/50 space-y-3">
            <div className="flex justify-center space-x-3">
              {/* iPhoneカメラ直起動 */}
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center space-x-1.5 bg-tomori-primary text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow hover:bg-tomori-dark active:scale-95 transition-transform"
              >
                <Camera className="w-4 h-4" />
                <span>カメラ起動</span>
              </button>

              {/* アルバムから選択 */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-1.5 bg-white border border-gray-300 text-gray-700 font-semibold text-xs py-2.5 px-4 rounded-xl hover:bg-gray-50 active:scale-95 transition-transform"
              >
                <Upload className="w-4 h-4" />
                <span>写真選択</span>
              </button>
            </div>

            <p className="text-[11px] text-gray-500">
              ※複数商品が並ぶスーパーの商品棚写真も一括解析できます
            </p>

            {/* サンプルテスト写真クイック読み込み */}
            <div className="pt-2 border-t border-gray-200">
              <span className="text-[10px] text-gray-400 block mb-1.5">テストデータで即時体験：</span>
              <div className="flex justify-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleLoadSample('olive')}
                  className="text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-lg font-medium"
                >
                  写真A: オリーブオイル棚
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadSample('pasta')}
                  className="text-[10px] bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-lg font-medium"
                >
                  写真B: スパゲッティ棚
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 隠しインプット */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) handleImageFile(e.target.files[0]);
          }}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.[0]) handleImageFile(e.target.files[0]);
          }}
        />

        {/* AI解析ボタン */}
        {selectedImage && (
          <button
            type="button"
            disabled={isAnalyzing}
            onClick={() => setShowAiConsentModal(true)}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-tomori-primary to-tomori-accent text-white font-bold text-xs py-3 rounded-xl shadow-md hover:opacity-95 active:scale-98 transition-all disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Gemini AIで商品棚を解析中...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>AIで商品・値札を自動抽出する</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* 抽出・登録候補リスト */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-tomori-primary" />
            <h3 className="text-xs font-bold text-gray-800">
              登録する商品情報 ({draftItems.length} 件)
            </h3>
          </div>
          <button
            type="button"
            onClick={handleAddManualItem}
            className="text-[11px] text-tomori-accent hover:text-tomori-primary font-bold flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>商品を手動追加</span>
          </button>
        </div>

        {draftItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center text-xs text-gray-400 border border-tomori-border">
            写真を選択してAI解析を行うか、「商品を手動追加」または上記のテストサンプルをお試しください。
          </div>
        ) : (
          <div className="space-y-3">
            {draftItems.map((item, idx) => {
              const pricing = calculateUnitPrice(item.price, item.amount, item.unit, item.isTaxIncluded, item.taxRate);

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-tomori-border space-y-3 relative"
                >
                  {/* ヘッダー情報・要確認バッジ */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                      <span className="text-[10px] font-bold bg-tomori-sand text-tomori-text px-2 py-0.5 rounded">
                        商品 #{idx + 1}
                      </span>
                      {item.confidence && item.confidence < 0.9 && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded flex items-center">
                          <AlertCircle className="w-3 h-3 mr-0.5" />
                          要確認 (信頼度 {Math.round(item.confidence * 100)}%)
                        </span>
                      )}
                      {item.priceTagText && (
                        <span className="text-[10px] text-gray-400 line-clamp-1 max-w-[200px]">
                          値札: {item.priceTagText}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDraft(item.id)}
                      className="text-gray-400 hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 商品名 */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 block mb-1">商品名 *</label>
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateDraft(item.id, { name: e.target.value })}
                      placeholder="例: エキストラバージンオリーブオイル"
                      className="w-full bg-tomori-bg border border-tomori-border rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-tomori-primary"
                    />
                  </div>

                  {/* ブランド & カテゴリー */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 block mb-1">メーカー / ブランド</label>
                      <input
                        type="text"
                        value={item.brand}
                        onChange={(e) => updateDraft(item.id, { brand: e.target.value })}
                        placeholder="例: トップバリュ"
                        className="w-full bg-tomori-bg border border-tomori-border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 block mb-1">カテゴリー</label>
                      <div className="relative">
                        <select
                          value={item.category}
                          onChange={(e) => updateDraft(item.id, { category: e.target.value as ProductCategory })}
                          className="w-full bg-tomori-bg border border-tomori-border rounded-lg px-2.5 py-1.5 text-xs appearance-none pr-6 focus:outline-none"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-2.5 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* 内容量 & 単位 */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 block mb-1">内容量（数値）*</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={item.amount || ''}
                        onChange={(e) => updateDraft(item.id, { amount: parseFloat(e.target.value) || 0 })}
                        placeholder="例: 682"
                        className="w-full bg-tomori-bg border border-tomori-border rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 block mb-1">単位 *</label>
                      <div className="relative">
                        <select
                          value={item.unit}
                          onChange={(e) => updateDraft(item.id, { unit: e.target.value as ProductUnit })}
                          className="w-full bg-tomori-bg border border-tomori-border rounded-lg px-2.5 py-1.5 text-xs appearance-none pr-6 font-semibold focus:outline-none"
                        >
                          {UNITS.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 top-2.5 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* 販売価格 & 税込/税抜切替 */}
                  <div className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-6">
                      <label className="text-[10px] font-bold text-gray-500 block mb-1">店頭販売価格 (円) *</label>
                      <input
                        type="number"
                        min="0"
                        value={item.price || ''}
                        onChange={(e) => updateDraft(item.id, { price: parseInt(e.target.value, 10) || 0 })}
                        placeholder="例: 798"
                        className="w-full bg-tomori-bg border border-tomori-border rounded-lg px-2.5 py-1.5 text-xs font-bold text-gray-900 focus:outline-none"
                      />
                    </div>
                    <div className="col-span-6 flex items-center space-x-2">
                      <label className="flex items-center space-x-1 cursor-pointer bg-tomori-bg px-2.5 py-1.5 rounded-lg border border-tomori-border flex-1 justify-center">
                        <input
                          type="checkbox"
                          checked={item.isTaxIncluded}
                          onChange={(e) => updateDraft(item.id, { isTaxIncluded: e.target.checked })}
                          className="rounded text-tomori-primary focus:ring-0"
                        />
                        <span className="text-xs font-semibold text-gray-700">
                          {item.isTaxIncluded ? '税込表記' : '税抜表記'}
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* 自動計算された単価バッジ */}
                  <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-2.5 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-emerald-800 font-bold block">
                        自動計算された税込単価
                      </span>
                      <span className="text-xs font-bold text-emerald-900">
                        {pricing.formattedUnitPrice}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-gray-500 block">
                        税込価格: ¥{pricing.taxIncludedPrice.toLocaleString()}
                        {pricing.isCalculatedTax && ' (税率8%計算値)'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* 一括保存ボタン */}
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveAll}
              className="w-full bg-tomori-primary hover:bg-tomori-dark text-white font-bold text-sm py-3.5 rounded-xl shadow-md transition-transform active:scale-98 flex items-center justify-center space-x-2"
            >
              {isSaving ? (
                <span>保存処理中...</span>
              ) : (
                <>
                  <Check className="w-5 h-5 text-amber-300" />
                  <span>この内容で保存する ({draftItems.length}件)</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 音声入力プライバシー説明モーダル */}
      {showMicPrivacyModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-3 shadow-xl">
            <h4 className="font-bold text-sm text-gray-900 flex items-center space-x-1.5">
              <Mic className="w-4 h-4 text-tomori-primary" />
              <span>音声認識とプライバシーについて</span>
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              TOMORI PRICEでは、店舗名や価格をすばやく記録するために、ブラウザ標準の音声認識機能（Web Speech API）を使用しています。
            </p>
            <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
              <li>音声データは店舗名や価格のテキスト変換にのみ利用されます。</li>
              <li>音声ファイルがサーバーに恒久保存されることはありません。</li>
              <li>マイクの利用はお使いのブラウザで許可する必要があります。</li>
              <li>マイクが使えない場合でも、すべての機能は手入力でご利用いただけます。</li>
            </ul>
            <button
              type="button"
              onClick={() => setShowMicPrivacyModal(false)}
              className="w-full bg-tomori-primary text-white font-bold text-xs py-2 rounded-xl mt-2"
            >
              確認しました
            </button>
          </div>
        </div>
      )}

      {/* AI外部送信事前同意モーダル */}
      {showAiConsentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-3 shadow-xl">
            <h4 className="font-bold text-sm text-gray-900 flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>AI画像解析（送信先・目的のご確認）</span>
            </h4>
            <p className="text-xs text-gray-600 leading-relaxed">
              撮影した写真を Google Gemini API に安全に送信し、画像内の商品名・内容量・価格・値札情報を自動抽出します。
            </p>
            <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-[11px] text-amber-900 space-y-1">
              <p className="font-bold">【プライバシー・注意事項】</p>
              <p>・レシートやクレジットカード、人物の顔など個人情報が写り込んでいないことをご確認ください。</p>
              <p>・AIの読み取り結果は必ず保存前にご自身で確認・修正いただけます。</p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAiConsentModal(false)}
                className="bg-gray-100 text-gray-700 font-semibold text-xs py-2 rounded-xl"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={triggerAiAnalysis}
                className="bg-tomori-primary text-white font-bold text-xs py-2 rounded-xl shadow"
              >
                同意して解析
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
