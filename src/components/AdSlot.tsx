import React, { useEffect, useRef, useState } from 'react';
import { Card } from './ui/card';
import { AdLabel } from './AdLabel';

// AdSense設定
const ADSENSE_CLIENT_ID = 'ca-pub-9899334610612784';
const ADSENSE_SCRIPT_URL = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;

// AdSenseスクリプトを動的に読み込む
let adSenseScriptLoaded = false;
let adSenseScriptLoading = false;

function loadAdSenseScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // 既に読み込み済み
    if (adSenseScriptLoaded) {
      resolve();
      return;
    }

    // 読み込み中
    if (adSenseScriptLoading) {
      // 既存のスクリプトの読み込みを待つ
      const checkInterval = setInterval(() => {
        if (adSenseScriptLoaded) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!adSenseScriptLoaded) {
          reject(new Error('AdSense script loading timeout'));
        }
      }, 10000);
      return;
    }

    adSenseScriptLoading = true;

    // スクリプトタグを作成
    const script = document.createElement('script');
    script.src = ADSENSE_SCRIPT_URL;
    script.async = true;
    script.crossOrigin = 'anonymous';

    script.onload = () => {
      adSenseScriptLoaded = true;
      adSenseScriptLoading = false;
      console.log('✅ AdSense script loaded successfully');
      resolve();
    };

    script.onerror = () => {
      adSenseScriptLoading = false;
      console.error('❌ Failed to load AdSense script');
      reject(new Error('Failed to load AdSense script'));
    };

    document.head.appendChild(script);
  });
}

/**
 * AdSlot - 広告枠コンポーネント
 * 
 * 【レイアウトシフト回避】
 * - 固定高さのプレースホルダーを先に描画
 * - 広告SDKは初回描画から500〜1000ms遅延でロード
 * - 広告が表示されない場合もスペースを確保
 * 
 * 【モーダル表示中の非表示】
 * - isModalOpen prop で制御
 * - モーダル表示中は広告を非表示にして誤クリック防止
 * 
 * 【A/Bテスト対応】
 * - enabled prop で配置ON/OFF可能
 * - 初期はfalseにしてステージング環境ではダミー表示
 * 
 * 【パフォーマンス】
 * - IntersectionObserverで画面内に入った時のみロード
 * - ログ・モニタリングでエラーやタイムアウトを検出
 */

export type AdSlotVariant = 'banner' | 'rectangle' | 'native';

interface AdSlotProps {
  /** 広告枠のバリアント */
  variant?: AdSlotVariant;
  /** 広告を有効化するか（A/Bテスト用） */
  enabled?: boolean;
  /** モーダルが開いているか */
  isModalOpen?: boolean;
  /** 広告枠のID（複数配置時の識別用） */
  slotId?: string;
  /** AdSense広告ユニットID（data-ad-slot） */
  adUnitId?: string;
  /** カスタムクラス名 */
  className?: string;
}

// バリアントごとのサイズ定義
const VARIANT_STYLES = {
  banner: {
    height: '100px', // 320×100相当
    aspectRatio: '320 / 100',
  },
  rectangle: {
    height: '250px', // 300×250相当
    aspectRatio: '300 / 250',
  },
  native: {
    height: 'auto',
    minHeight: '120px',
  },
} as const;

/**
 * 広告コンポーネント（デザインプレースホルダー）
 * 
 * 実装時の注意:
 * 1. 本番環境では広告SDKのスクリプトタグを<head>に追加
 * 2. このコンポーネント内でSDKの広告ユニットをレンダリング
 * 3. ステージング環境ではこのプレースホルダーを表示
 */
