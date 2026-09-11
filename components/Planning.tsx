
import React, { useState, useMemo } from 'react';
import type { Project, TeamMember, PartialDelivery } from '../types';
import { ProjectStatus, MemberType } from '../types';
import Card from './ui/Card';

interface PlanningProps {
  projects: Project[];
}

type ViewMode = 'projects' | 'team';

interface TaskBar {
    project: Project;
    start: string;
    end: string;
    label: string; // Task name (Internal) or Project Name (External)
    milestones: PartialDelivery[]; // Specific milestones for this bar
}

const Planning: React.FC<PlanningProps> = ({ projects }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('projects');

  // Filter projects that have dates
  const activeProjects = useMemo(() => {
    return projects.filter(p => p.startDate && p.endDate).sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime());
  }, [projects]);

  const projectsWithNoDatesCount = projects.length - activeProjects.length;

  // Determine timeline bounds
  const { minDate, maxDate, totalDays } = useMemo(() => {
    if (activeProjects.length === 0) {
        const now = new Date();
        const nextMonth = new Date(now);
        nextMonth.setMonth(now.getMonth() + 1);
        return { minDate: now, maxDate: nextMonth, totalDays: 30 };
    }

    const dates = activeProjects.flatMap(p => [new Date(p.startDate!), new Date(p.endDate!)]);
    // Also include partial deliveries in the bounds calculation if they exist
    activeProjects.forEach(p => {
        if(p.partialDeliveries) {
            p.partialDeliveries.forEach(pd => {
                if(pd.date) dates.push(new Date(pd.date));
            });
        }
    });

    const min = new Date(Math.min(...dates.map(d => d.getTime())));
    const max = new Date(Math.max(...dates.map(d => d.getTime())));
    
    // Add buffer (15 days before and after)
    min.setDate(min.getDate() - 15);
    max.setDate(max.getDate() + 15);

    const diffTime = Math.abs(max.getTime() - min.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return { minDate: min, maxDate: max, totalDays: diffDays };
  }, [activeProjects]);

  // Helpers for positioning
  const getPosition = (dateStr: string) => {
    const date = new Date(dateStr);
    const diff = date.getTime() - minDate.getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    return (days / totalDays) * 100;
  };

  const getDurationPercent = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const diff = end.getTime() - start.getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    return (days / totalDays) * 100;
  };

  // Generate Month Headers
  const months = useMemo(() => {
    const ms = [];
    const current = new Date(minDate);
    current.setDate(1); // Set to 1st of month to align labels

    // Ensure we catch the month of the minDate even if minDate is late in the month
    while (current <= maxDate) {
      ms.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }
    return ms;
  }, [minDate, maxDate]);

  // Generate Week Headers
  const weeks = useMemo(() => {
    const ws = [];
    // Start from the Monday strictly before or equal to minDate
    const current = new Date(minDate);
    const day = current.getDay(); // 0 (Sun) to 6 (Sat)
    const diffToMonday = day === 0 ? -6 : 1 - day; // If Sun(0), -6. If Mon(1), 0. If Tue(2), -1.
    current.setDate(current.getDate() + diffToMonday);

    while (current <= maxDate) {
        ws.push(new Date(current));
        current.setDate(current.getDate() + 7);
    }
    return ws;
  }, [minDate, maxDate]);

  const currentPosition = getPosition(new Date().toISOString().split('T')[0]);

  // Data preparation for Team View
  const teamRows = useMemo(() => {
    const memberMap = new Map<string, { member: TeamMember, tasks: TaskBar[] }>();
    
    activeProjects.forEach(p => {
        p.team.forEach(m => {
            if (!memberMap.has(m.contact)) {
                memberMap.set(m.contact, { member: m, tasks: [] });
            }
            // Only add if member is active in that project
            if(m.active !== false) {
                 const tasksForThisProject: TaskBar[] = [];

                 if (m.type === MemberType.External) {
                     // EXTERNAL: Use Collaborator Info dates if available, else Project dates.
                     // Use Collaborator Partial Deliveries for milestones.
                     const start = m.collaboratorInfo?.startDate || p.startDate!;
                     const end = m.collaboratorInfo?.endDate || p.endDate!;
                     // Cast to PartialDelivery[] to match interface (CollaboratorPartialDelivery is compatible structure)
                     const milestones = (m.collaboratorInfo?.partialDeliveries || []) as PartialDelivery[];

                     tasksForThisProject.push({
                         project: p,
                         start,
                         end,
                         label: p.name,
                         milestones
                     });

                 } else {
                     // INTERNAL: Use Work Ranges defined in Internal Team View.
                     const ranges = m.internalCostInfo?.workRanges || [];
                     
                     if (ranges.length > 0) {
                        ranges.forEach(range => {
                            tasksForThisProject.push({
                                project: p,
                                start: range.startDate,
                                end: range.endDate,
                                label: `${p.name} - ${range.taskName}`,
                                milestones: range.partialDeliveries || []
                            });
                        });
                     } else {
                         // Fallback if no specific ranges defined: Use project dates, no specific milestones
                         tasksForThisProject.push({
                             project: p,
                             start: p.startDate!,
                             end: p.endDate!,
                             label: `${p.name} (Sin asignar)`,
                             milestones: []
                         });
                     }
                 }

                 memberMap.get(m.contact)!.tasks.push(...tasksForThisProject);
            }
        });
    });

    return Array.from(memberMap.values()).sort((a,b) => a.member.name.localeCompare(b.member.name));
  }, [activeProjects]);


  const statusColors = {
      [ProjectStatus.InProgress]: 'bg-sky-500',
      [ProjectStatus.Completed]: 'bg-green-500',
      [ProjectStatus.Proposal]: 'bg-orange-500',
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <div>
            <h1 className="text-3xl font-bold text-white">Planificación (Gantt)</h1>
            {projectsWithNoDatesCount > 0 && (
                <p className="text-xs text-gray-500 mt-1">
                    * {projectsWithNoDatesCount} proyectos ocultos por falta de fechas.
                </p>
            )}
        </div>
        
        {/* View Toggle */}
        <div className="bg-gray-800 p-1 rounded-lg flex space-x-1 border border-gray-700">
            <button 
                onClick={() => setViewMode('projects')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${viewMode === 'projects' ? 'bg-sky-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
                Por Proyectos
            </button>
            <button 
                onClick={() => setViewMode('team')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${viewMode === 'team' ? 'bg-sky-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
                Por Equipo
            </button>
        </div>
      </div>

      <Card className="flex-1 flex flex-col p-0 overflow-hidden border border-gray-700">
        
        {/* Timeline Header */}
        <div className="flex border-b border-gray-700 bg-gray-800 overflow-hidden flex-shrink-0 h-16 relative z-20">
            <div className="w-64 flex-shrink-0 border-r border-gray-700 p-4 font-bold text-gray-300 flex items-center bg-gray-800 z-30">
                {viewMode === 'projects' ? 'Proyecto' : 'Miembro del Equipo'}
            </div>
            <div className="flex-1 relative overflow-hidden">
                {/* Months Row */}
                <div className="h-8 border-b border-gray-700/50 relative">
                     {months.map((m, i) => {
                        const dateStr = m.toISOString().split('T')[0];
                        // Adjust visual position to align roughly with start of month
                        const left = getPosition(dateStr);
                        return (
                            <div key={`m-${i}`} className="absolute top-0 bottom-0 px-2 text-xs font-bold text-gray-300 flex items-center whitespace-nowrap border-l border-gray-600" style={{ left: `${left}%` }}>
                                {m.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                            </div>
                        );
                    })}
                </div>

                {/* Weeks Row */}
                <div className="h-8 relative">
                    {weeks.map((w, i) => {
                        const left = getPosition(w.toISOString().split('T')[0]);
                        // Simple bounds check
                        if (left < -5 || left > 105) return null;
                        
                        return (
                            <div key={`w-${i}`} className="absolute top-0 bottom-0 border-l border-gray-700 pl-1 text-[10px] text-gray-500 flex items-center" style={{ left: `${left}%` }}>
                                {w.getDate()}
                            </div>
                        );
                    })}
                </div>
                
                 {/* Current Date Indicator Header */}
                 {currentPosition >= 0 && currentPosition <= 100 && (
                     <div className="absolute bottom-0 text-[10px] text-red-500 font-bold -translate-x-1/2 bg-gray-800 px-1 rounded z-40" style={{ left: `${currentPosition}%` }}>
                         HOY
                     </div>
                 )}
            </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto overflow-x-hidden flex-1 relative bg-gray-900/50">
             
             {/* Wrapper to ensure full height for grid lines even when scrolling */}
             <div className="min-h-full relative isolate">
                
                {/* Background Layer for Grid and Lines - Fixed Alignment */}
                <div className="absolute inset-0 pointer-events-none z-0 flex">
                    <div className="w-64 flex-shrink-0 bg-transparent"></div>
                    <div className="flex-1 relative border-l border-gray-700/50">
                        {/* Grid Lines */}
                        {weeks.map((w, i) => {
                            const left = getPosition(w.toISOString().split('T')[0]);
                            if (left < -5 || left > 105) return null;
                            return (
                                <div key={`grid-${i}`} className="absolute top-0 bottom-0 border-l border-white/5" style={{ left: `${left}%` }}></div>
                            );
                        })}
                        
                        {/* Current Date Line */}
                        {currentPosition >= 0 && currentPosition <= 100 && (
                            <div className="absolute top-0 bottom-0 w-px bg-red-500 z-0 shadow-[0_0_4px_rgba(239,68,68,0.5)]" style={{ left: `${currentPosition}%` }}></div>
                        )}
                    </div>
                </div>

                {/* Projects Mode */}
                {viewMode === 'projects' && (
                    <div className="relative z-10">
                        {activeProjects.map(project => (
                            <div key={project.id} className="flex border-b border-gray-800 hover:bg-gray-800/30 transition-colors h-14 group">
                                <div className="w-64 flex-shrink-0 border-r border-gray-700 p-3 flex flex-col justify-center bg-gray-900 z-10">
                                    <div className="font-medium text-sm text-gray-200 truncate" title={project.name}>{project.name}</div>
                                    <div className="text-xs text-gray-500 font-mono">{project.code}</div>
                                </div>
                                <div className="flex-1 relative h-full">
                                    {/* Main Project Bar */}
                                    <div 
                                        className={`absolute top-3 h-8 rounded-md shadow-lg ${statusColors[project.status]} opacity-80 group-hover:opacity-100 transition-opacity flex items-center px-2`}
                                        style={{ 
                                            left: `${getPosition(project.startDate!)}%`, 
                                            width: `${getDurationPercent(project.startDate!, project.endDate!)}%` 
                                        }}
                                        title={`${project.startDate} - ${project.endDate} (${project.status})`}
                                    >
                                        <span className="text-xs text-white font-semibold truncate drop-shadow-md">{project.status}</span>
                                    </div>

                                    {/* Partial Deliveries Dots */}
                                    {project.partialDeliveries?.map((pd, idx) => {
                                        if(!pd.date) return null;
                                        const pos = getPosition(pd.date);
                                        // Only show if reasonably within view
                                        if (pos < -1 || pos > 101) return null;

                                        return (
                                            <div 
                                                key={`pd-${idx}`}
                                                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-purple-500 border-2 border-white rounded-full z-20 hover:scale-150 transition-transform cursor-pointer shadow-sm group/marker"
                                                style={{ left: `${pos}%` }}
                                            >
                                                {/* Tooltip on Hover */}
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] hidden group-hover/marker:block bg-gray-900 text-white text-xs p-2 rounded shadow-lg border border-gray-600 z-50 pointer-events-none">
                                                    <p className="font-bold text-purple-300">{pd.description}</p>
                                                    <p className="text-[10px] text-gray-400">{pd.date} {pd.completed ? '(Completado)' : ''}</p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Team Mode - Updated Logic */}
                {viewMode === 'team' && (
                    <div className="relative z-10">
                        {teamRows.map((row, idx) => {
                            // Calculate Row Height dynamically
                            const barHeight = 24; // approx h-6
                            const gap = 4;
                            const topPadding = 12;
                            const bottomPadding = 12;
                            
                            // Height needed for bars
                            const contentHeight = row.tasks.length * (barHeight + gap);
                            // Ensure minimum height of 64px (approx standard row)
                            const totalHeight = Math.max(64, contentHeight + topPadding + bottomPadding);

                            return (
                                <div 
                                    key={idx} 
                                    className="flex border-b border-gray-800 hover:bg-gray-800/30 transition-colors"
                                    style={{ height: `${totalHeight}px` }}
                                >
                                    <div className="w-64 flex-shrink-0 border-r border-gray-700 p-3 flex flex-col justify-center sticky left-0 bg-gray-900 z-20 h-full">
                                        <div className="font-medium text-sm text-gray-200">{row.member.name}</div>
                                        <div className="text-xs text-gray-500">{row.member.role}</div>
                                    </div>
                                    <div className="flex-1 relative w-full h-full">
                                        {row.tasks.map((task, tIdx) => {
                                            const barTop = topPadding + (tIdx * (barHeight + gap));
                                            
                                            return (
                                                <React.Fragment key={tIdx}>
                                                    {/* Task Bar */}
                                                    <div 
                                                        className={`absolute h-6 rounded-md shadow-sm ${statusColors[task.project.status]} opacity-80 hover:opacity-100 hover:z-30 transition-all flex items-center px-2 cursor-pointer border border-white/10`}
                                                        style={{ 
                                                            left: `${getPosition(task.start)}%`, 
                                                            width: `${Math.max(0.5, getDurationPercent(task.start, task.end))}%`,
                                                            top: `${barTop}px`
                                                        }}
                                                        title={`${task.project.name} [${task.project.code}] (${task.start} a ${task.end})`}
                                                    >
                                                        <span className="text-[10px] text-white font-medium truncate w-full">
                                                            {task.label}
                                                        </span>
                                                    </div>

                                                    {/* SPECIFIC Milestones for this Task/Range */}
                                                    {task.milestones.map((pd, pdIdx) => {
                                                        if(!pd.date) return null;
                                                        const pos = getPosition(pd.date);
                                                        if (pos < -1 || pos > 101) return null;

                                                        return (
                                                            <div 
                                                                key={`pd-${tIdx}-${pdIdx}`}
                                                                className="absolute w-2 h-2 bg-purple-400 border border-white rounded-full z-40 hover:scale-150 transition-transform cursor-pointer group/marker"
                                                                style={{ 
                                                                    left: `${pos}%`, 
                                                                    top: `${barTop + (barHeight/2) - 4}px` // Center vertically in the bar
                                                                }}
                                                            >
                                                                 {/* Tooltip on Hover */}
                                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[200px] hidden group-hover/marker:block bg-gray-900 text-white text-xs p-2 rounded shadow-lg border border-gray-600 z-50 pointer-events-none">
                                                                    <p className="font-bold text-purple-300">{pd.description}</p>
                                                                    <p className="text-[10px] text-gray-400">{pd.date}</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </React.Fragment>
                                            )
                                        })}
                                        {row.tasks.length === 0 && (
                                            <div className="flex items-center h-full px-4">
                                                <span className="text-xs text-gray-600 italic">Sin proyectos activos con fechas definidas</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                 
                 {activeProjects.length === 0 && (
                     <div className="p-10 text-center text-gray-500">
                         No hay proyectos con fechas definidas para mostrar en el cronograma.
                     </div>
                 )}
             </div>
        </div>
      </Card>
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-6 justify-center text-sm text-gray-400">
          <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-sky-500"></span> En Proceso
          </div>
          <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500"></span> Finalizado
          </div>
          <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-500"></span> Propuesta
          </div>
          <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-purple-500 border border-white"></span> Hito / Entrega Parcial
          </div>
          <div className="flex items-center gap-2">
              <span className="w-0.5 h-4 bg-red-500"></span> Fecha Actual
          </div>
      </div>
    </div>
  );
};

export default Planning;
