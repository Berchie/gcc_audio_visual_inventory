import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AppSidebar } from './components/Navigation/AppSidebar';
import { TopHeader } from './components/Navigation/TopHeader';
import type { ActiveTab } from './types';
import { DashboardView } from './components/Dashboard/DashboardView';
import { EquipmentCatalog } from './components/Catalog/EquipmentCatalog';
import { EquipmentRequestsView } from './components/Requests/EquipmentRequestsView';
import { MaintenanceView } from './components/Maintenance/MaintenanceView';
import { AuditView } from './components/Audit/AuditView';
import { UtilizationReportsView } from './components/Reports/UtilizationReportsView';
import { AdminManagementView } from './components/Admin/AdminManagementView';
import { AccessRestrictedView } from './components/Common/AccessRestrictedView';
import { QRScannerModal } from './components/Scanner/QRScannerModal';
import { NotificationDrawer } from './components/Notifications/NotificationDrawer';
import { LoginModal } from './components/Auth/LoginModal';
import { HostingArchitectureModal } from './components/HostingGuide/HostingArchitectureModal';
import { PrintLabelsModal } from './components/Catalog/PrintLabelsModal';
import { NewRequestModal } from './components/Requests/NewRequestModal';
import { EquipmentDetailModal } from './components/Catalog/EquipmentDetailModal';
import { CheckOutModal } from './components/Catalog/CheckOutModal';
import { CheckInModal } from './components/Catalog/CheckInModal';
import { EquipmentItem } from './types';
import { WifiOff, Globe } from 'lucide-react';

function SanctuaryMediaApp() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isHostingGuideOpen, setIsHostingGuideOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isPrintLabelsOpen, setIsPrintLabelsOpen] = useState(false);
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);

  // Selected item modals
  const [detailItem, setDetailItem] = useState<EquipmentItem | null>(null);
  const [checkOutItemTarget, setCheckOutItemTarget] = useState<EquipmentItem | null>(null);
  const [checkInItemTarget, setCheckInItemTarget] = useState<EquipmentItem | null>(null);

  const { isOnline, pendingOfflineAudits, currentUser, canAccessTab } = useApp();

  const isTabPermitted = canAccessTab(activeTab);

  // Auto-redirect back to dashboard if user switches role and current tab is restricted
  useEffect(() => {
    if (!canAccessTab(activeTab)) {
      setActiveTab('dashboard');
    }
  }, [currentUser, canAccessTab, activeTab]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Desktop & Mobile Sidebar Navigation */}
      <AppSidebar
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenNewRequest={() => setIsNewRequestOpen(true)}
        onOpenUserModal={() => setIsUserModalOpen(true)}
        onOpenHostingGuide={() => setIsHostingGuideOpen(true)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* Top Bar Contract Header */}
      <TopHeader
        activeTab={activeTab}
        isCollapsed={isSidebarCollapsed}
        onOpenMobileMenu={() => setIsMobileNavOpen(true)}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenNewRequest={() => setIsNewRequestOpen(true)}
        onOpenUserModal={() => setIsUserModalOpen(true)}
      />

      {/* Persistent Offline Status Banner */}
      {!isOnline && (
        <div
          className={`bg-amber-500 dark:bg-amber-600 text-slate-950 px-4 py-1.5 text-xs font-semibold flex items-center justify-between transition-all duration-200 ${
            isSidebarCollapsed ? 'md:pl-16' : 'md:pl-60'
          }`}
        >
          <div className="flex items-center gap-2 mx-auto">
            <WifiOff className="h-3.5 w-3.5" />
            <span>
              Remote Offline Mode — Audits stored locally ({pendingOfflineAudits.length} pending sync)
            </span>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main
        className={`w-full flex-1 px-4 py-5 sm:px-6 lg:px-8 max-w-7xl mx-auto transition-all duration-200 ${
          isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64'
        }`}
      >
        {!isTabPermitted ? (
          <AccessRestrictedView
            tab={activeTab}
            onReturnDashboard={() => setActiveTab('dashboard')}
            onOpenUserModal={() => setIsUserModalOpen(true)}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                onNavigate={(tab) => setActiveTab(tab)}
                onOpenScanner={() => setIsScannerOpen(true)}
                onOpenPrintLabels={() => setIsPrintLabelsOpen(true)}
                onOpenNewRequest={() => setIsNewRequestOpen(true)}
              />
            )}

            {activeTab === 'catalog' && (
              <EquipmentCatalog onOpenScanner={() => setIsScannerOpen(true)} />
            )}

            {activeTab === 'requests' && <EquipmentRequestsView />}

            {activeTab === 'maintenance' && <MaintenanceView />}

            {activeTab === 'audit' && (
              <AuditView onOpenScanner={() => setIsScannerOpen(true)} />
            )}

            {activeTab === 'reports' && <UtilizationReportsView />}

            {activeTab === 'admin' && <AdminManagementView />}
          </>
        )}
      </main>

      {/* Subtle Minimal Footer */}
      <footer
        className={`border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900 py-3 text-center text-xs text-slate-500 transition-all duration-200 ${
          isSidebarCollapsed ? 'md:pl-16' : 'md:pl-60'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span>Grace Community Church • Media & Communications</span>
          </div>
          <button
            onClick={() => setIsHostingGuideOpen(true)}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
          >
            <Globe className="h-3 w-3 text-indigo-500" />
            <span>media.church.org</span>
          </button>
        </div>
      </footer>

      {/* Global Modals */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onItemSelected={(item) => setDetailItem(item)}
        onCheckOutDirect={(item) => setCheckOutItemTarget(item)}
        onCheckInDirect={(item) => setCheckInItemTarget(item)}
      />

      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onNavigateToRequests={() => {
          setIsNotificationsOpen(false);
          setActiveTab('requests');
        }}
      />

      <LoginModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
      />

      <HostingArchitectureModal
        isOpen={isHostingGuideOpen}
        onClose={() => setIsHostingGuideOpen(false)}
      />

      {isPrintLabelsOpen && (
        <PrintLabelsModal onClose={() => setIsPrintLabelsOpen(false)} />
      )}

      <NewRequestModal
        isOpen={isNewRequestOpen}
        onClose={() => setIsNewRequestOpen(false)}
      />

      {detailItem && (
        <EquipmentDetailModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onOpenCheckOut={(item) => setCheckOutItemTarget(item)}
          onOpenCheckIn={(item) => setCheckInItemTarget(item)}
          onFlagMaintenance={() => {
            setDetailItem(null);
            setActiveTab('maintenance');
          }}
        />
      )}

      {checkOutItemTarget && (
        <CheckOutModal
          item={checkOutItemTarget}
          onClose={() => setCheckOutItemTarget(null)}
        />
      )}

      {checkInItemTarget && (
        <CheckInModal
          item={checkInItemTarget}
          onClose={() => setCheckInItemTarget(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <SanctuaryMediaApp />
    </AppProvider>
  );
}
