
import React, { useState, useMemo, useEffect } from 'react';
import { Project } from '../../types';
import { fetchGithubProject, searchGithubRepositories } from '../../services/githubService';
import { ICONS } from '../../constants';

interface StoreApp {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    repoUrl: string;
    category: string;
    images: string[];
    details: string;
    isExternal?: boolean;
    stars?: number;
    updatedAt?: string;
    language?: string;
    owner?: string;
}

const MOCK_UPDATED = "Actualizado hace 2 días";

// Curated list of REAL, working GitHub repositories
const STORE_APPS: StoreApp[] = [
    {
        id: '2048-game',
        name: '2048',
        owner: 'gabrielecirulli',
        description: 'A small clone of 1024, based on Saming\'s 2048.',
        icon: null,
        repoUrl: 'https://github.com/gabrielecirulli/2048',
        category: 'JavaScript',
        images: ['https://images.unsplash.com/photo-1614294148960-9aa740632a87?w=500&q=80'],
        details: 'El adictivo juego 2048. Desliza las fichas para combinar números iguales. ¡Alcanza la ficha 2048 para ganar, pero sigue jugando para obtener una puntuación alta!',
        stars: 12400,
        language: 'JavaScript',
        updatedAt: 'Hace 4 días'
    },
    {
        id: 'tetris-js',
        name: 'javascript-tetris',
        owner: 'jakesgordon',
        description: 'A classic Tetris game built with HTML5 Canvas and vanilla JavaScript.',
        icon: null,
        repoUrl: 'https://github.com/jakesgordon/javascript-tetris',
        category: 'JavaScript',
        images: ['https://images.unsplash.com/photo-1605333396915-47edadb30bc0?w=500&q=80'],
        details: 'Una implementación limpia y responsiva de Tetris. Cuenta con controles de teclado, seguimiento de puntuación y niveles de dificultad creciente.',
        stars: 845,
        language: 'JavaScript',
        updatedAt: 'Semana pasada'
    },
    {
        id: 'hextris',
        name: 'hextris',
        owner: 'HermanFassett',
        description: 'An addictive puzzle game inspired by Tetris.',
        icon: null,
        repoUrl: 'https://github.com/HermanFassett/hextris',
        category: 'HTML',
        images: ['https://raw.githubusercontent.com/HermanFassett/hextris/gh-pages/images/icons/apple-touch-icon-120x120.png'],
        details: 'Hextris es un juego de rompecabezas de ritmo rápido inspirado en Tetris. Los bloques comienzan en los bordes de la pantalla y caen hacia el hexágono interior.',
        stars: 2100,
        language: 'HTML',
        updatedAt: '24 Oct'
    },
    {
        id: 'pacman-js',
        name: 'pacman',
        owner: 'daleharvey',
        description: 'An HTML5 version of the classic Pacman.',
        icon: null,
        repoUrl: 'https://github.com/daleharvey/pacman',
        category: 'JavaScript',
        images: ['https://images.unsplash.com/photo-1585647347483-22b66260dfff?w=500&q=80'],
        details: 'Disfruta de Pacman directamente en tu navegador. Navega por el laberinto, come los puntos y evita a los fantasmas en esta fiel recreación.',
        stars: 560,
        language: 'JavaScript',
        updatedAt: '12 Sep'
    },
    {
        id: 'mac-calculator',
        name: 'mac-calculator',
        owner: 'taniarascia',
        description: 'A simple, elegant Mac-style calculator built with React.',
        icon: null,
        repoUrl: 'https://github.com/taniarascia/mac-calculator',
        category: 'JavaScript',
        images: ['https://images.unsplash.com/photo-1587145820266-a5951ee6f620?w=500&q=80'],
        details: 'Una calculadora ligera capaz de operaciones aritméticas básicas. Cuenta con un diseño limpio y amigable que encaja perfectamente con el tema del sistema operativo.',
        stars: 320,
        language: 'JavaScript',
        updatedAt: '15 Ene'
    },
    {
        id: 'astray-maze',
        name: 'Astray',
        owner: 'wwwtyro',
        description: 'A WebGL maze game built with Three.js and Box2D.',
        icon: null,
        repoUrl: 'https://github.com/wwwtyro/Astray',
        category: 'JavaScript',
        images: ['https://github.com/wwwtyro/Astray/raw/master/screenshot.png'],
        details: 'Astray es un juego de laberintos WebGL. Camina por el laberinto, recoge objetos y encuentra la salida. Utiliza Box2D para las físicas.',
        stars: 1800,
        language: 'JavaScript',
        updatedAt: 'Hace 1 mes'
    }
];

