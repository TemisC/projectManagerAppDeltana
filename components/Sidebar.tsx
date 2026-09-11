
import React, { useRef } from 'react';
import { DashboardIcon, ProjectsIcon, TeamIcon, LogoIcon, ClientsIcon, CollaboratorsIcon, CalendarIcon, DownloadIcon, UploadIcon, BriefcaseIcon, TrendingUpIcon } from './ui/Icons';
import type { View } from '../types';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  onExportData: () => void;
  onImportData: (file: File) => void;
  lastDataUpdate: string | null;
  isGerencia?: boolean;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex items-center w-full px-4 py-3 text-sm font-medium transition-colors duration-200 ${
        isActive
          ? 'bg-sky-500 text-white'
          : 'text-gray-400 hover:bg-gray-700 hover:text-white'
      }`}
    >
      {icon}
      <span className="ml-4 hidden md:inline">{label}</span>
    </button>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, onExportData, onImportData, lastDataUpdate, isGerencia }) => {
  const iconClass = "h-6 w-6";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImportData(file);
    }
    // Reset value to allow uploading the same file again if needed
    if (event.target) event.target.value = '';
  };

  return (
    <aside className="fixed top-0 left-0 h-full w-16 md:w-64 bg-gray-800 text-white flex flex-col z-10 shadow-lg">
      <div className="flex items-center justify-center md:justify-start md:px-4 h-20 border-b border-gray-700">
        <LogoIcon className="h-8 w-8 text-sky-400" />
        <span className="ml-3 text-xl font-bold hidden md:inline">Deltana PM</span>
      </div>
      <nav className="flex-1 mt-6 overflow-y-auto">
        <NavItem
          icon={<DashboardIcon className={iconClass} />}
          label="Dashboard"
          isActive={currentView === 'dashboard'}
          onClick={() => setCurrentView('dashboard')}
        />
        {isGerencia && (
          <NavItem
            icon={<TrendingUpIcon className={iconClass} />}
            label="Dashboard Ejecutivo"
            isActive={currentView === 'executive-dashboard'}
            onClick={() => setCurrentView('executive-dashboard')}
          />
        )}
        <NavItem
          icon={<ProjectsIcon className={iconClass} />}
          label="Proyectos"
          isActive={currentView === 'projects'}
          onClick={() => setCurrentView('projects')}
        />
        <NavItem
          icon={<CalendarIcon className={iconClass} />}
          label="Planificación"
          isActive={currentView === 'planning'}
          onClick={() => setCurrentView('planning')}
        />
        <NavItem
          icon={<BriefcaseIcon className={iconClass} />}
          label="Coste Interno"
          isActive={currentView === 'internal-team'}
          onClick={() => setCurrentView('internal-team')}
        />
        <NavItem
          icon={<TeamIcon className={iconClass} />}
          label="Equipo Global"
          isActive={currentView === 'team'}
          onClick={() => setCurrentView('team')}
        />
        <NavItem
          icon={<ClientsIcon className={iconClass} />}
          label="Clientes"
          isActive={currentView === 'clients'}
          onClick={() => setCurrentView('clients')}
        />
        <NavItem
          icon={<CollaboratorsIcon className={iconClass} />}
          label="Colaboradores"
          isActive={currentView === 'collaborators'}
          onClick={() => setCurrentView('collaborators')}
        />
        <NavItem
          icon={<DashboardIcon className={iconClass} />}
          label="Seguimiento Económico"
          isActive={currentView === 'economic-tracking'}
          onClick={() => setCurrentView('economic-tracking')}
        />
      </nav>

      {/* Backup Controls */}
      <div className="p-4 border-t border-gray-700 hidden md:block bg-gray-900/50">
          <p className="text-[10px] text-sky-400 uppercase font-bold mb-3 tracking-wider">Sincronización (OneDrive)</p>
          
          <div className="flex flex-col gap-3">
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center w-full px-3 py-2 text-xs font-bold text-white bg-green-600 hover:bg-green-500 rounded transition-all shadow-lg hover:scale-105 active:scale-95"
                title="Buscar archivo en OneDrive/PC"
            >
                <UploadIcon className="h-4 w-4 mr-2" />
                ABRIR DATOS
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".json" 
                onChange={handleFileChange}
            />

            <button 
                onClick={onExportData}
                className="flex items-center justify-center w-full px-3 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded transition-all shadow-lg hover:scale-105 active:scale-95"
                title="Descargar archivo para guardar en OneDrive"
            >
                <DownloadIcon className="h-4 w-4 mr-2" />
                GUARDAR DATOS
            </button>
          </div>
          
          {lastDataUpdate && (
             <div className="mt-3 text-center">
                <p className="text-[9px] text-gray-500 uppercase tracking-widest">Datos del:</p>
                <p className="text-[10px] text-sky-300 font-mono">{lastDataUpdate}</p>
             </div>
          )}
          
          {!lastDataUpdate && (
            <p className="text-[10px] text-gray-500 mt-3 text-center leading-tight">
                No has cargado copia de seguridad.
            </p>
          )}
      </div>
    </aside>
  );
};

export default Sidebar;
