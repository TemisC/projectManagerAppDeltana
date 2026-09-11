
import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Projects from './components/Projects';
import Team from './components/Team';
import Clients from './components/Clients';
import Collaborators from './components/Collaborators';
import InternalTeam from './components/InternalTeam'; // New Import
import Planning from './components/Planning';
import EconomicTracking from './components/EconomicTracking';
import Login from './components/Login';
import { projects as initialProjects } from './data';
import type { View, Project, CollaboratorInfo, TeamMember, ClientInfo, InternalCostInfo } from './types';
import { MemberType } from './types';
import ProjectModal from './components/ProjectModal';
import AddCollaboratorModal from './components/AddCollaboratorModal';
import ClientFinancialsModal from './components/ClientFinancialsModal';

// --- CONFIGURACIÓN DE SEGURIDAD ---
const APP_PASSWORD = "vicent2025"; // <--- CAMBIA ESTO POR TU CONTRASEÑA DESEADA
// ----------------------------------

const App: React.FC = () => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
      return localStorage.getItem('vicent_pm_auth') === 'true';
  });

  const [currentView, setCurrentView] = useState<View>('dashboard');
  
  // Track last data update
  const [lastDataUpdate, setLastDataUpdate] = useState<string | null>(() => {
      return localStorage.getItem('vicent_pm_last_update');
  });
  
  // Initialize Projects from LocalStorage if available, otherwise use data.ts
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
        const savedProjects = localStorage.getItem('vicent_pm_projects');
        return savedProjects ? JSON.parse(savedProjects) : initialProjects;
    } catch (e) {
        console.error("Error loading projects from localStorage", e);
        return initialProjects;
    }
  });

  // Initialize Lone Collaborators from LocalStorage
  const [loneCollaborators, setLoneCollaborators] = useState<TeamMember[]>(() => {
      try {
          const savedCollabs = localStorage.getItem('vicent_pm_collaborators');
          return savedCollabs ? JSON.parse(savedCollabs) : [];
      } catch (e) {
          console.error("Error loading collaborators from localStorage", e);
          return [];
      }
  });

  // Initialize Internal Global Rates from LocalStorage
  const [internalRates, setInternalRates] = useState<Record<string, number>>(() => {
      try {
          const savedRates = localStorage.getItem('vicent_pm_internal_rates');
          return savedRates ? JSON.parse(savedRates) : {};
      } catch (e) {
          console.error("Error loading internal rates", e);
          return {};
      }
  });

  // Save to LocalStorage whenever projects change
  useEffect(() => {
      localStorage.setItem('vicent_pm_projects', JSON.stringify(projects));
  }, [projects]);

  // Save to LocalStorage whenever loneCollaborators change
  useEffect(() => {
      localStorage.setItem('vicent_pm_collaborators', JSON.stringify(loneCollaborators));
  }, [loneCollaborators]);

  // Save Internal Rates
  useEffect(() => {
      localStorage.setItem('vicent_pm_internal_rates', JSON.stringify(internalRates));
  }, [internalRates]);

  
  // Project Modal State
  const [isProjectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  
  // Collaborator Modal State
  const [isAddCollaboratorModalOpen, setAddCollaboratorModalOpen] = useState(false);

  // Client Financials Modal State
  const [editingClientProject, setEditingClientProject] = useState<Project | null>(null);

  // Aggregate unique clients from projects
  const availableClients = useMemo(() => {
    const clients = new Set(projects.map(p => p.client));
    return Array.from(clients).sort();
  }, [projects]);

  // Aggregate all unique team members (internal and external) for dropdowns
  const availableTeamMembers = useMemo(() => {
    const membersMap = new Map<string, TeamMember>();
    
    // Add from projects
    projects.forEach(p => {
        p.team.forEach(m => {
            if (!membersMap.has(m.contact)) {
                membersMap.set(m.contact, m);
            }
        });
    });

    // Add from lone collaborators
    loneCollaborators.forEach(m => {
        if (!membersMap.has(m.contact)) {
            membersMap.set(m.contact, m);
        }
    });

    return Array.from(membersMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [projects, loneCollaborators]);


  const handleLogin = (password: string) => {
      if (password === APP_PASSWORD) {
          setIsAuthenticated(true);
          localStorage.setItem('vicent_pm_auth', 'true');
          return true;
      }
      return false;
  };

  const handleLogout = () => {
      setIsAuthenticated(false);
      localStorage.removeItem('vicent_pm_auth');
  }

  // --- DATA BACKUP HANDLERS ---
  const handleExportData = () => {
    const now = new Date();
    const data = {
        projects,
        loneCollaborators,
        internalRates,
        exportDate: now.toISOString()
    };
    
    // Update local state to reflect export
    const dateStr = now.toLocaleString();
    setLastDataUpdate(dateStr);
    localStorage.setItem('vicent_pm_last_update', dateStr);

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    // Format: vicent_pm_backup_YYYY-MM-DD.json
    link.download = `vicent_pm_backup_${now.toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportData = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const text = e.target?.result as string;
              const data = JSON.parse(text);
              
              if (Array.isArray(data.projects)) {
                  setProjects(data.projects);
                  localStorage.setItem('vicent_pm_projects', JSON.stringify(data.projects));
              }
              if (Array.isArray(data.loneCollaborators)) {
                  setLoneCollaborators(data.loneCollaborators);
                  localStorage.setItem('vicent_pm_collaborators', JSON.stringify(data.loneCollaborators));
              }
              if (data.internalRates) {
                  setInternalRates(data.internalRates);
                  localStorage.setItem('vicent_pm_internal_rates', JSON.stringify(data.internalRates));
              }

              // Set Last Update Date
              let dateStr = "";
              if (data.exportDate) {
                  dateStr = new Date(data.exportDate).toLocaleString();
              } else {
                  dateStr = new Date().toLocaleString() + " (Importado)";
              }
              setLastDataUpdate(dateStr);
              localStorage.setItem('vicent_pm_last_update', dateStr);

              alert("Datos cargados correctamente. ¡Bienvenido de nuevo!");
          } catch (err) {
              console.error("Error parsing backup file", err);
              alert("Error al leer el archivo. Asegúrate de que es un backup válido de Vicent PM (.json).");
          }
      };
      reader.readAsText(file);
  };
  // -----------------------------


  const handleOpenAddProjectModal = () => {
    setEditingProject(null);
    setProjectModalOpen(true);
  };

  const handleOpenEditProjectModal = (project: Project) => {
    setEditingProject(project);
    setProjectModalOpen(true);
  };

  const handleCloseProjectModal = () => {
    setProjectModalOpen(false);
    setEditingProject(null);
  };

  const handleSaveProject = (projectData: Omit<Project, 'id'>) => {
    if (editingProject) {
      setProjects(projects.map(p => p.id === editingProject.id ? { ...p, ...projectData } : p));
    } else {
      const newProject: Project = {
        ...projectData,
        id: `proj-${Date.now()}`,
      };
      setProjects([...projects, newProject]);
    }
    handleCloseProjectModal();
  };

  const handleDeleteProject = (projectId: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta propuesta? Esta acción no se puede deshacer.")) {
      setProjects(projects.filter(p => p.id !== projectId));
      handleCloseProjectModal();
    }
  };
  
  const handleSaveCollaboratorFinancials = (projectId: string, memberContact: string, financialInfo: CollaboratorInfo | null) => {
    setProjects(currentProjects => {
        return currentProjects.map(p => {
            if (p.id === projectId) {
                return {
                    ...p,
                    team: p.team.map(member => {
                        if (member.contact === memberContact) {
                            // TypeScript fix: explicitly convert null to undefined to match TeamMember type interface
                            const safeInfo = financialInfo === null ? undefined : financialInfo;
                            return { ...member, collaboratorInfo: safeInfo };
                        }
                        return member;
                    })
                };
            }
            return p;
        });
    });
  };

  const handleRemoveCollaboratorFromProject = (projectId: string, memberContact: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar a este colaborador de este proyecto?")) {
      setProjects(currentProjects => {
        return currentProjects.map(p => {
          if (p.id === projectId) {
            return {
              ...p,
              team: p.team.filter(member => member.contact !== memberContact)
            };
          }
          return p;
        });
      });
      return true;
    }
    return false;
  };

  const handleSaveInternalFinancials = (projectId: string, memberContact: string, costInfo: InternalCostInfo) => {
      setProjects(currentProjects => {
          return currentProjects.map(p => {
              if (p.id === projectId) {
                  return {
                      ...p,
                      team: p.team.map(member => {
                          if (member.contact === memberContact) {
                              return { ...member, internalCostInfo: costInfo };
                          }
                          return member;
                      })
                  }
              }
              return p;
          });
      });
  };

  const handleUpdateProjectWithMembers = (updatedProject: Project, newGlobalMembers?: TeamMember[]) => {
      setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));
      if (newGlobalMembers && newGlobalMembers.length > 0) {
          setLoneCollaborators(prev => {
              const existing = new Set(prev.map(m => m.contact.toLowerCase().trim()));
              const toAdd = newGlobalMembers.filter(m => !existing.has(m.contact.toLowerCase().trim()));
              return [...prev, ...toAdd];
          });
      }
  };
  
  const handleSaveClientFinancials = (clientInfo: ClientInfo) => {
      if (!editingClientProject) return;

      setProjects(currentProjects => {
          return currentProjects.map(p => {
              if (p.id === editingClientProject.id) {
                  return { ...p, clientInfo };
              }
              return p;
          });
      });
      setEditingClientProject(null);
  };

  const handleOpenAddCollaboratorModal = () => setAddCollaboratorModalOpen(true);
  const handleCloseAddCollaboratorModal = () => setAddCollaboratorModalOpen(false);

  const handleSaveNewCollaborator = (collaboratorData: Omit<TeamMember, 'type' | 'projects'>) => {
    const allContacts = new Set([
      ...projects.flatMap(p => p.team.map(m => m.contact)),
      ...loneCollaborators.map(c => c.contact)
    ]);

    if (allContacts.has(collaboratorData.contact)) {
      alert("Ya existe un miembro del equipo con este email de contacto.");
      return;
    }
    
    const newCollaborator: TeamMember = {
      ...collaboratorData,
      type: MemberType.External,
    };

    setLoneCollaborators([...loneCollaborators, newCollaborator]);
    handleCloseAddCollaboratorModal();
  };

  const handleUpdateMemberName = (contact: string, newName: string) => {
    setLoneCollaborators(prev => prev.map(c => c.contact === contact ? { ...c, name: newName } : c));
    setProjects(prev => prev.map(p => ({
      ...p,
      team: p.team.map(m => m.contact === contact ? { ...m, name: newName } : m)
    })));
  };

  const handleUpdateCollaboratorName = handleUpdateMemberName;

  // Handle global internal rate updates
  const handleUpdateGlobalRate = (contact: string, rate: number) => {
      setInternalRates(prev => ({
          ...prev,
          [contact]: rate
      }));
  };

  const handleUpdateInternalMemberType = (contact: string, type: string) => {
    setProjects(prev => prev.map(p => ({
      ...p,
      team: p.team.map(m => m.contact === contact ? { ...m, internalMemberType: type } : m)
    })));
  };

  const handleDeleteGlobalMember = (contact: string) => {
    setLoneCollaborators(prev => prev.filter(c => c.contact !== contact));
    setProjects(prev => prev.map(p => ({
      ...p,
      team: p.team.filter(m => m.contact !== contact)
    })));
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard projects={projects} internalRates={internalRates} />;
      case 'projects':
        return <Projects 
                  projects={projects} 
                  internalRates={internalRates}
                  onAddProject={handleOpenAddProjectModal} 
                  onEditProject={handleOpenEditProjectModal} 
               />;
      case 'planning':
        return <Planning projects={projects} />;
      case 'team':
        return <Team 
                  projects={projects} 
                  internalRates={internalRates} 
                  onUpdateRate={handleUpdateGlobalRate} 
                  onUpdateMemberType={handleUpdateInternalMemberType} 
                  onUpdateMemberName={handleUpdateMemberName} 
                  onDeleteMember={handleDeleteGlobalMember}
               />;
      case 'internal-team': // NEW VIEW
        return (
          <InternalTeam 
            projects={projects} 
            globalRates={internalRates} 
            availableGlobalMembers={availableTeamMembers}
            onUpdateInternalCost={handleSaveInternalFinancials} 
            onUpdateProject={handleUpdateProjectWithMembers}
          />
        );
      case 'clients':
        return <Clients 
                  projects={projects} 
                  onAddClient={handleOpenAddProjectModal}
                  onEditFinancials={(project) => setEditingClientProject(project)}
                />;
      case 'collaborators':
        return <Collaborators 
                  projects={projects} 
                  loneCollaborators={loneCollaborators}
                  onSaveFinancials={handleSaveCollaboratorFinancials} 
                  onRemoveFromProject={handleRemoveCollaboratorFromProject}
                  onAddCollaborator={handleOpenAddCollaboratorModal}
                  onUpdateCollaboratorName={handleUpdateCollaboratorName}
                />;
      case 'economic-tracking':
        return <EconomicTracking projects={projects} globalRates={internalRates} />;
      default:
        return <Dashboard projects={projects} internalRates={internalRates} />;
    }
  };

  // If not authenticated, show Login Screen
  if (!isAuthenticated) {
      return <Login onLogin={handleLogin} />;
  }

  // Determine container style based on view
  const isFixedView = currentView === 'planning';

  return (
    <div className="flex min-h-screen bg-gray-900 text-gray-100 font-sans">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        onExportData={handleExportData}
        onImportData={handleImportData}
        lastDataUpdate={lastDataUpdate}
      />
      
      {/* Logout Button (Positioned Absolute Top Right) */}
      <div className="fixed top-4 right-4 z-50">
        <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-white transition-colors bg-gray-800 hover:bg-gray-700 px-3 py-1 rounded-full border border-gray-700">
            Cerrar Sesión
        </button>
      </div>

      <main 
        className={`flex-1 p-4 sm:p-6 lg:p-10 ml-16 md:ml-64 transition-all duration-300 flex flex-col ${
            isFixedView ? 'h-screen overflow-hidden' : 'min-h-screen'
        }`}
      >
        {renderView()}
      </main>
      
      {isProjectModalOpen && (
        <ProjectModal
          project={editingProject}
          availableClients={availableClients}
          availableTeamMembers={availableTeamMembers}
          onClose={handleCloseProjectModal}
          onSave={handleSaveProject}
          onDelete={handleDeleteProject}
        />
      )}
      
      {isAddCollaboratorModalOpen && (
        <AddCollaboratorModal
            onClose={handleCloseAddCollaboratorModal}
            onSave={handleSaveNewCollaborator}
        />
      )}

      {editingClientProject && (
          <ClientFinancialsModal 
            project={editingClientProject}
            onClose={() => setEditingClientProject(null)}
            onSave={handleSaveClientFinancials}
          />
      )}
    </div>
  );
};

export default App;