interface AppStoreAppProps {
    onInstall: (project: Project) => void;
}

const RepoIcon = () => (
    <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" fill="currentColor" className="text-[#8b949e]">
        <path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.45a.25.25 0 0 1-.4-.2Z"></path>
    </svg>
);

const StarIcon = () => (
    <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" fill="currentColor" className="text-[#8b949e] group-hover:text-[#58a6ff]">
        <path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"></path>
    </svg>
);

const AppStoreApp: React.FC<AppStoreAppProps> = ({ onInstall }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [selectedApp, setSelectedApp] = useState<StoreApp | null>(null);
    const [installingAppId, setInstallingAppId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    // State for GitHub API Search
    const [externalApps, setExternalApps] = useState<StoreApp[]>([]);
    const [isSearchingExternal, setIsSearchingExternal] = useState(false);

    // Categories are now "Languages" to match GitHub
    const categories = ['All', 'JavaScript', 'TypeScript', 'HTML', 'CSS'];

    const filteredApps = useMemo(() => {
        // Only show local curated apps if search is empty, otherwise rely on API?
        // Actually, blending is fine, but search results should usually dominate if specific.
        const local = STORE_APPS.filter(app => {
            const matchesSearch = app.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  app.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'All' || app.language === selectedCategory || app.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
        
        // Remove duplicates if API finds the same repo
        const externalIds = new Set(externalApps.map(e => e.repoUrl));
        const uniqueLocal = local.filter(l => !externalIds.has(l.repoUrl));
        
        return [...uniqueLocal, ...externalApps];
    }, [searchTerm, selectedCategory, externalApps]);

    // Handle search submission to GitHub
    const handleSearchSubmit = async () => {
        if (!searchTerm.trim()) return;
        
        setIsSearchingExternal(true);
        setExternalApps([]); 
        setSelectedApp(null); // Return to list view
        try {
            const results = await searchGithubRepositories(searchTerm);
            // Results are already mapped in service, but we ensure structure matches StoreApp
            setExternalApps(results);
        } catch (err) {
            console.error("Error buscando en GitHub:", err);
            setError("Error al conectar con GitHub. Intenta de nuevo.");
        } finally {
            setIsSearchingExternal(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearchSubmit();
        }
    };

    const handleInstall = async (app: StoreApp) => {
        setInstallingAppId(app.id);
        setError(null);
        try {
            const project = await fetchGithubProject(app.repoUrl);
            project.name = app.name; 
            if (app.isExternal) {
                // Use a generic folder/code icon for external imports initially
                project.icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>';
            }
            onInstall(project);
            alert(`¡${app.name} instalado correctamente! Búscalo en tu escritorio.`);
        } catch (err: any) {
            console.error(err);
            setError(`Falló la instalación de ${app.name}: ${err.message}`);
        } finally {
            setInstallingAppId(null);
        }
    };
    
    // GitHub Style Header Component
    const Header = () => (
        <div className="bg-[#161b22] border-b border-[#30363d] p-4 flex items-center gap-4 flex-shrink-0">
             <div className="text-white font-bold text-xl flex items-center gap-2 cursor-pointer" onClick={() => setSelectedApp(null)}>
                 <svg height="32" aria-hidden="true" viewBox="0 0 16 16" version="1.1" width="32" data-view-component="true" className="fill-white">
                    <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.12-1.09.38-1.55 1.19-.07.15-.27.36-.55.36-.28 0-.45-.18-.61-.38-.33-.41-.45-.82-.61-1.14-.19-.38-.56-.75-.89-1.03-.08-.09-.17-.18-.06-.3.12-.13.41-.12.56.02.43.38.69 1.05.96 1.47.37.58.64.97 1.11 1.03.48.06.51-.3.51-.55 0-.62.01-1.3.01-1.61 0-.2.15-.46.55-.38A8.013 8.013 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
                </svg>
             </div>
             <div className="flex-grow max-w-2xl relative">
                <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Buscar repositorios (ej. 'calculator', 'game')..."
                    className="w-full bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] rounded-md px-3 py-1.5 text-sm focus:border-[#58a6ff] focus:ring-1 focus:ring-[#58a6ff] outline-none transition-all placeholder-[#484f58]"
                />
                <span className="absolute right-2 top-1.5 border border-[#30363d] rounded px-1.5 text-xs text-[#8b949e]">/</span>
             </div>
             <div className="flex items-center gap-2 text-sm font-bold text-white">
                 {selectedApp ? (
                    <button onClick={() => setSelectedApp(null)} className="text-[#c9d1d9] hover:text-[#58a6ff]">Volver a resultados</button>
                 ) : (
                    <>
                        <span className="cursor-pointer hover:text-[#c9d1d9] text-[#8b949e] hidden md:inline">Explorar</span>
                        <button onClick={handleSearchSubmit} className="md:hidden text-[#58a6ff]">Buscar</button>
                    </>
                 )}
             </div>
        </div>
    );

    // Repository Details View
    const RepoView = ({ app }: { app: StoreApp }) => (
        <div className="flex flex-col h-full bg-[#0d1117] overflow-y-auto">
            <div className="bg-[#161b22] border-b border-[#30363d] px-4 md:px-8 py-4">
                 <div className="flex items-center gap-2 mb-4 text-[#58a6ff] text-xl flex-wrap">
                     <RepoIcon />
                     <span className="hover:underline cursor-pointer">{app.owner || 'unknown'}</span>
                     <span className="text-[#c9d1d9]">/</span>
                     <span className="font-bold hover:underline cursor-pointer">{app.name}</span>
                     <span className="ml-2 px-2 py-0.5 rounded-full border border-[#30363d] text-[#8b949e] text-xs font-medium bg-[#0d1117]">Public</span>
                 </div>
                 
                 {error && (
                    <div className="mb-4 bg-red-900/20 border border-red-500/50 text-red-200 p-3 rounded-md text-sm">
                        {error}
                    </div>
                 )}

                 <div className="flex gap-1 text-[#c9d1d9] text-sm overflow-x-auto no-scrollbar">
                     <div className="px-3 md:px-4 py-2 border-b-2 border-[#fd8c73] font-semibold flex items-center gap-2 cursor-pointer bg-[#0d1117] rounded-t-md whitespace-nowrap">
                         <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" fill="currentColor"><path d="M4.72 3.22a.75.75 0 0 1 1.06 1.06L2.06 8l3.72 3.72a.75.75 0 1 1-1.06 1.06L.47 8.53a.75.75 0 0 1 0-1.06l4.25-4.25Zm6.56 0a.75.75 0 1 0-1.06 1.06L13.94 8l-3.72 3.72a.75.75 0 1 0 1.06 1.06l4.25-4.25a.75.75 0 0 0 0-1.06l-4.25-4.25Z"></path></svg>
                         Código
                     </div>
                 </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6 p-6 max-w-[1280px] mx-auto w-full">
                {/* Main Content (README style) */}
                <div className="flex-grow min-w-0">
                    <div className="border border-[#30363d] rounded-md bg-[#0d1117]">
                        <div className="bg-[#161b22] p-3 border-b border-[#30363d] rounded-t-md text-sm font-bold text-[#c9d1d9] flex items-center gap-2">
                            <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" fill="currentColor"><path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.45a.25.25 0 0 1-.4-.2Z"></path></svg>
                            README.md
                        </div>
                        <div className="p-8 text-[#c9d1d9]">
                             <h1 className="text-3xl font-bold border-b border-[#30363d] pb-2 mb-6">{app.name}</h1>
                             <p className="mb-6 text-base leading-7 whitespace-pre-line">{app.details || app.description}</p>
                             
                             {app.images.length > 0 && (
                                <div className="space-y-4">
                                    <h2 className="text-xl font-bold border-b border-[#30363d] pb-2 mb-4">Capturas de pantalla</h2>
                                    <div className="grid grid-cols-1 gap-4">
                                        {app.images.map((img, i) => (
                                            <img key={i} src={img} alt="Screenshot" className="w-full rounded border border-[#30363d]" />
                                        ))}
                                    </div>
                                </div>
                             )}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar */}
                <div className="w-full md:w-80 flex-shrink-0 space-y-6">
                    <div>
                        <h3 className="text-[#c9d1d9] font-bold text-sm mb-3">Acerca de</h3>
                        <p className="text-[#8b949e] text-sm mb-4">{app.description}</p>
                        
                        <div className="flex items-center gap-2 text-sm text-[#8b949e] mb-2 hover:text-[#58a6ff] cursor-pointer">
                             <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" fill="currentColor"><path d="M11.5 10c2.49 0 4.5 2.01 4.5 4.5a.5.5 0 0 1-1 0c0-1.93-1.57-3.5-3.5-3.5-1.93 0-3.5 1.57-3.5 3.5a.5.5 0 0 1-1 0c0-2.49 2.01-4.5 4.5-4.5Zm-5 0c.55 0 1 .45 1 1v2.5a1 1 0 0 1-1 1H1a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1h5.5Z"></path></svg>
                             <a href={app.repoUrl} target="_blank" rel="noopener noreferrer">Ver en GitHub</a>
                        </div>
                        
                        {app.stars !== undefined && (
                             <div className="flex items-center gap-2 text-sm text-[#8b949e] mb-2">
                                <StarIcon />
                                {app.stars} estrellas
                            </div>
                        )}
                         <div className="flex items-center gap-2 text-sm text-[#8b949e] mb-4">
                             <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" fill="currentColor"><path d="M1.5 8a6.5 6.5 0 1 1 13 0 6.5 6.5 0 0 1-13 0ZM8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0Z"></path></svg>
                             {app.language || 'Web'}
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => handleInstall(app)}
                        disabled={!!installingAppId}
                        className="w-full px-4 py-2 bg-[#238636] text-white font-bold rounded-md hover:bg-[#2ea043] border border-[rgba(240,246,252,0.1)] shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {installingAppId === app.id ? <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div> : <svg aria-hidden="true" height="16" viewBox="0 0 16 16" version="1.1" width="16" fill="currentColor"><path d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14Z"></path><path d="M7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.969a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.749.749 0 0 1-1.06 0L4.22 6.78a.749.749 0 1 1 1.06-1.06l1.97 1.969Z"></path></svg>}
                        {installingAppId === app.id ? 'Clonando...' : 'Código (Instalar)'}
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-[#0d1117] text-[#c9d1d9] font-sans">
            <Header />

            {selectedApp ? (
                <RepoView app={selectedApp} />
            ) : (
                // Search Results Layout
                <div className="flex flex-1 overflow-hidden">
                    {/* Left Sidebar (Filters) */}
                    <div className="w-64 md:w-72 border-r border-[#30363d] p-4 md:p-8 flex-shrink-0 hidden md:block overflow-y-auto">
                        <div className="mb-6">
                            <h3 className="font-semibold text-[#c9d1d9] text-sm mb-2 px-2">Filtrar por</h3>
                             <div className="flex flex-col mb-4">
                                <div className="px-2 py-1.5 text-sm font-semibold text-[#c9d1d9] bg-[#161b22] border-l-2 border-[#fd8c73] cursor-pointer">Repositorios</div>
                             </div>

                            <h3 className="font-semibold text-[#c9d1d9] text-sm mb-2 px-2 mt-6">Lenguajes</h3>
                            <div className="flex flex-col">
                                {categories.map(cat => (
                                    <div 
                                        key={cat}
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`px-2 py-1.5 text-sm cursor-pointer flex items-center justify-between hover:bg-[#161b22] hover:text-[#58a6ff] rounded-md ${selectedCategory === cat ? 'font-bold text-[#c9d1d9]' : 'text-[#8b949e]'}`}
                                    >
                                        {cat === 'All' ? 'Todos' : cat}
                                        {selectedCategory === cat && <span className="text-[#c9d1d9]">✓</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Main Results List */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-8">
                        {isSearchingExternal && (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#58a6ff]"></div>
                            </div>
                        )}
                        
                        {!isSearchingExternal && (
                            <div className="max-w-4xl">
                                <div className="flex justify-between items-center mb-4 border-b border-[#30363d] pb-4">
                                     <h2 className="font-bold text-xl">{filteredApps.length} resultados de repositorios</h2>
                                     <div className="text-sm text-[#8b949e]">
                                        <span className="cursor-pointer hover:text-[#58a6ff]">Ordenar: Mejor coincidencia</span>
                                     </div>
                                </div>
                                
                                {error && (
                                    <div className="mb-4 bg-red-900/20 border border-red-500/50 text-red-200 p-3 rounded-md text-sm">
                                        {error}
                                    </div>
                                )}

                                <ul className="space-y-4">
                                    {filteredApps.map(app => (
                                        <li key={app.id} className="border-b border-[#30363d] pb-6 last:border-0">
                                            <div className="flex items-start gap-2 mb-1">
                                                <div className="mt-1"><RepoIcon /></div>
                                                <div className="text-[#58a6ff] text-base font-semibold break-all">
                                                    <span 
                                                        className="cursor-pointer hover:underline"
                                                        onClick={() => setSelectedApp(app)}
                                                    >
                                                        {app.owner || 'unknown'} / <span className="font-bold">{app.name}</span>
                                                    </span>
                                                    {app.isExternal && <span className="ml-2 border border-[#30363d] rounded-full px-2 py-0.5 text-xs text-[#8b949e] font-normal">Comunidad</span>}
                                                </div>
                                            </div>
                                            <p className="text-[#8b949e] text-sm mb-2 max-w-3xl">
                                                {app.description}
                                            </p>
                                            
                                            <div className="flex flex-wrap items-center gap-4 text-xs text-[#8b949e] mt-2">
                                                 {app.stars !== undefined && (
                                                    <div className="flex items-center gap-1 hover:text-[#58a6ff] cursor-pointer group">
                                                        <StarIcon />
                                                        {app.stars}
                                                    </div>
                                                 )}
                                                 <div className="flex items-center gap-1">
                                                     <span className={`w-3 h-3 rounded-full border border-[rgba(255,255,255,0.1)] ${app.language === 'JavaScript' ? 'bg-[#f1e05a]' : app.language === 'HTML' ? 'bg-[#e34c26]' : app.language === 'TypeScript' ? 'bg-[#3178c6]' : 'bg-[#563d7c]'}`}></span>
                                                     {app.language || 'Web'}
                                                 </div>
                                                 <div>{app.updatedAt || MOCK_UPDATED}</div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                                
                                {filteredApps.length === 0 && (
                                     <div className="text-center py-12">
                                         <h3 className="font-bold text-lg mb-2">No encontramos repositorios para '{searchTerm}'</h3>
                                         <p className="text-[#8b949e]">Intenta buscar términos como 'game', 'calculator' o 'react app'.</p>
                                     </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppStoreApp;
