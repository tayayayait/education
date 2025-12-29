import React from 'react';
import { GenerationItem } from './types';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  ready_for_review: 'warning',
  reviewed: 'info',
  approved: 'success',
  rejected: 'danger'
};

export interface ItemReviewTableProps {
  items: GenerationItem[];
  onReview: (id: string, decision: 'accept' | 'reject') => void;
  onApprove: (id: string) => void;
}

export const ItemReviewTable: React.FC<ItemReviewTableProps> = ({ items, onReview, onApprove }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>생성 문항 리스트</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-auto border border-border rounded-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>순번</TableHead>
                <TableHead>지문</TableHead>
                <TableHead>정답</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => (
                <TableRow key={item.id}>
                  <TableCell>{item.sequence}</TableCell>
                  <TableCell className="max-w-[320px] text-xs text-text-secondary">{item.stem}</TableCell>
                  <TableCell>{item.answer}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[item.status] ?? 'default'}>{item.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {item.status === 'ready_for_review' && (
                        <>
                          <Button size="sm" variant="secondary" onClick={() => onReview(item.id, 'accept')}>
                            검토 통과
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => onReview(item.id, 'reject')}>
                            반려
                          </Button>
                        </>
                      )}
                      {item.status === 'reviewed' && (
                        <Button size="sm" variant="primary" onClick={() => onApprove(item.id)}>
                          승인
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-text-secondary py-6">
                    생성된 문항이 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
