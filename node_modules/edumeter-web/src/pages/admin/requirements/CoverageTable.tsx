import React from 'react';
import { CoverageRow } from './types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/Tabs';

const StatusBadge: React.FC<{ value: boolean }> = ({ value }) => (
  <Badge variant={value ? 'success' : 'danger'}>{value ? 'YES' : 'NO'}</Badge>
);

export interface CoverageTableProps {
  items: CoverageRow[];
  noncompliantItems: CoverageRow[];
}

const CoverageTableView: React.FC<{ rows: CoverageRow[] }> = ({ rows }) => {
  return (
    <div className="overflow-auto border border-border rounded-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>코드</TableHead>
            <TableHead>명칭</TableHead>
            <TableHead>설계</TableHead>
            <TableHead>테스트</TableHead>
            <TableHead>PASS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(row => (
            <TableRow key={row.id}>
              <TableCell className="font-semibold text-text-primary">{row.code}</TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell><StatusBadge value={row.has_design} /></TableCell>
              <TableCell><StatusBadge value={row.has_test} /></TableCell>
              <TableCell><StatusBadge value={row.has_pass} /></TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-text-secondary py-6">
                데이터가 없습니다.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export const CoverageTable: React.FC<CoverageTableProps> = ({ items, noncompliantItems }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>커버리지 상세</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">전체</TabsTrigger>
            <TabsTrigger value="noncompliant">미준수</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <CoverageTableView rows={items} />
          </TabsContent>
          <TabsContent value="noncompliant">
            <CoverageTableView rows={noncompliantItems} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