export const AdSlot: React.FC<AdSlotProps> = ({
  variant = 'banner',
  enabled = false,
  isModalOpen = false,
  slotId = 'ad-slot-default',
  adUnitId = '', // AdSense管理画面で取得した広告ユニットID
  className = '',
}) => {
  const adRef = useRef<HTMLDivElement>(null);
  const insRef = useRef<HTMLModElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const adPushedRef = useRef(false); // 広告push済みフラグ

  // Step 1: IntersectionObserverで画面内に入った時にスクリプトをロード
  useEffect(() => {
    if (!enabled || !adRef.current || scriptReady) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
            
            // 500ms遅延で広告スクリプトを読み込み
            setTimeout(async () => {
              try {
                await loadAdSenseScript();
                setScriptReady(true);
                console.log('✅ AdSense script ready for slot:', slotId);
              } catch (error) {
                console.error('❌ Failed to load AdSense script:', error);
              }
            }, 500);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(adRef.current);

    return () => {
      if (adRef.current) {
        observer.unobserve(adRef.current);
      }
    };
  }, [enabled, isVisible, slotId, scriptReady]);

  // Step 2: <ins>要素がDOMに追加されたら、adsbygoogle.push()を呼び出す
  useEffect(() => {
    if (!scriptReady || !insRef.current || adPushedRef.current || !adUnitId) return;

    // <ins>要素が実際にDOMに存在することを確認
    if (!document.body.contains(insRef.current)) {
      return;
    }

    // 少し待ってからpushする（DOMが完全に準備されるまで）
    const timer = setTimeout(() => {
      try {
        if (typeof window !== 'undefined' && (window as any).adsbygoogle && insRef.current) {
          // この<ins>要素が既に初期化されているかチェック
          const insElement = insRef.current;
          if (insElement.getAttribute('data-adsbygoogle-status')) {
            console.warn('⚠️ Ad already initialized for slot:', slotId);
            return;
          }

          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          adPushedRef.current = true;
          console.log('✅ AdSense ad pushed for slot:', slotId);
        }
      } catch (error) {
        console.error('❌ AdSense push error for slot:', slotId, error);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [scriptReady, adUnitId, slotId]);

  // 広告が無効化されている場合は何も表示しない
  if (!enabled) {
    return null;
  }

  // モーダル表示中は非表示
  if (isModalOpen) {
    return null;
  }

  const styles = VARIANT_STYLES[variant];

  return (
    <div
      ref={adRef}
      className={`w-full ${className}`}
      style={{
        paddingTop: '8px',
        paddingBottom: '8px',
      }}
    >
      <Card
        className="overflow-hidden bg-gray-50 border border-gray-200"
        style={{
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          borderRadius: '12px',
        }}
      >
        {/* 広告ラベル */}
        <div className="px-3 pt-2">
          <AdLabel />
        </div>

        {/* 広告コンテンツエリア */}
        <div
          className="w-full flex items-center justify-center bg-white"
          style={{
            height: styles.height,
            minHeight: styles.minHeight,
          }}
        >
          {/* スクリプト未読み込み時のプレースホルダー */}
          {!scriptReady && (
            <div className="text-center p-4">
              <div className="text-gray-400 text-sm">
                {variant === 'native' ? (
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-5/6 mx-auto"></div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-xs text-gray-300">広告枠</div>
                    <div className="text-xs text-gray-300">
                      {variant === 'banner' ? '320×100' : '300×250'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 本番環境: ここに広告SDKのコンテンツが表示される */}
          {scriptReady && adUnitId && (
            <ins
              ref={insRef}
              className="adsbygoogle"
              style={{
                display: 'block',
                width: '100%',
                height: variant === 'native' ? 'auto' : styles.height,
              }}
              data-ad-client={ADSENSE_CLIENT_ID}
              data-ad-slot={adUnitId}
              data-ad-format={variant === 'native' ? 'fluid' : 'auto'}
              data-full-width-responsive="true"
            />
          )}
          
          {scriptReady && !adUnitId && (
            <div className="text-gray-400 text-xs text-center p-4">
              広告ユニットIDが設定されていません。<br />
              AdSense管理画面で広告ユニットを作成し、<br />
              adUnitId propに設定してください。
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

/**
 * 実装メモ
 * 
 * 【広告SDK統合時の手順】
 * 
 * 1. 広告ネットワーク選定
 *    - Google AdSense（導入容易）
 *    - Google Ad Manager（運用強化）
 *    - その他ネットワーク
 * 
 * 2. スクリプトタグ追加
 *    - index.htmlの<head>にSDKスクリプトを追加
 *    - 例: <script async src="https://pagead2.googlesyndication.com/..."></script>
 * 
 * 3. 広告ユニット作成
 *    - ネットワーク管理画面で広告ユニットを作成
 *    - サイズ: レスポンシブ or 固定サイズ
 * 
 * 4. コンポーネント内で広告表示
 *    - useEffect内でSDKの広告表示APIを呼び出し
 *    - 例: googletag.defineSlot(...).addService(googletag.pubads());
 * 
 * 5. エラーハンドリング
 *    - 広告ロード失敗時のフォールバック
 *    - タイムアウト処理（3秒以内にロードされない場合）
 * 
 * 6. モニタリング
 *    - 広告表示率、CTR、ビューアビリティ
 *    - スクロール深度、離脱率
 * 
 * 【コンプライアンス】
 * - 「広告」ラベルを明示（AdLabel使用）
 * - プライバシーポリシー、クッキーポリシーの整備
 * - 年齢配慮、コンテンツカテゴリ制限の設定
 */
