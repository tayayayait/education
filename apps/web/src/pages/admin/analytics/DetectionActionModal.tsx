import React, { useEffect, useState } from 'react';
import { DetectionResult } from './types';
import { Modal, ModalBody, ModalFooter, ModalHeader, ModalTitle } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { Badge } from '../../../components/ui/Badge';

export interface DetectionActionModalProps {
  open: boolean;
  detection: DetectionResult | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (actionType: string, note: string) => void;
}

export const DetectionActionModal: React.FC<DetectionActionModalProps> = ({
  open,
  detection,
  onOpenChange,
  onSubmit
}) => {
  const [actionType, setActionType] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) {
      setActionType('');
      setNote('');
    }
  }, [open, detection]);

  const handleSubmit = () => {
    if (!actionType) return;
    onSubmit(actionType, note);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalHeader>
        <ModalTitle>탐지 조치 기록</ModalTitle>
      </ModalHeader>
      <ModalBody className="space-y-3">
        {detection ? (
          <div className="rounded-sm border border-border bg-slate-50 p-3 text-xs text-text-secondary space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="info">{detection.detection_type}</Badge>
              <span>Item: {detection.item_id}</span>
            </div>
            <div>지표: {detection.metric_name}</div>
            <div>값/임계: {detection.metric_value ?? '-'} / {detection.threshold ?? '-'}</div>
            <div>상태: {detection.status}</div>
          </div>
        ) : (
          <div className="text-sm text-text-secondary">선택된 탐지 항목이 없습니다.</div>
        )}
        <Select value={actionType} onChange={(e) => setActionType(e.target.value)}>
          <option value="">조치 선택</option>
          <option value="REVIEW">검토</option>
          <option value="REVALIDATE">재검증</option>
          <option value="RETIRE">폐기</option>
        </Select>
        <Textarea
          rows={3}
          placeholder="노트"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </ModalBody>
      <ModalFooter className="flex items-center justify-end gap-2">
        <Button variant="secondary" onClick={() => onOpenChange(false)}>취소</Button>
        <Button onClick={handleSubmit} disabled={!actionType}>조치 기록</Button>
      </ModalFooter>
    </Modal>
  );
};
