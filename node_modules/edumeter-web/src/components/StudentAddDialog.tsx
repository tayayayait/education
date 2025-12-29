import React, { useEffect, useState } from 'react';
import { Modal, ModalBody, ModalDescription, ModalFooter, ModalHeader, ModalTitle } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

export interface StudentAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (name: string) => void;
}

export const StudentAddDialog: React.FC<StudentAddDialogProps> = ({ open, onOpenChange, onAdd }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (open) {
      setName('');
    }
  }, [open]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    onOpenChange(false);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <ModalTitle>학생 추가</ModalTitle>
          <ModalDescription>학생 이름을 입력해 목록에 추가하세요.</ModalDescription>
        </ModalHeader>
        <ModalBody>
          <Input
            autoFocus
            placeholder="학생 이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </ModalBody>
        <ModalFooter className="flex items-center justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button type="submit">추가</Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};
