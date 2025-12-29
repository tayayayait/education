import React from 'react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';

export interface StudentToolbarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  sortValue: string;
  onSortChange: (value: string) => void;
  onAddClick: () => void;
  totalCount: number;
  filteredCount: number;
}

export const StudentToolbar: React.FC<StudentToolbarProps> = ({
  searchValue,
  onSearchChange,
  sortValue,
  onSortChange,
  onAddClick,
  totalCount,
  filteredCount
}) => {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
      <div className="flex-1 min-w-[200px]">
        <Input
          placeholder="학생 검색"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <div className="mt-1 text-xs text-text-secondary">
          {filteredCount} / {totalCount}명 표시
        </div>
      </div>
      <div className="w-full lg:w-48">
        <Select value={sortValue} onChange={(e) => onSortChange(e.target.value)}>
          <option value="name-asc">이름 A-Z</option>
          <option value="name-desc">이름 Z-A</option>
          <option value="correct-desc">정답 높은순</option>
          <option value="correct-asc">정답 낮은순</option>
        </Select>
      </div>
      <Button onClick={onAddClick} className="lg:self-end">
        학생 추가
      </Button>
    </div>
  );
};
