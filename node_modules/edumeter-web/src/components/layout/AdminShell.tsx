import React from 'react';
import { Sidebar } from './Sidebar';
import { PageContainer } from './PageContainer';

export const AdminShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="py-6">
      <PageContainer>
        <div className="flex flex-col lg:flex-row gap-6">
          <Sidebar />
          <section className="flex-1 bg-card border border-border rounded-md p-6 shadow-card">
            {children}
          </section>
        </div>
      </PageContainer>
    </div>
  );
};
