import React from 'react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell
} from 'recharts';
import { ArrowLeft, Printer, Share2, Award, AlertTriangle, CheckCircle, GraduationCap } from 'lucide-react';
import { DiagnosticReport } from '../types';

interface ReportViewProps {
  report: DiagnosticReport;
  onBack: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({ report, onBack }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    alert('공유 기능은 MVP에서 제공되지 않습니다. PDF로 저장해 공유하세요.');
  };

  const radarData = report.categoryScores.map(c => ({
    subject: c.category,
    fullSubject: c.category,
    score: c.score,
    fullMark: 100,
  }));

  const barData = report.standardScores.map(s => ({
    code: s.standardCode,
    score: s.score,
    status: s.status,
    desc: s.description
  }));

  const getStatusText = (status: string) => {
    switch(status) {
      case 'Mastery': return '숙달';
      case 'Needs Review': return '보완 필요';
      case 'Critical Support Needed': return '집중 지원';
      default: return '-';
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Mastery': return 'text-green-600 bg-green-50 border-green-200';
      case 'Needs Review': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Critical Support Needed': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-slate-400 bg-slate-50 border-slate-200';
    }
  };

  const getBarColor = (status: string) => {
    switch(status) {
      case 'Mastery': return '#16a34a'; // Green 600
      case 'Needs Review': return '#ca8a04'; // Yellow 600
      case 'Critical Support Needed': return '#dc2626'; // Red 600
      default: return '#94a3b8';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 overflow-auto font-sans">
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between no-print sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors px-3 py-2 rounded-lg hover:bg-slate-50">
            <ArrowLeft size={18} /> <span className="font-semibold">진단 입력으로 돌아가기</span>
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold ring-1 ring-indigo-100">
            <span className="mr-1.5 text-base">AI</span> 분석 리포트
          </div>
          <button onClick={handleShare} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 text-slate-700 transition-colors shadow-sm">
            <Share2 size={16} /> 공유
          </button>
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 shadow-md hover:shadow-lg transition-all active:scale-95">
            <Printer size={16} /> 인쇄 / PDF 저장
          </button>
        </div>
      </div>

      <div className="flex-1 p-8 print:p-0 flex justify-center bg-slate-100 print:bg-white overflow-y-auto">
        <div className="bg-white shadow-xl print:shadow-none w-[210mm] min-h-[297mm] p-[15mm] flex flex-col relative print:w-full print:h-full print:overflow-visible mx-auto my-0">
          <div className="border-b-[3px] border-slate-800 pb-4 mb-8 flex justify-between items-end">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-900 text-white flex items-center justify-center rounded-lg">
                <GraduationCap size={28} />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">수학 학력 진단 결과 보고서</h1>
                <p className="text-slate-500 font-semibold text-sm mt-1">Mathematics Achievement Diagnostic Report</p>
              </div>
            </div>
            <div className="text-right flex gap-8">
              <div>
                <div className="text-xs text-slate-400 font-medium uppercase mb-0.5">Assessment Date</div>
                <div className="text-sm font-semibold text-slate-700">{new Date().toLocaleDateString('ko-KR')}</div>
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium uppercase mb-0.5">Student Name</div>
                <div className="text-2xl font-bold text-brand-700 tracking-tight">{report.studentName}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6 mb-8">
            <div className="col-span-4 bg-slate-50 rounded-xl p-6 border border-slate-200 flex flex-col justify-center items-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-brand-500"></div>
              <div className="text-sm text-slate-500 mb-1 font-bold">총점</div>
              <div className="text-6xl font-black text-slate-900 tracking-tighter mb-2">{report.totalScore}</div>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-white border border-slate-200 text-slate-500">
                기준점수 72 (참고)
              </div>
            </div>

            <div className="col-span-8 bg-white rounded-xl p-6 border border-slate-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-4 bg-brand-600 rounded-full"></div>
                <h3 className="text-base font-bold text-slate-800">AI 진단 코멘트</h3>
              </div>
              <p className="text-slate-700 text-sm leading-relaxed font-medium break-keep">
                {report.feedback}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-8">
            <div className="bg-white border border-slate-100 rounded-xl p-4">
              <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-300"></span> 영역별 성취도
              </h3>
              <div className="w-full h-[240px] border-t border-slate-100 pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="#e2e8f0" strokeDasharray="4 4" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="Student"
                      dataKey="score"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      fill="#3b82f6"
                      fillOpacity={0.2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="flex flex-col h-full">
              <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-300"></span> 취약 성취기준
              </h3>
               {report.weakestStandard ? (
                 <div className="flex-1 bg-red-50 rounded-xl p-6 border-2 border-red-100 flex flex-col justify-center items-center text-center relative overflow-hidden">
                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-red-500 mb-4 shadow-sm ring-4 ring-red-100">
                      <AlertTriangle size={28} />
                    </div>
                    <div className="text-red-900 font-bold text-lg mb-1">{report.weakestStandard.standardCode}</div>
                    <p className="text-red-700 text-sm mb-4 break-keep font-medium px-4">{report.weakestStandard.description}</p>
                    <div className="px-4 py-1.5 bg-white rounded-full text-sm font-bold text-red-600 border border-red-200 shadow-sm">
                      점수 {report.weakestStandard.score}%
                    </div>
                 </div>
               ) : (
                 <div className="flex-1 bg-green-50 rounded-xl p-6 border-2 border-green-100 flex flex-col justify-center items-center text-center">
                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-green-500 mb-4 shadow-sm ring-4 ring-green-100">
                      <Award size={28} />
                    </div>
                    <p className="text-green-800 font-bold text-lg">모든 성취기준을 충족했습니다.</p>
                    <p className="text-green-600 text-sm mt-1">현재 수준을 유지하며 심화 학습을 진행하세요.</p>
                 </div>
               )}
            </div>
          </div>

          <div className="mb-auto">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-slate-300"></span> 성취기준별 점수
            </h3>
            <div className="w-full h-[220px] bg-white border border-slate-100 rounded-xl p-4">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis dataKey="code" type="category" width={60} tick={{fontSize: 11, fontWeight: 600, fill: '#64748b'}} interval={0} />
                    <Tooltip
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                      formatter={(value: number) => [`${value}%`, '점수']}
                    />
                    <Bar dataKey="score" barSize={12} radius={[0, 4, 4, 0]}>
                      {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getBarColor(entry.status)} />
                      ))}
                    </Bar>
                 </BarChart>
               </ResponsiveContainer>
            </div>

            <div className="flex justify-center gap-4 mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <span className="w-3 h-3 rounded-full bg-green-600"></span> 숙달(80~100%)
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <span className="w-3 h-3 rounded-full bg-yellow-600"></span> 보완 필요(50~79%)
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <span className="w-3 h-3 rounded-full bg-red-600"></span> 집중 지원(0~49%)
              </div>
            </div>
          </div>

          <div className="border-t-2 border-slate-100 pt-6 mt-6">
            <div className="flex justify-between items-center text-xs text-slate-400">
              <div className="flex items-center gap-1.5 font-bold text-brand-700">
                <CheckCircle size={14} /> 에듀미터(EduMeter)
              </div>
              <div>
                본 리포트는 학력 진단 지원을 위해 생성되었습니다.
              </div>
              <div>
                www.edumeter.com
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
