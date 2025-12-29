import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../ui/utils';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'relative flex items-center gap-2 px-3 py-2 rounded-sm text-sm font-semibold transition-colors',
    isActive
      ? 'bg-[#E0F2FE] text-primary'
      : 'text-text-secondary hover:text-text-primary hover:bg-slate-100'
  );

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-full lg:w-[220px] bg-card border border-border rounded-md p-4 shadow-card">
      <h2 className="text-lg font-bold text-text-primary mb-4">관리 메뉴</h2>
      <nav className="flex flex-col gap-2">
        <NavLink to="/admin" end className={navLinkClass}>
          {({ isActive }) => (
            <>
              <span
                className={cn(
                  'absolute left-0 top-0 h-full w-1 rounded-r-sm',
                  isActive ? 'bg-primary' : 'bg-transparent'
                )}
                aria-hidden="true"
              />
              <span className="pl-2">관리 개요</span>
            </>
          )}
        </NavLink>
        <NavLink to="/admin/requirements" className={navLinkClass}>
          {({ isActive }) => (
            <>
              <span
                className={cn(
                  'absolute left-0 top-0 h-full w-1 rounded-r-sm',
                  isActive ? 'bg-primary' : 'bg-transparent'
                )}
                aria-hidden="true"
              />
              <span className="pl-2">요구사항 관리</span>
            </>
          )}
        </NavLink>
        <NavLink to="/admin/item-bank" className={navLinkClass}>
          {({ isActive }) => (
            <>
              <span
                className={cn(
                  'absolute left-0 top-0 h-full w-1 rounded-r-sm',
                  isActive ? 'bg-primary' : 'bg-transparent'
                )}
                aria-hidden="true"
              />
              <span className="pl-2">문제은행 관리</span>
            </>
          )}
        </NavLink>
        <NavLink to="/admin/analytics" className={navLinkClass}>
          {({ isActive }) => (
            <>
              <span
                className={cn(
                  'absolute left-0 top-0 h-full w-1 rounded-r-sm',
                  isActive ? 'bg-primary' : 'bg-transparent'
                )}
                aria-hidden="true"
              />
              <span className="pl-2">통계·탐지</span>
            </>
          )}
        </NavLink>
        <NavLink to="/admin/generation" className={navLinkClass}>
          {({ isActive }) => (
            <>
              <span
                className={cn(
                  'absolute left-0 top-0 h-full w-1 rounded-r-sm',
                  isActive ? 'bg-primary' : 'bg-transparent'
                )}
                aria-hidden="true"
              />
              <span className="pl-2">문항 자동생성</span>
            </>
          )}
        </NavLink>
      </nav>
    </aside>
  );
};
