import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';

export interface ReviewQueueCardProps {
  count: number;
}

export const ReviewQueueCard: React.FC<ReviewQueueCardProps> = ({ count }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>검토 대기</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-text-secondary">현재 검토 대기 문항</div>
        <div className="mt-2 text-2xl font-bold text-text-primary">{count}건</div>
      </CardContent>
    </Card>
  );
};
