import React, { useEffect, useMemo, useState } from 'react';
import { Badge } from './ui/Badge';

export interface TipCarouselProps {
  tips?: string[];
  intervalMs?: number;
}

const defaultTips = [
  'Tab 키로 빠르게 이동하며 입력할 수 있습니다.',
  '학생 이름은 검색창에서 바로 찾을 수 있습니다.',
  '리포트 버튼을 눌러 즉시 분석 결과를 확인하세요.'
];

export const TipCarousel: React.FC<TipCarouselProps> = ({ tips, intervalMs = 4500 }) => {
  const tipList = useMemo(() => (tips && tips.length > 0 ? tips : defaultTips), [tips]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (tipList.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex(prev => (prev + 1) % tipList.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [tipList.length, intervalMs]);

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-xs text-text-secondary">
        <Badge variant="info">Tip</Badge>
        <span>{tipList[index]}</span>
      </div>
      <div className="flex items-center gap-1">
        {tipList.map((_, i) => (
          <span
            key={`tip-dot-${i}`}
            className={`h-1.5 w-1.5 rounded-full ${i === index ? 'bg-primary' : 'bg-slate-300'}`}
          />
        ))}
      </div>
    </div>
  );
};
