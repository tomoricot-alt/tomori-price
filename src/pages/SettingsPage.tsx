import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Upload,
  FileSpreadsheet,
  Key,
  Database,
  Shield,
  RefreshCw,
  Check,
  AlertCircle,
  ExternalLink,
  HardDrive,
} from 'lucide-react';
import type { AppSettings } from '../types';
import {
  exportBackupJson,
  restoreFromJson,
  exportProductsCsv,
  getStorageEstimate,
  seedInitialTestDataIfEmpty,
} from '../db/indexedDb';

interface SettingsPageProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => Promise<void>;
  onRefreshData: () => Promise<void>;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onUpdateSettings,
  onRefreshData,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState<string>(settings.geminiApiKey || '');
  const [storageInfo, setStorageInfo] = useState<{ usageMB: number; itemCount: number }>({
    usageMB: 0,
    itemCount: 0,
  });
  const [restoreStatus, setRestoreStatus] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const jsonFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadStorageInfo();
  }, []);

  const loadStorageInfo = async () => {
    const info = await getStorageEstimate();
    setStorageInfo(info);
  };

  // APIキー保存
  const handleSaveApiKey = async () => {
    await onUpdateSettings({
      ...settings,
      geminiApiKey: apiKeyInput.trim(),
    });
    setSuccessMessage('Gemini APIキーを端末内に安全に保存しました');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // JSONバックアップダウンロード
  const handleExportJson = async () => {
    try {
      const json = await exportBackupJson();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `tomori-price-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccessMessage('バックアップファイル (.json) をダウンロードしました');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(`エクスポート失敗: ${err.message}`);
    }
  };

  // CSVダウンロード
  const handleExportCsv = async () => {
    try {
      const csv = await exportProductsCsv();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `tomori-price-products-${dateStr}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccessMessage('商品データ (.csv) をダウンロードしました');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setErrorMessage(`CSVエクスポート失敗: ${err.message}`);
    }
  };

  // JSON復元ファイル読み込み
  const handleRestoreFile = async (file: File) => {
    try {
      setErrorMessage('');
      setRestoreStatus('データを検証中...');
      const text = await file.text();
      const result = await restoreFromJson(text, true);
      setRestoreStatus('');
      await onRefreshData();
      await loadStorageInfo();
      setSuccessMessage(`復元完了: 新規追加 ${result.addedProducts}件, スキップ ${result.skippedProducts}件`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setRestoreStatus('');
      setErrorMessage(`復元に失敗しました: ${err.message}`);
    }
  };

  // テストデータの再投入
  const handleResetTestData = async () => {
    const ok = window.confirm(
      '指示書の写真A・写真Bのテストデータ（オリーブオイル・パスタ）をデータベースに追加しますか？'
    );
    if (!ok) return;

    await seedInitialTestDataIfEmpty();
    await onRefreshData();
    await loadStorageInfo();
    setSuccessMessage('テストデータを読み込みました');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="pb-24 pt-3 px-4 max-w-md mx-auto space-y-4">
      {/* 通知 */}
      {successMessage && (
        <div className="bg-emerald-600 text-white p-3 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-sm">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ストレージ情報 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-tomori-border space-y-3">
        <h3 className="text-xs font-bold text-gray-800 flex items-center space-x-1.5">
          <HardDrive className="w-4 h-4 text-tomori-primary" />
          <span>データ保存状況（IndexedDB）</span>
        </h3>
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="bg-tomori-bg p-3 rounded-xl border border-tomori-border">
            <span className="text-[10px] text-gray-400 block mb-0.5">登録商品数</span>
            <span className="text-base font-bold text-gray-900">{storageInfo.itemCount} 件</span>
          </div>
          <div className="bg-tomori-bg p-3 rounded-xl border border-tomori-border">
            <span className="text-[10px] text-gray-400 block mb-0.5">写真・推定容量</span>
            <span className="text-base font-bold text-gray-900">{storageInfo.usageMB} MB</span>
          </div>
        </div>
        <p className="text-[11px] text-gray-500 leading-relaxed">
          ※データはお使いの端末のブラウザ（IndexedDB）内に暗号化・ローカル保存されます。ブラウザのキャッシュや履歴を完全に消去するとデータが消える可能性があるため、定期的なバックアップを推奨します。
        </p>
      </div>

      {/* バックアップと復元 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-tomori-border space-y-3">
        <h3 className="text-xs font-bold text-gray-800 flex items-center space-x-1.5">
          <Database className="w-4 h-4 text-tomori-primary" />
          <span>バックアップとエクスポート</span>
        </h3>

        <div className="grid grid-cols-2 gap-2">
          {/* JSONダウンロード */}
          <button
            onClick={handleExportJson}
            className="flex items-center justify-center space-x-1.5 bg-tomori-bg hover:bg-tomori-sand border border-tomori-border p-2.5 rounded-xl text-xs font-bold text-gray-700 transition-colors"
          >
            <Download className="w-4 h-4 text-tomori-primary" />
            <span>JSON保存</span>
          </button>

          {/* CSVエクスポート */}
          <button
            onClick={handleExportCsv}
            className="flex items-center justify-center space-x-1.5 bg-tomori-bg hover:bg-tomori-sand border border-tomori-border p-2.5 rounded-xl text-xs font-bold text-gray-700 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>CSV出力</span>
          </button>
        </div>

        {/* JSON復元 */}
        <div className="pt-2 border-t border-gray-100">
          <input
            ref={jsonFileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleRestoreFile(e.target.files[0]);
            }}
          />
          <button
            onClick={() => jsonFileInputRef.current?.click()}
            className="w-full flex items-center justify-center space-x-1.5 bg-white hover:bg-gray-50 border border-dashed border-gray-300 p-2.5 rounded-xl text-xs font-semibold text-gray-600 transition-colors"
          >
            <Upload className="w-4 h-4 text-gray-400" />
            <span>JSONファイルから復元（重複は自動スキップ）</span>
          </button>
        </div>

        {restoreStatus && (
          <p className="text-[11px] text-tomori-primary animate-pulse text-center">{restoreStatus}</p>
        )}
      </div>

      {/* AI設定 (Gemini API) */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-tomori-border space-y-3">
        <h3 className="text-xs font-bold text-gray-800 flex items-center space-x-1.5">
          <Key className="w-4 h-4 text-amber-500" />
          <span>Gemini API 設定（オプション）</span>
        </h3>
        <p className="text-[11px] text-gray-500 leading-relaxed">
          Google AI Studioで無料取得できるGemini APIキーを設定すると、ご自身の無料枠で高精度な画像解析を利用できます。（未設定でもサンプル写真や手動入力はそのまま利用可能です）
        </p>

        <div className="space-y-2">
          <input
            type="password"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder="AIzaSy... (Gemini API Key)"
            className="w-full bg-tomori-bg border border-tomori-border rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-tomori-primary"
          />
          <div className="flex items-center justify-between">
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-tomori-accent hover:underline flex items-center"
            >
              無料キーの取得はこちら (Google AI Studio)
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </a>
            <button
              onClick={handleSaveApiKey}
              className="bg-tomori-primary hover:bg-tomori-dark text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow transition-transform active:scale-95"
            >
              キーを保存
            </button>
          </div>
        </div>
      </div>

      {/* テストデータ操作 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-tomori-border space-y-2">
        <h3 className="text-xs font-bold text-gray-800 flex items-center space-x-1.5">
          <RefreshCw className="w-4 h-4 text-tomori-primary" />
          <span>テストデータ操作</span>
        </h3>
        <p className="text-[11px] text-gray-500">
          指示書で指定されたオリーブオイル（682g/798円、456g/1080円）とパスタ（1kg/228円、700g/248円）のテストデータを追加できます。
        </p>
        <button
          onClick={handleResetTestData}
          className="w-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 py-2 rounded-xl hover:bg-amber-100 transition-colors"
        >
          テストデータを投入する
        </button>
      </div>

      {/* プライバシーとセキュリティ方針 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-tomori-border space-y-2 text-[11px] text-gray-500">
        <h3 className="text-xs font-bold text-gray-800 flex items-center space-x-1.5">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span>セキュリティとプライバシー方針</span>
        </h3>
        <ul className="space-y-1 list-disc list-inside leading-relaxed">
          <li>新規課金は発生しません（完全無料枠の範囲で動作します）。</li>
          <li>APIキーはお使いのブラウザ内（IndexedDB）にのみ保存され、外部公開されません。</li>
          <li>写真は許可なく外部公開されず、AI解析時のみGoogle Gemini APIへ送信されます。</li>
        </ul>
      </div>
    </div>
  );
};
