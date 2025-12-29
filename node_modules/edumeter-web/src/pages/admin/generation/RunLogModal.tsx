import React from 'react';
import { GenerationRun, PromptTemplate } from './types';
import { Badge } from '../../../components/ui/Badge';
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';

const statusVariant: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  running: 'warning',
  generated: 'success',
  failed: 'danger'
};

export interface RunLogModalProps {
  open: boolean;
  run: GenerationRun | null;
  template: PromptTemplate | null;
  onOpenChange: (open: boolean) => void;
}

export const RunLogModal: React.FC<RunLogModalProps> = ({ open, run, template, onOpenChange }) => {
  const params = run?.parameters ?? {};
  const lastError = (params as Record<string, unknown>).lastError as string | undefined;

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalHeader>
        <ModalTitle>실행 로그</ModalTitle>
      </ModalHeader>
      <ModalBody className="space-y-3">
        {!run && <div className="text-sm text-text-secondary">선택된 실행이 없습니다.</div>}
        {run && (
          <>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant={statusVariant[run.status] ?? 'default'}>{run.status}</Badge>
              <span className="text-text-secondary">{run.model_name ?? '-'}</span>
              {template && <span className="text-text-secondary">· {template.code} v{template.version}</span>}
            </div>
            <div className="text-xs text-text-secondary">
              생성일: {run.created_at}
            </div>
            <div className="rounded-sm border border-border bg-slate-50 p-3 text-xs text-text-secondary whitespace-pre-wrap">
              파라미터: {JSON.stringify(run.parameters ?? {}, null, 2)}
            </div>
            <div className="rounded-sm border border-border bg-slate-50 p-3 text-xs text-text-secondary whitespace-pre-wrap">
              오류: {lastError ?? '-'}
            </div>
          </>
        )}
      </ModalBody>
      <ModalFooter className="flex justify-end">
        <Button variant="secondary" onClick={() => onOpenChange(false)}>닫기</Button>
      </ModalFooter>
    </Modal>
  );
};
