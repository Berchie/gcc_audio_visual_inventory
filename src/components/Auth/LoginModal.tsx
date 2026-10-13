import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  UserCheck,
  Lock,
  Key,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserProfile, UserRole } from '../../types';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, setCurrentUser, availableUsers } = useApp();

  const [activeTab, setActiveTab] = useState<'switch' | 'custom'>('switch');
  const [customEmail, setCustomEmail] = useState('');
  const [customPassword, setCustomPassword] = useState('');
  const [customRole, setCustomRole] = useState<UserRole>('staff');
  const [customName, setCustomName] = useState('');
  const [loginMessage, setLoginMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPreconfiguredUser = (user: UserProfile) => {
    setCurrentUser(user);
    setLoginMessage(`Authenticated as ${user.name} (${user.role.toUpperCase()})`);
    setTimeout(() => {
      onClose();
      setLoginMessage(null);
    }, 600);
  };

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim() || !customName.trim()) return;

    const newUser: UserProfile = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      name: customName.trim(),
      email: customEmail.trim(),
      role: customRole,
      department: customRole === 'administrator' ? 'Media Leadership' : 'Media Ministry',
      title: `${customRole.toUpperCase()} Account`,
    };

    setCurrentUser(newUser);
    setLoginMessage(`Logged in as ${newUser.name}`);
    setTimeout(() => {
      onClose();
      setLoginMessage(null);
    }, 600);
  };

  const rolePrivileges = [
    {
      role: 'Administrator',
      color: 'text-amber-400',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      desc: 'Full system authorization. Create/delete gear, authorize department requests, manage maintenance intervals, export finance reports.',
    },
    {
      role: 'Staff',
      color: 'text-sky-400',
      badge: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      desc: 'Media department technicians. Check out/in gear, log maintenance repairs, authorize routine requests, perform walk-around audits.',
    },
    {
      role: 'Volunteer',
      color: 'text-emerald-400',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      desc: 'Sunday and midweek AV team. Scan QR barcodes to check out gear for assigned services, conduct physical room audits.',
    },
    {
      role: 'Requester',
      color: 'text-purple-400',
      badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      desc: 'Youth, Worship, Outreach & Children\'s leaders. Submit program equipment requests with automatic approval routing.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Authentication & Role Access</h2>
              <p className="text-xs text-slate-400">
                Restricted to Administrators, Staff, Volunteers, and Requesters
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-800 bg-slate-850 px-5 pt-3 text-xs">
          <button
            onClick={() => setActiveTab('switch')}
            className={`pb-2.5 font-semibold transition border-b-2 mr-4 ${
              activeTab === 'switch'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Switch Team Account
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`pb-2.5 font-semibold transition border-b-2 ${
              activeTab === 'custom'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Custom Sign In
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {loginMessage && (
            <div className="rounded-xl bg-emerald-500/20 border border-emerald-500/40 p-3 text-xs font-semibold text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>{loginMessage}</span>
            </div>
          )}

          {activeTab === 'switch' && (
            <div className="space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Select Active Church Media Account:
              </span>

              {availableUsers.map((user) => {
                const isSelected = currentUser.id === user.id;
                return (
                  <button
                    key={user.id}
                    onClick={() => handleSelectPreconfiguredUser(user)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition ${
                      isSelected
                        ? 'border-sky-500 bg-sky-500/15 shadow-md'
                        : 'border-slate-800 bg-slate-850/70 hover:border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 font-bold text-white text-xs">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{user.name}</span>
                          <span
                            className={`rounded-full border px-2 py-0.2 text-[9px] font-semibold uppercase tracking-wider ${
                              user.role === 'administrator'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : user.role === 'staff'
                                ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                                : user.role === 'volunteer'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            }`}
                          >
                            {user.role}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {user.title} • {user.department}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <CheckCircle2 className="h-5 w-5 text-sky-400 shrink-0" />
                    )}
                  </button>
                );
              })}

              {/* Role Permissions Guide */}
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Role-Based Security Matrix:
                </span>
                {rolePrivileges.map((rp) => (
                  <div
                    key={rp.role}
                    className="rounded-lg bg-slate-850/40 p-2 text-xs border border-slate-800/60"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`font-bold ${rp.color}`}>{rp.role}:</span>
                      <span className="text-[11px] text-slate-300">{rp.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'custom' && (
            <form onSubmit={handleCustomLogin} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  required
                  placeholder="e.g. John Doe"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Church Email *</label>
                <input
                  type="email"
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  required
                  placeholder="john@gracecommunitychurch.org"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Password</label>
                <input
                  type="password"
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-white focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Role *</label>
                <select
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value as UserRole)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-white capitalize focus:border-sky-500 focus:outline-none"
                >
                  <option value="administrator">Administrator (Full Control)</option>
                  <option value="staff">Staff (Media Technician)</option>
                  <option value="volunteer">Volunteer (AV & Camera Tech)</option>
                  <option value="requester">Requester (Ministry Department)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-sky-600 py-2.5 font-semibold text-white hover:bg-sky-500 transition shadow-sm"
                >
                  Sign In to System
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
