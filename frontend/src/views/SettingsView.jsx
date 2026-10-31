import React, { useState, useEffect } from 'react';
import {
  Database,
  Download,
  ShieldCheck,
  Store,
  Key,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  Sparkles
} from 'lucide-react';
import api from '../api';

export default function SettingsView({ user, onProfileUpdated, onDataSeeded }) {
  const [shopName, setShopName] = useState(user?.shop_name || '');
  const [shopPhone, setShopPhone] = useState(user?.shop_phone || '');
  const [shopAddress, setShopAddress] = useState(user?.shop_address || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Backup state
  const [backups, setBackups] = useState([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState('');

  // Demo seeding
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');

  const fetchBackupHistory = async () => {
    try {
      setLoadingBackups(true);
      const res = await api.get('/backup/history');
      setBackups(res.data);
    } catch (err) {
      console.error('Failed to load backup history', err);
    } finally {
      setLoadingBackups(false);
    }
  };

  useEffect(() => {
    fetchBackupHistory();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (newPassword && newPassword.length < 6) {
      setProfileError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setProfileError('New password and confirm password do not match.');
      return;
    }

    try {
      setSavingProfile(true);
      const payload = {
        shop_name: shopName.trim(),
        shop_phone: shopPhone.trim(),
        shop_address: shopAddress.trim(),
      };
      if (newPassword) payload.new_password = newPassword;

      const res = await api.put('/auth/profile', payload);
      setProfileSuccess('Shop profile updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
      if (onProfileUpdated) onProfileUpdated(res.data);
    } catch (err) {
      setProfileError(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setCreatingBackup(true);
      setBackupSuccess('');
      const res = await api.post('/backup/create');
      setBackupSuccess('Database backup generated and safely archived!');
      fetchBackupHistory();
    } catch (err) {
      alert('Failed to generate database backup.');
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleSeedDemoData = async () => {
    if (!window.confirm('Do you want to seed realistic demo records for testing?')) return;
    try {
      setSeeding(true);
      setSeedMsg('');
      const res = await api.post('/seed-demo-data');
      setSeedMsg(res.data?.message || 'Demo data loaded.');
      if (onDataSeeded) onDataSeeded();
    } catch (err) {
      setSeedMsg('Failed to seed demo records.');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* MySQL Connection Status Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
              <span>Database Engine: MySQL 8.0</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 text-[10px] font-black uppercase">
                Active & Healthy
              </span>
            </h3>
            <p className="text-xs text-emerald-800 mt-0.5">
              Host: localhost:3306 • Database: shop_credit_db • Driver: PyMySQL UTF8MB4
            </p>
          </div>
        </div>

        <button
          onClick={handleSeedDemoData}
          disabled={seeding}
          className="px-3.5 py-2 rounded-xl bg-white hover:bg-emerald-100 text-emerald-800 font-bold text-xs border border-emerald-300 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>{seeding ? 'Loading Demo Data...' : 'Seed Sample Records'}</span>
        </button>
      </div>

      {seedMsg && (
        <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold">
          {seedMsg}
        </div>
      )}

      {/* Two Column Layout: Profile & Backup */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Shop Owner Profile & Security (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-100">
            <Store className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Shop Profile & Credentials</h3>
              <p className="text-xs text-slate-500">Configure business information on receipts and reports</p>
            </div>
          </div>

          {profileSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{profileSuccess}</span>
            </div>
          )}

          {profileError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Shop / Store Name
              </label>
              <input
                type="text"
                required
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Sri Balaji Supermarket"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 text-slate-900 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Shop Contact Phone
              </label>
              <input
                type="text"
                value={shopPhone}
                onChange={(e) => setShopPhone(e.target.value)}
                placeholder="+91 98450 12345"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 text-slate-900 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Shop Address
              </label>
              <textarea
                rows="2"
                value={shopAddress}
                onChange={(e) => setShopAddress(e.target.value)}
                placeholder="Market Road, Bangalore"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 text-slate-900 text-xs font-medium"
              />
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-800 block mb-2">Change Admin Password (Optional)</span>
              <div className="space-y-3">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (min 6 characters)"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 text-slate-900 text-xs"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 text-slate-900 text-xs"
                />
              </div>
            </div>

            <div className="pt-3">
              <button
                type="submit"
                disabled={savingProfile}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                {savingProfile ? 'Updating...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Database Backup System (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Database className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Database Backup Manager</h3>
                  <p className="text-xs text-slate-500">Safeguard financial ledgers and customer records</p>
                </div>
              </div>
              <button
                onClick={handleCreateBackup}
                disabled={creatingBackup}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <Database className="w-3.5 h-3.5" />
                <span>{creatingBackup ? 'Creating...' : 'Backup Now'}</span>
              </button>
            </div>

            {backupSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{backupSuccess}</span>
              </div>
            )}

            {/* Backup History Table */}
            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-4 py-2.5">Backup Date</th>
                    <th className="px-4 py-2.5 text-right">Size</th>
                    <th className="px-4 py-2.5 text-center">Records</th>
                    <th className="px-4 py-2.5 text-center">Download</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {loadingBackups ? (
                    <tr>
                      <td colSpan="4" className="text-center py-8 text-slate-400">
                        Checking backup archive...
                      </td>
                    </tr>
                  ) : backups.length > 0 ? (
                    backups.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 text-slate-700 font-medium">
                          {b.backup_time}
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-600 font-mono">
                          {b.file_size_kb} KB
                        </td>
                        <td className="px-4 py-2.5 text-center font-bold text-blue-600">
                          {b.record_count}
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <button
                            onClick={() => window.open(`/api/backup/download/${b.id}`, '_blank')}
                            className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="Download Backup File"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-8 text-slate-400">
                        No backups created yet. Click "Backup Now" to archive the database.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-4 mt-6 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Backups include all customers, payments & transactions</span>
            <span className="font-mono">Format: Structured JSON / SQL</span>
          </div>
        </div>
      </div>
    </div>
  );
}
