import React from 'react';
import { DesignArtifact } from './types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Select } from '../../../components/ui/Select';

export interface DesignTraceabilityPanelProps {
  selectedRequirementId: string | null;
  designForm: { type: string; identifier: string; name: string; description: string };
  onFormChange: (next: { type: string; identifier: string; name: string; description: string }) => void;
  onCreate: (event: React.FormEvent) => void;
  designArtifacts: DesignArtifact[];
  designLinks: DesignArtifact[];
  designLinkId: string;
  onDesignLinkChange: (value: string) => void;
  onLink: () => void;
}

export const DesignTraceabilityPanel: React.FC<DesignTraceabilityPanelProps> = ({
  selectedRequirementId,
  designForm,
  onFormChange,
  onCreate,
  designArtifacts,
  designLinks,
  designLinkId,
  onDesignLinkChange,
  onLink
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>설계 산출물 (RTM)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="space-y-2" onSubmit={onCreate}>
          <Input
            placeholder="유형 (화면/API/DB)"
            value={designForm.type}
            onChange={(e) => onFormChange({ ...designForm, type: e.target.value })}
          />
          <Input
            placeholder="식별자"
            value={designForm.identifier}
            onChange={(e) => onFormChange({ ...designForm, identifier: e.target.value })}
          />
          <Input
            placeholder="명칭"
            value={designForm.name}
            onChange={(e) => onFormChange({ ...designForm, name: e.target.value })}
          />
          <Textarea
            rows={2}
            placeholder="설명"
            value={designForm.description}
            onChange={(e) => onFormChange({ ...designForm, description: e.target.value })}
          />
          <Button type="submit" fullWidth>산출물 등록</Button>
        </form>
        <div className="text-xs text-text-secondary">등록 {designArtifacts.length}건</div>
        <div className="flex gap-2">
          <Select
            value={designLinkId}
            onChange={(e) => onDesignLinkChange(e.target.value)}
          >
            <option value="">연결할 산출물 선택</option>
            {designArtifacts.map(item => (
              <option key={item.id} value={item.id}>
                {item.type} · {item.identifier}
              </option>
            ))}
          </Select>
          <Button
            variant="secondary"
            onClick={onLink}
            disabled={!selectedRequirementId || !designLinkId}
          >
            연결
          </Button>
        </div>
        <div className="text-xs text-text-secondary">연결된 산출물: {designLinks.length}건</div>
      </CardContent>
    </Card>
  );
};
