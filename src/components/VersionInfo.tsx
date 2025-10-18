import React from 'react';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Separator } from './ui/separator';

interface VersionInfoProps {
  compact?: boolean;
}

export function VersionInfo({ compact = false }: VersionInfoProps) {
  const version = "1.0.0";
  const buildDate = "2025-01-08";
  const buildNumber = "162";

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>LIVME</span>
        <Badge variant="outline" className="px-2 py-1">
          v{version}
        </Badge>
      </div>
    );
  }

  return (
    <Card className="p-4 bg-gray-50 border-gray-200">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-lg font-bold text-primary">LIVME</div>
            <Badge variant="default" className="bg-primary text-white">
              v{version}
            </Badge>
            <Badge variant="outline" className="text-xs">
              正式リリース
            </Badge>
          </div>
        </div>
        
        <Separator />
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">バージョン</div>
            <div className="font-medium">{version}</div>
          </div>
          <div>
            <div className="text-muted-foreground">ビルド番号</div>
            <div className="font-medium">{buildNumber}</div>
          </div>
          <div>
            <div className="text-muted-foreground">リリース日</div>
            <div className="font-medium">{buildDate}</div>
          </div>
          <div>
            <div className="text-muted-foreground">ステータス</div>
            <div className="font-medium text-green-600">本番環境</div>
          </div>
        </div>
        
        <Separator />
        
        <div className="text-xs text-muted-foreground">
          <div className="font-medium mb-1">v1.0.0の特徴:</div>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>高速プロフィール同期</li>
            <li>リアルタイム同期機能</li>
            <li>オフライン対応</li>
            <li>モバイルファースト設計</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}

export default VersionInfo;