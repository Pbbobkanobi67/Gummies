import React from 'react';
import { AdminPanel } from '../components/AdminPanel/AdminPanel';

export function AdminPage({ contract, account, signer, isConnected }) {
  if (!isConnected) {
    return (
      <div className="raffle-card" style={{ textAlign: 'center' }}>
        <h2>⚙️ Admin Panel</h2>
        <p style={{ margin: '20px 0', color: '#94a3b8' }}>
          Connect your wallet to access admin functions
        </p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <AdminPanel contract={contract} account={account} signer={signer} />
    </div>
  );
}
