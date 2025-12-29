import React from 'react';
import { Link } from 'react-router-dom';

export const NotFound: React.FC = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center text-slate-600">
      <h2 className="text-2xl font-bold text-slate-800">페이지를 찾을 수 없습니다.</h2>
      <p className="text-sm mt-2">요청한 주소가 없거나 이동되었습니다.</p>
      <Link
        to="/diagnostic"
        className="mt-4 inline-flex items-center px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700"
      >
        진단 화면으로 이동
      </Link>
    </div>
  );
};
