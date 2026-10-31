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
  Sparkles,
  Trash2,
  Lock,
  User
} from 'lucide-react';
import api, { downloadFile } from '../api';
import ConfirmModal from '../components/ConfirmModal';

export default function SettingsView({ user, onProfileUpdated, onDataSeeded }) {
  // Shop profile state
  const [shopName, setShopName] = useState(user?.shop_name || 'Sri Sadananda Store');
  const [shopPhone, setShopPhone] = useState(user?.shop_phone || '');
  const [shopAddress, setShopAddress] = useState(user?.shop_address || 'Main Road, Hiriyur - 577598');
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsSuccess, setDetailsSuccess] = useState('');
  const [detailsError, setDetailsError] = useState('');

  // Password & Username state
  const [username, setUsername] = useState(user?.username || 'admin');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Backup state
  const [backups, setBackups] = useState([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState('');
  const [deleteBackupTarget, setDeleteBackupTarget] = useState(null);
  const [deleteBackupLoading, setDeleteBackupLoading] = useState(false);

  // Demo seeding
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');

  useEffect(() => {
    if (user) {
      if (user.shop_name) setShopName(user.shop_name);
      if (user.shop_phone) setShopPhone(user.shop_phone);
      if (user.shop_address) setShopAddress(user.shop_address);
      if (user.username) setUsername(user.username);
    }
  }, [user]);

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

  // 1. Save Shop Profile Details Only
  const handleSaveShopDetails = async (e) => {
    e.preventDefault();
    setDetailsError('');
    setDetailsSuccess('');

    if (!shopName.trim()) {
      setDetailsError('Shop name is required.');
      return;
    }

    try {
      setSavingDetails(true);
      const payload = {
        shop_name: shopName.trim(),
        shop_phone: shopPhone.trim(),
        shop_address: shopAddress.trim(),
      };

      const res = await api.put('/auth/profile', payload);
      setDetailsSuccess('Shop details saved successfully!');
      if (onProfileUpdated) onProfileUpdated(res.data);
    } catch (err) {
      setDetailsError(err.response?.data?.detail || 'Failed to update shop details.');
    } finally {
      setSavingDetails(false);
    }
  };

  // 2. Change Credentials with Previous Password Requirement
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Please enter your previous/current password to confirm changes.');
      return;
    }
    if (newPassword && newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    try {
      setSavingPassword(true);
      const payload = {
        current_password: currentPassword,
      };
      if (username.trim()) payload.username = username.trim();
      if (newPassword) payload.new_password = newPassword;

      const res = await api.put('/auth/profile', payload);
      setPasswordSuccess('Login credentials updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (onProfileUpdated) onProfileUpdated(res.data);
    } catch (err) {
      setPasswordError(err.response?.data?.detail || 'Failed to update password. Please check your previous password.');
    } finally {
      setSavingPassword(false);
    }
  };

  // 3. Create Backup
  const handleCreateBackup = async () => {
    try {
      setCreatingBackup(true);
      setBackupSuccess('');
      await api.post('/backup/create');
      setBackupSuccess('Database backup generated and safely archived!');
      fetchBackupHistory();
    } catch (err) {
      alert('Failed to generate database backup.');
    } finally {
      setCreatingBackup(false);
    }
  };

  // 4. Delete Backup
  const handleConfirmDeleteBackup = async () => {
    if (!deleteBackupTarget) return;
    try {
      setDeleteBackupLoading(true);
      await api.delete(`/backup/${deleteBackupTarget.id}`);
      setDeleteBackupTarget(null);
      fetchBackupHistory();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to delete backup.');
    } finally {
      setDeleteBackupLoading(false);
    }
  };

  // 5. Download Backup using downloadFile
  const handleDownloadBackup = async (backup) => {
    await downloadFile(`/backup/download/${backup.id}`, backup.file_name);
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
      {/* Top Banner */}
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
        {/* Left Column: Shop Profile & Password Forms (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* Section 1: Shop Profile Details */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-100">
              <Store className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Shop Business Information</h3>
                <p className="text-xs text-slate-500">Printed on monthly reports, statements and receipts</p>
              </div>
            </div>

            {detailsSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{detailsSuccess}</span>
              </div>
            )}

            {detailsError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{detailsError}</span>
              </div>
            )}

            <form onSubmit={handleSaveShopDetails} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Shop / Store Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="e.g. Sri Sadananda Store"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 text-slate-900 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Shop Contact Phone Number
                </label>
                <input
                  type="text"
                  value={shopPhone}
                  onChange={(e) => setShopPhone(e.target.value)}
                  placeholder="e.g. +91 98450 12345"
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
                  placeholder="e.g. Main Road, Hiriyur - 577598"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 text-slate-900 text-xs font-medium"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingDetails}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {savingDetails ? 'Saving...' : 'Save Shop Details'}
                </button>
              </div>
            </form>
          </div>

          {/* Section 2: Security & Password Change */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-slate-100">
              <Lock className="w-5 h-5 text-slate-700" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">Change Login ID & Password</h3>
                <p className="text-xs text-slate-500">Requires entering your previous password before changing</p>
              </div>
            </div>

            {passwordSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Login ID / Username
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter login username"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 text-slate-900 text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Previous Password <span className="text-rose-500">* (Required to confirm changes)</span>
                </label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter your current/previous password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 text-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  New Password <span className="text-slate-400 font-normal">(Leave blank if keeping existing)</span>
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 text-slate-900 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 text-slate-900 text-xs"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {savingPassword ? 'Updating...' : 'Update Login Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Database Backup System (6 cols) */}
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
                    <th className="px-4 py-2.5 text-center">Actions</th>
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
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleDownloadBackup(b)}
                              className="p-1 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Download Backup File"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteBackupTarget(b)}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Backup File"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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

      {/* Delete Backup Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteBackupTarget)}
        title="Delete Database Backup?"
        message={`Are you sure you want to permanently delete the backup file "${deleteBackupTarget?.file_name}"?`}
        confirmText="Yes, Delete Backup"
        loading={deleteBackupLoading}
        onConfirm={handleConfirmDeleteBackup}
        onCancel={() => setDeleteBackupTarget(null)}
      />
    </div>
  );
}
