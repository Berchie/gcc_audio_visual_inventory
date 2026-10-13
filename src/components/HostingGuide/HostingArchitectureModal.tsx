import React from 'react';
import {
  X,
  Globe,
  Cloud,
  Smartphone,
  ShieldCheck,
  Server,
  Zap,
  CheckCircle2,
  Copy,
  ExternalLink,
} from 'lucide-react';

interface HostingArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HostingArchitectureModal: React.FC<HostingArchitectureModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/20 text-sky-400">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Cloud-Native Mobile & Subdomain Hosting Guide
              </h2>
              <p className="text-xs text-slate-400">
                Architecture configuration for church domain deployment
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

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs text-slate-300">
          {/* Subdomain DNS Configuration */}
          <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-sky-400" />
              <h3 className="font-bold text-white text-sm">
                1. Subdomain DNS Mapping (e.g. media.gracecommunitychurch.org)
              </h3>
            </div>
            <p>
              To host SanctuaryMedia under your main church domain (such as{' '}
              <code className="text-sky-300 font-mono">media.gracecommunitychurch.org</code> or{' '}
              <code className="text-sky-300 font-mono">inventory.churchmedia.org</code>), configure a
              CNAME record with your domain registrar (GoDaddy, Cloudflare, Google Domains/Squarespace):
            </p>

            <div className="rounded-lg bg-slate-950 p-3 font-mono text-[11px] space-y-1 border border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-500">Record Type:</span>
                <span className="text-white font-bold">CNAME</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Host / Name:</span>
                <span className="text-sky-400 font-bold">media (or inventory)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Target / Value:</span>
                <span className="text-emerald-400">ghs.googlehosted.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Proxy Status / SSL:</span>
                <span className="text-white">Auto SSL / Let's Encrypt</span>
              </div>
            </div>
          </div>

          {/* Cloud-Native Architecture Breakdown */}
          <div className="space-y-3">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Cloud className="h-4 w-4 text-indigo-400" />
              2. Cloud-Native Mobile PWA Architecture
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-800 bg-slate-850 p-3.5 space-y-1.5">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Smartphone className="h-4 w-4 text-emerald-400" />
                  Mobile App Experience
                </span>
                <p className="text-[11px] text-slate-400">
                  Fully installable Progressive Web App (PWA). Volunteers and staff can install it directly to their iPhone or Android home screen with no App Store friction.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-850 p-3.5 space-y-1.5">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-amber-400" />
                  Offline Syncing Engine
                </span>
                <p className="text-[11px] text-slate-400">
                  Walk-around audits in basement closets or metal catwalks store all scans in local storage. Seamless 1-click cloud sync once Wi-Fi reconnects.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-850 p-3.5 space-y-1.5">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-sky-400" />
                  Automated Push Authorizations
                </span>
                <p className="text-[11px] text-slate-400">
                  Equipment requests from other ministries (Youth, Children's, Worship) alert Media Directors with 1-click authorization push notifications.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-850 p-3.5 space-y-1.5">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Server className="h-4 w-4 text-purple-400" />
                  Centralized Reporting Hub
                </span>
                <p className="text-[11px] text-slate-400">
                  Desktop control dashboard generates weekly utilization trends, Avery barcode sticker sheets, and exportable CSV reports for church administration.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Subdomain Verification Steps */}
          <div className="rounded-xl border border-slate-800 bg-slate-850 p-4 space-y-2">
            <span className="font-bold text-white text-xs block">
              Deployment Checklist:
            </span>
            <ul className="space-y-1.5 text-[11px] text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Web App Manifest with mobile standalone viewport configured</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Camera frame permissions active for physical barcode/QR scanning</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Automated approval routing with push notification dispatcher</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span>Offline walk-around queue configured for dead-zone inventory checks</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-800 bg-slate-900/90 p-4">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
