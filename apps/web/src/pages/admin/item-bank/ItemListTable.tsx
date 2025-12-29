import React from 'react';
import { ItemRow } from './types';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';

const statusLabel: Record<string, string> = {
  draft: '초안',
  review: '검토',
  approved: '승인',
  published: '배포',
  retired: '폐기'
};

const statusVariant: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
  draft: 'default',
  review: 'warning',
  approved: 'success',
  published: 'info',
  retired: 'danger'
};

export interface ItemListTableProps {
  items: ItemRow[];
  loading: boolean;
  onSelect: (item: ItemRow) => void;
  onAction: (id: string, action: string) => void;
}

export const ItemListTable: React.FC<ItemListTableProps> = ({ items, loading, onSelect, onAction }) => {
  return (
    <div className="overflow-auto border border-border rounded-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>코드</TableHead>
            <TableHead>제목</TableHead>
            <TableHead>과목/학년</TableHead>
            <TableHead>성취기준</TableHead>
            <TableHead>상태</TableHead>
            <TableHead className="text-right">작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-text-secondary py-6">
                불러오는 중...
              </TableCell>
            </TableRow>
          )}
          {!loading && items.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-text-secondary py-6">
                문항이 없습니다.
              </TableCell>
            </TableRow>
          )}
          {items.map(item => (
            <TableRow key={item.id}>
              <TableCell className="font-semibold text-text-primary">{item.code}</TableCell>
              <TableCell>
                <div className="font-medium text-text-primary">{item.title}</div>
              </TableCell>
              <TableCell>{item.subject} / {item.grade}</TableCell>
              <TableCell className="text-xs text-text-secondary">{item.standard_code ?? '-'}</TableCell>
              <TableCell>
                <Badge variant={statusVariant[item.status] ?? 'default'}>
                  {statusLabel[item.status] ?? item.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => onSelect(item)}>
                    편집
                  </Button>
                  {item.status === 'draft' && (
                    <Button variant="secondary" size="sm" onClick={() => onAction(item.id, 'submit-review')}>
                      검토 요청
                    </Button>
                  )}
                  {item.status === 'review' && (
                    <>
                      <Button variant="primary" size="sm" onClick={() => onAction(item.id, 'approve')}>
                        승인
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => onAction(item.id, 'reject')}>
                        반려
                      </Button>
                    </>
                  )}
                  {item.status === 'approved' && (
                    <Button variant="secondary" size="sm" onClick={() => onAction(item.id, 'publish')}>
                      배포
                    </Button>
                  )}
                  {['approved', 'published'].includes(item.status) && (
                    <Button variant="ghost" size="sm" onClick={() => onAction(item.id, 'retire')}>
                      폐기
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
