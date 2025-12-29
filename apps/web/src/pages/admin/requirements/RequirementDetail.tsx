import React from 'react';
import { ImpactSummary, Requirement } from './types';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';

export interface RequirementDetailProps {
  requirement: Requirement | null;
  impact: ImpactSummary | null;
}

export const RequirementDetail: React.FC<RequirementDetailProps> = ({ requirement, impact }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>선택 요구사항 상세</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!requirement && <div className="text-sm text-text-secondary">요구사항을 선택하세요.</div>}
        {requirement && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="primary">{requirement.code}</Badge>
              <div className="text-lg font-semibold text-text-primary">{requirement.name}</div>
            </div>
            <div className="text-sm text-text-secondary">분류: {requirement.category}</div>
            {requirement.description && (
              <div className="text-sm text-text-primary">설명: {requirement.description}</div>
            )}
            {requirement.definition && (
              <div className="text-sm text-text-primary">정의: {requirement.definition}</div>
            )}
            {requirement.details && (
              <div className="text-sm text-text-primary">상세: {requirement.details}</div>
            )}
            {requirement.deliverables && (
              <div className="text-sm text-text-primary">산출물: {requirement.deliverables}</div>
            )}
            {impact && (
              <div className="text-xs text-text-secondary">
                영향도: 설계 {impact.design_count}, 테스트요구 {impact.test_requirement_count}, 케이스 {impact.test_case_count},
                결과 {impact.test_result_count}, 통과 {impact.passed_count}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
