import React from 'react';
import { CttStat, DetectionResult, ExposureStat, IrtParam } from './types';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  flagged: 'warning',
  resolved: 'success'
};

export interface ResultTablesProps {
  cttStats: CttStat[];
  irtParams: IrtParam[];
  exposureStats: ExposureStat[];
  detections: DetectionResult[];
  onOpenDetectionAction: (detection: DetectionResult) => void;
}

export const ResultTables: React.FC<ResultTablesProps> = ({
  cttStats,
  irtParams,
  exposureStats,
  detections,
  onOpenDetectionAction
}) => {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>CTT 결과</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[320px] overflow-auto border border-border rounded-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>N</TableHead>
                  <TableHead>p</TableHead>
                  <TableHead>Discrim</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cttStats.map(stat => (
                  <TableRow key={stat.id}>
                    <TableCell className="font-semibold text-text-primary">{stat.item_id}</TableCell>
                    <TableCell>{stat.n}</TableCell>
                    <TableCell>{stat.p_value?.toFixed(3) ?? '-'}</TableCell>
                    <TableCell>{stat.point_biserial?.toFixed(3) ?? '-'}</TableCell>
                    <TableCell>{stat.mean_time_ms?.toFixed(0) ?? '-'}</TableCell>
                  </TableRow>
                ))}
                {cttStats.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-text-secondary py-6">
                      CTT 데이터가 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>IRT 파라미터</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[320px] overflow-auto border border-border rounded-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>a</TableHead>
                  <TableHead>b</TableHead>
                  <TableHead>n</TableHead>
                  <TableHead>Method</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {irtParams.map(param => (
                  <TableRow key={param.id}>
                    <TableCell className="font-semibold text-text-primary">{param.item_id}</TableCell>
                    <TableCell>{param.a_param?.toFixed(3) ?? '-'}</TableCell>
                    <TableCell>{param.b_param?.toFixed(3) ?? '-'}</TableCell>
                    <TableCell>{param.n ?? '-'}</TableCell>
                    <TableCell className="text-text-secondary">{param.estimation_method ?? '-'}</TableCell>
                  </TableRow>
                ))}
                {irtParams.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-text-secondary py-6">
                      IRT 데이터가 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>노출/풀이시간</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[320px] overflow-auto border border-border rounded-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Exposure</TableHead>
                  <TableHead>Mean Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exposureStats.map(stat => (
                  <TableRow key={stat.id}>
                    <TableCell className="font-semibold text-text-primary">{stat.item_id}</TableCell>
                    <TableCell>{stat.exposure_count}</TableCell>
                    <TableCell>{stat.mean_time_ms?.toFixed(0) ?? '-'}</TableCell>
                  </TableRow>
                ))}
                {exposureStats.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-text-secondary py-6">
                      노출 데이터가 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>탐지 결과</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[320px] overflow-auto border border-border rounded-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>유형</TableHead>
                  <TableHead>지표</TableHead>
                  <TableHead>값/임계</TableHead>
                  <TableHead className="text-right">조치</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detections.map(det => (
                  <TableRow key={det.id}>
                    <TableCell className="font-semibold text-text-primary">{det.item_id}</TableCell>
                    <TableCell>{det.detection_type}</TableCell>
                    <TableCell>{det.metric_name}</TableCell>
                    <TableCell>{det.metric_value?.toFixed(3) ?? '-'} / {det.threshold ?? '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Badge variant={statusVariant[det.status] ?? 'default'}>{det.status}</Badge>
                        <Button size="sm" variant="secondary" onClick={() => onOpenDetectionAction(det)}>
                          조치
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {detections.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-text-secondary py-6">
                      탐지 결과가 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
