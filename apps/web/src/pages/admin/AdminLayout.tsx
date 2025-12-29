import React from 'react';
import { Outlet } from 'react-router-dom';
import { AdminShell } from '../../components/layout/AdminShell';

export const AdminLayout: React.FC = () => {
  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
};
