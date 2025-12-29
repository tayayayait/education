import React from 'react';

export const AdminHome: React.FC = () => {
  return (
    <div>
      <h3 className="text-xl font-bold text-slate-800">관리 대시보드</h3>
      <p className="text-sm text-slate-600 mt-2">
        요구사항 128건과 RTM, 문제은행 운영 흐름을 한 곳에서 관리합니다.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
          <h4 className="font-semibold text-slate-800">요구사항 관리</h4>
          <p className="text-sm text-slate-600 mt-1">
            베이스라인, 해석/정제 로그, 변경관리 워크플로우와 RTM을 관리합니다.
          </p>
        </div>
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
          <h4 className="font-semibold text-slate-800">문제은행 운영</h4>
          <p className="text-sm text-slate-600 mt-1">
            문항 등록/검토/승인/배포 흐름과 테넌트별 운영 현황을 확인합니다.
          </p>
        </div>
      </div>
    </div>
  );
};
