import React, { useMemo } from 'react';
import { FileBarChart, Plus, Trash2 } from 'lucide-react';
import { StudentResult } from '../types';
import { TipCarousel } from './TipCarousel';

interface InputGridProps {
  students: StudentResult[];
  questionNumbers: number[];
  onUpdateStudent: (id: string, qNum: number, isCorrect: boolean) => void;
  onRemoveStudent: (id: string) => void;
  onGenerateReport: (studentId: string) => void;
  toolbar?: React.ReactNode;
}

export const InputGrid: React.FC<InputGridProps> = ({
  students,
  questionNumbers,
  onUpdateStudent,
  onRemoveStudent,
  onGenerateReport,
  toolbar
}) => {
  const questions = useMemo(() => {
    const unique = Array.from(new Set(questionNumbers));
    return unique.sort((a, b) => a - b);
  }, [questionNumbers]);

  const questionCount = questions.length;

  return (
    <div className="bg-card rounded-md shadow-card border border-border overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-border bg-card flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-text-primary tracking-tight">학생별 진단 입력</h2>
          <p className="text-sm text-text-secondary mt-1">문항 번호별 O/X를 입력한 뒤 보고서를 생성하세요.</p>
        </div>
        {toolbar}
      </div>

      <div className="overflow-auto flex-1 relative">
        {questionCount === 0 ? (
          <div className="p-8 text-center text-text-secondary">
            문항 데이터가 없습니다. 문제은행 데이터를 확인하세요.
          </div>
        ) : (
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-xs text-text-secondary uppercase bg-slate-50 sticky top-0 z-20 shadow-sm">
              <tr>
                <th className="px-4 py-3 font-semibold sticky left-0 bg-slate-50 z-20 shadow-[1px_0_0_0_rgba(0,0,0,0.05)] min-w-[120px]">
                  이름
                </th>
                {questions.map((q) => (
                  <th key={q} className="px-2 py-3 text-center min-w-[52px] font-medium border-l border-border">
                    {q}번
                  </th>
                ))}
                <th className="px-4 py-3 text-center sticky right-0 bg-slate-50 z-20 shadow-[-1px_0_0_0_rgba(0,0,0,0.05)] font-semibold">
                  리포트
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={Math.max(questionCount, 1) + 2} className="px-4 py-12 text-center text-text-secondary">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-300">
                        <Plus size={24} />
                      </div>
                      <p>
                        등록된 학생이 없습니다.<br />오른쪽 상단에서 학생을 추가하세요.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-3 font-semibold text-text-primary sticky left-0 bg-card group-hover:bg-slate-50 shadow-[1px_0_0_0_rgba(0,0,0,0.05)] z-10">
                      {student.name}
                    </td>
                    {questions.map((q) => (
                      <td key={q} className="px-1 py-2 text-center border-l border-border">
                        <button
                          onClick={() => onUpdateStudent(student.id, q, !student.answers[q])}
                          className={`w-11 h-11 rounded-sm text-[10px] font-bold transition-all duration-200 transform active:scale-90 border flex flex-col items-center justify-center gap-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                            student.answers[q]
                              ? 'bg-success/10 text-success border-success/20 hover:bg-success/20'
                              : 'bg-danger/10 text-danger border-danger/20 hover:bg-danger/20'
                          }`}
                          aria-label={`${q}번 ${student.answers[q] ? '정답' : '오답'}`}
                          aria-pressed={Boolean(student.answers[q])}
                        >
                          <span className="text-base leading-none">{student.answers[q] ? '○' : '✗'}</span>
                          <span>{student.answers[q] ? '정답' : '오답'}</span>
                        </button>
                      </td>
                    ))}
                    <td className="px-4 py-2 text-center sticky right-0 bg-card group-hover:bg-slate-50 shadow-[-1px_0_0_0_rgba(0,0,0,0.05)] z-10">
                      <div className="flex items-center justify-center gap-2 opacity-100 transition-opacity">
                        <button
                          onClick={() => onGenerateReport(student.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-sm text-xs font-semibold transition-colors"
                          title="리포트 생성"
                        >
                          <FileBarChart size={14} /> 리포트
                        </button>
                        <button
                          onClick={() => onRemoveStudent(student.id)}
                          className="p-1.5 text-text-secondary hover:text-danger hover:bg-danger/10 rounded-sm transition-colors"
                          title="학생 삭제"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
      <div className="bg-slate-50 border-t border-border p-3 text-xs text-text-secondary">
        <TipCarousel />
      </div>
    </div>
  );
};
