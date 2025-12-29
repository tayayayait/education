import React from 'react';
import { Requirement } from './types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';

export interface RequirementsListProps {
  items: Requirement[];
  loading: boolean;
  selectedId: string | null;
  categories: string[];
  filterCategory: string;
  filterSearch: string;
  onFilterCategoryChange: (value: string) => void;
  onFilterSearchChange: (value: string) => void;
  onApplyFilters: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenImport: () => void;
  onRefresh: () => void;
}

export const RequirementsList: React.FC<RequirementsListProps> = ({
  items,
  loading,
  selectedId,
  categories,
  filterCategory,
  filterSearch,
  onFilterCategoryChange,
  onFilterSearchChange,
  onApplyFilters,
  onSelect,
  onDelete,
  onOpenImport,
  onRefresh
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>요구사항 목록</CardTitle>
          <div className="text-sm text-text-secondary mt-1">총 {items.length}건</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={onRefresh}>새로고침</Button>
          <Button variant="primary" onClick={onOpenImport}>요구사항 Import</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-2 md:grid-cols-[1.2fr_1fr_auto]">
          <Input
            placeholder="코드/명칭 검색"
            value={filterSearch}
            onChange={(e) => onFilterSearchChange(e.target.value)}
          />
          <Select value={filterCategory} onChange={(e) => onFilterCategoryChange(e.target.value)}>
            <option value="">분류 전체</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
          <Button variant="secondary" onClick={onApplyFilters}>조회</Button>
        </div>

        <div className="overflow-auto border border-border rounded-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>코드</TableHead>
                <TableHead>분류</TableHead>
                <TableHead>명칭</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-text-secondary py-6">
                    불러오는 중...
                  </TableCell>
                </TableRow>
              )}
              {!loading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-text-secondary py-6">
                    요구사항이 없습니다.
                  </TableCell>
                </TableRow>
              )}
              {items.map(item => (
                <TableRow
                  key={item.id}
                  className={selectedId === item.id ? 'bg-primary/10' : undefined}
                >
                  <TableCell className="font-semibold text-text-primary">
                    {item.code}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{item.category}</Badge>
                  </TableCell>
                  <TableCell className="cursor-pointer" onClick={() => onSelect(item.id)}>
                    <div className="font-medium text-text-primary">{item.name}</div>
                    {item.description && <div className="text-xs text-text-secondary mt-1">{item.description}</div>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => onSelect(item.id)}>
                        보기
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => onDelete(item.id)}>
                        삭제
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
