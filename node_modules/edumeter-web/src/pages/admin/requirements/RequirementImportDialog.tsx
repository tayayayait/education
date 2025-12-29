import React from 'react';
import { Baseline } from './types';
import { Modal, ModalBody, ModalDescription, ModalFooter, ModalHeader, ModalTitle } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';

export interface RequirementImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  importFile: File | null;
  onFileChange: (file: File | null) => void;
  importFormat: 'csv' | 'json';
  onFormatChange: (format: 'csv' | 'json') => void;
  importBaseline: { version: string; title: string; description: string };
  onBaselineChange: (next: { version: string; title: string; description: string }) => void;
  baselines: Baseline[];
  onImport: () => void;
}

export const RequirementImportDialog: React.FC<RequirementImportDialogProps> = ({
  open,
  onOpenChange,
  importFile,
  onFileChange,
  importFormat,
  onFormatChange,
  importBaseline,
  onBaselineChange,
  baselines,
  onImport
}) => {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalHeader>
        <ModalTitle>요구사항 Import</ModalTitle>
        <ModalDescription>CSV/JSON 파일로 요구사항을 대량 등록합니다.</ModalDescription>
      </ModalHeader>
      <ModalBody className="space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-text-secondary">파일 선택</label>
          <input
            type="file"
            accept=".csv,.json"
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          />
          {importFile && <div className="text-xs text-text-secondary">선택: {importFile.name}</div>}
        </div>
        <Select value={importFormat} onChange={(e) => onFormatChange(e.target.value as 'csv' | 'json')}>
          <option value="csv">CSV</option>
          <option value="json">JSON</option>
        </Select>
        <Input
          placeholder="베이스라인 버전 (선택)"
          value={importBaseline.version}
          onChange={(e) => onBaselineChange({ ...importBaseline, version: e.target.value })}
        />
        <Input
          placeholder="베이스라인 제목 (선택)"
          value={importBaseline.title}
          onChange={(e) => onBaselineChange({ ...importBaseline, title: e.target.value })}
        />
        <Textarea
          rows={2}
          placeholder="베이스라인 설명 (선택)"
          value={importBaseline.description}
          onChange={(e) => onBaselineChange({ ...importBaseline, description: e.target.value })}
        />
        <div className="text-xs text-text-secondary">
          최근 베이스라인: {baselines[0]?.version ?? '-'} ({baselines[0]?.title ?? '제목 없음'})
        </div>
      </ModalBody>
      <ModalFooter className="flex items-center justify-end gap-2">
        <Button variant="secondary" onClick={() => onOpenChange(false)}>
          닫기
        </Button>
        <Button onClick={onImport} disabled={!importFile}>
          Import 실행
        </Button>
      </ModalFooter>
    </Modal>
  );
};
