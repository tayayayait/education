import React, { useEffect, useMemo, useState } from 'react';
import { InputGrid } from '../components/InputGrid';
import { ReportView } from '../components/ReportView';
import { StudentAddDialog } from '../components/StudentAddDialog';
import { StudentToolbar } from '../components/StudentToolbar';
import { analyzeStudent } from '../services/diagnosticService';
import { problemsRepository, standardsRepository } from '../data';
import { AchievementStandard, DiagnosticReport, Problem, StudentResult } from '../types';

const INITIAL_STUDENTS: StudentResult[] = [
  { id: '1', name: '김하늘', answers: { 1: true, 2: true, 3: false, 4: true, 5: true, 6: false, 7: false, 8: false, 15: true } },
  { id: '2', name: '이서준', answers: { 1: true, 2: true, 3: true, 4: true, 5: true, 6: true, 7: true, 8: true, 9: true, 10: true, 11: true, 12: true, 13: true, 14: true, 15: true, 16: true, 17: true, 18: true, 19: true, 20: true } },
  { id: '3', name: '박지우', answers: { 1: false, 2: false, 3: true, 4: false, 5: true, 6: false, 7: true, 8: true, 9: false, 10: false } }
];

type SortOption = 'name-asc' | 'name-desc' | 'correct-desc' | 'correct-asc';

export const DiagnosticPage: React.FC = () => {
  const [students, setStudents] = useState<StudentResult[]>(() => {
    const saved = localStorage.getItem('edumeter_students');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });

  const [problems, setProblems] = useState<Problem[]>([]);
  const [standards, setStandards] = useState<AchievementStandard[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const [currentView, setCurrentView] = useState<'input' | 'report'>('input');
  const [selectedReport, setSelectedReport] = useState<DiagnosticReport | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('name-asc');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('edumeter_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    let alive = true;
    setDataLoading(true);
    setDataError(null);

    Promise.all([problemsRepository.list(), standardsRepository.list()])
      .then(([loadedProblems, loadedStandards]) => {
        if (!alive) return;
        setProblems(loadedProblems);
        setStandards(loadedStandards);
      })
      .catch((error) => {
        if (!alive) return;
        setDataError(error instanceof Error ? error.message : '문항/성취기준 데이터를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!alive) return;
        setDataLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const questionNumbers = useMemo(() => problems.map(problem => problem.questionNumber), [problems]);

  const uniqueQuestions = useMemo(() => {
    const unique = Array.from(new Set(questionNumbers));
    return unique.sort((a, b) => a - b);
  }, [questionNumbers]);

  const scoreMap = useMemo(() => {
    const map = new Map<string, number>();
    students.forEach((student) => {
      const correctCount = uniqueQuestions.reduce((acc, q) => acc + (student.answers[q] ? 1 : 0), 0);
      map.set(student.id, correctCount);
    });
    return map;
  }, [students, uniqueQuestions]);

  const filteredStudents = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    const base = keyword ? students.filter(s => s.name.toLowerCase().includes(keyword)) : students;
    const sorted = [...base].sort((a, b) => {
      if (sortOption === 'name-asc') return a.name.localeCompare(b.name, 'ko-KR');
      if (sortOption === 'name-desc') return b.name.localeCompare(a.name, 'ko-KR');
      const scoreA = scoreMap.get(a.id) ?? 0;
      const scoreB = scoreMap.get(b.id) ?? 0;
      return sortOption === 'correct-desc' ? scoreB - scoreA : scoreA - scoreB;
    });
    return sorted;
  }, [students, searchQuery, sortOption, scoreMap]);

  const handleUpdateStudent = (id: string, qNum: number, isCorrect: boolean) => {
    setStudents(prev => prev.map(s => {
      if (s.id !== id) return s;
      return {
        ...s,
        answers: { ...s.answers, [qNum]: isCorrect }
      };
    }));
  };

  const handleAddStudent = (name: string) => {
    const newStudent: StudentResult = {
      id: Date.now().toString(),
      name,
      answers: {}
    };
    setStudents(prev => [...prev, newStudent]);
  };

  const handleRemoveStudent = (id: string) => {
    if (confirm('학생을 삭제하면 입력한 답안이 함께 삭제됩니다. 삭제할까요?')) {
      setStudents(prev => prev.filter(s => s.id !== id));
    }
  };

  const handleGenerateReport = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    if (problems.length === 0 || standards.length === 0) {
      alert('문항 또는 성취기준 데이터가 없습니다. 문제은행 데이터를 확인하세요.');
      return;
    }

    const report = analyzeStudent(student, problems, standards);
    setSelectedReport(report);
    setCurrentView('report');
  };

  const handleBackToInput = () => {
    setSelectedReport(null);
    setCurrentView('input');
  };

  if (dataLoading) {
    return (
      <div className="h-full flex items-center justify-center text-text-secondary">
        진단 데이터를 불러오는 중...
      </div>
    );
  }

  if (dataError) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-text-secondary">
        <p className="font-semibold text-text-primary">데이터 로드 실패</p>
        <p className="text-sm mt-2">{dataError}</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      {currentView === 'input' ? (
        <div className="h-full py-6">
          <div className="mx-auto w-full max-w-[1200px] px-6">
            <InputGrid
              students={filteredStudents}
              questionNumbers={questionNumbers}
              onRemoveStudent={handleRemoveStudent}
              onUpdateStudent={handleUpdateStudent}
              onGenerateReport={handleGenerateReport}
              toolbar={(
                <StudentToolbar
                  searchValue={searchQuery}
                  onSearchChange={setSearchQuery}
                  sortValue={sortOption}
                  onSortChange={(value) => setSortOption(value as SortOption)}
                  onAddClick={() => setIsAddDialogOpen(true)}
                  totalCount={students.length}
                  filteredCount={filteredStudents.length}
                />
              )}
            />
          </div>
          <StudentAddDialog
            open={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
            onAdd={handleAddStudent}
          />
        </div>
      ) : (
        selectedReport && (
          <ReportView
            report={selectedReport}
            onBack={handleBackToInput}
          />
        )
      )}
    </div>
  );
};
