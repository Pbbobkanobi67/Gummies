import React from 'react';
import AdminPanel from '../components/AdminPanel/AdminPanel';

function AdminPage({ wallet, dice }) {
  return (
    <div className="admin-page">
      <AdminPanel dice={dice} account={wallet.account} />
    </div>
  );
}

export default AdminPage;
