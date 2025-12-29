import React from 'react';
import { NavLink } from 'react-router-dom';
import { Badge } from '../ui/Badge';
import { PageContainer } from './PageContainer';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-1.5 rounded-sm text-sm font-semibold transition-colors border ${
    isActive
      ? 'bg-primary/10 text-primary border-primary/20'
      : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-slate-100'
  }`;

export const Header: React.FC = () => {
  return (
    <header className="h-14 bg-card border-b border-border shadow-sm z-40 relative no-print">
      <PageContainer className="h-full flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-md flex items-center justify-center text-white font-bold shadow-card">
              E
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl text-text-primary tracking-tight">에듀미터</span>
              <Badge variant="secondary">BETA</Badge>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-2 ml-2">
            <NavLink to="/diagnostic" className={navLinkClass}>
              진단
            </NavLink>
            <NavLink to="/admin" className={navLinkClass}>
              관리
            </NavLink>
          </nav>
        </div>
        <div className="text-sm font-medium text-text-secondary bg-slate-50 px-3 py-1.5 rounded-sm border border-border">
          테넌트: <b className="text-text-primary">시범도</b>
        </div>
      </PageContainer>
    </header>
  );
};
