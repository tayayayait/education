import React, { useEffect, useMemo, useState } from 'react';
import { createApiClient } from '../../../services/apiClient';
import { Button } from '../../../components/ui/Button';
import { AnalyticsSummaryCards } from './AnalyticsSummaryCards';
import { RunTimeline } from './RunTimeline';
import { ResultTables } from './ResultTables';
import { DetectionActionModal } from './DetectionActionModal';
import { AnalysisRun, CttStat, DetectionResult, ExposureStat, IrtParam } from './types';

const api = createApiClient({ baseUrl: import.meta.env.VITE_API_BASE_URL });

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('ko-KR');
};

const truncateJson = (value?: Record<string, unknown> | null) => {
  if (!value) return '-';
  const text = JSON.stringify(value);
  return text.length > 120 ? `${text.slice(0, 120)}…` : text;
};

export const AnalyticsPage: React.FC = () => {
  const [runs, setRuns] = useState<AnalysisRun[]>([]);
  const [cttStats, setCttStats] = useState<CttStat[]>([]);
  const [irtParams, setIrtParams] = useState<IrtParam[]>([]);
  const [exposureStats, setExposureStats] = useState<ExposureStat[]>([]);
  const [detections, setDetections] = useState<DetectionResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [itemId, setItemId] = useState('');
  const [detectionStatus, setDetectionStatus] = useState('flagged');
  const [ingestFile, setIngestFile] = useState<File | null>(null);

  const [selectedDetection, setSelectedDetection] = useState<DetectionResult | null>(null);
  const [isActionOpen, setIsActionOpen] = useState(false);

  const detectionSummary = useMemo(() => {
    return detections.reduce<Record<string, number>>((acc, item) => {
      acc[item.detection_type] = (acc[item.detection_type] ?? 0) + 1;
      return acc;
    }, {});
  }, [detections]);

  const loadRuns = async () => {
    const data = await api.get<{ items: AnalysisRun[] }>('/analytics/runs');
    setRuns(data.items ?? []);
  };

  const loadCtt = async () => {
    const query = itemId ? `?itemId=${itemId}` : '';
    const data = await api.get<{ items: CttStat[] }>(`/analytics/ctt${query}`);
    setCttStats(data.items ?? []);
  };

  const loadIrt = async () => {
    const query = itemId ? `?itemId=${itemId}` : '';
    const data = await api.get<{ items: IrtParam[] }>(`/analytics/irt${query}`);
    setIrtParams(data.items ?? []);
  };

  const loadExposure = async () => {
    const query = itemId ? `?itemId=${itemId}` : '';
    const data = await api.get<{ items: ExposureStat[] }>(`/analytics/exposures${query}`);
    setExposureStats(data.items ?? []);
  };

  const loadDetections = async () => {
    const query = detectionStatus ? `?status=${detectionStatus}` : '';
    const data = await api.get<{ items: DetectionResult[] }>(`/analytics/detections${query}`);
    setDetections(data.items ?? []);
  };

  const loadAll = async () => {
    setError(null);
    try {
      await Promise.all([loadRuns(), loadCtt(), loadIrt(), loadExposure(), loadDetections()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터를 불러오지 못했습니다.');
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const handleIngest = async () => {
    if (!ingestFile) return;
    setError(null);
    setInfo(null);
    try {
      const text = await ingestFile.text();
      const payload = JSON.parse(text);
      await api.post('/analytics/ingest', payload);
      setInfo('데이터 적재가 완료되었습니다. 워커 배치를 실행하세요.');
      setIngestFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터 적재 실패');
    }
  };

  const handleDetectionAction = async (id: string, actionType: string, note: string) => {
    if (!actionType) return;
    setError(null);
    try {
      await api.post(`/analytics/detections/${id}/action`, {
        actionType,
        note: note || undefined
      });
      await loadDetections();
      setInfo('조치가 기록되었습니다.');
      setIsActionOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '조치 등록 실패');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-text-primary">CTT/IRT/탐지 배치 결과</h3>
          <p className="text-sm text-text-secondary mt-2">
            워커 배치 실행 후 지표가 적재되었는지 확인하고 탐지 조치를 기록합니다.
          </p>
        </div>
        <Button variant="secondary" onClick={loadAll}>전체 새로고침</Button>
      </div>

      {error && (
        <div className="rounded-sm border border-danger/20 bg-danger/10 text-danger text-sm p-3">
          {error}
        </div>
      )}
      {info && (
        <div className="rounded-sm border border-success/20 bg-success/10 text-success text-sm p-3">
          {info}
        </div>
      )}

      <AnalyticsSummaryCards
        ingestFile={ingestFile}
        onFileChange={setIngestFile}
        onIngest={handleIngest}
        itemId={itemId}
        onItemIdChange={setItemId}
        detectionStatus={detectionStatus}
        onDetectionStatusChange={setDetectionStatus}
        onApplyFilters={loadAll}
        detectionSummary={detectionSummary}
      />

      <RunTimeline runs={runs} formatDate={formatDate} truncateJson={truncateJson} />

      <ResultTables
        cttStats={cttStats}
        irtParams={irtParams}
        exposureStats={exposureStats}
        detections={detections}
        onOpenDetectionAction={(detection) => {
          setSelectedDetection(detection);
          setIsActionOpen(true);
        }}
      />

      <DetectionActionModal
        open={isActionOpen}
        detection={selectedDetection}
        onOpenChange={setIsActionOpen}
        onSubmit={(actionType, note) => {
          if (!selectedDetection) return;
          void handleDetectionAction(selectedDetection.id, actionType, note);
        }}
      />
    </div>
  );
};
