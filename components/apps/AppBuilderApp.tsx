
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Project, ProjectFile } from '../../types';
import LoadingSpinner from '../LoadingSpinner';
import { ICONS } from '../../constants';
import { fetchGithubProject } from '../../services/githubService';

interface AppBuilderAppProps {
    projects: Project[];
    onProjectsChange: (projects: Project[]) => void;
    onInstall: (project: Project) => void;
    getAiCodeHelp: (projectFiles: ProjectFile[], activeFile: ProjectFile, prompt: string) => Promise<string | { html: string; css: string; js: string; }>;
    generateIcon: (prompt: string) => Promise<string>;
}

const CreateProjectModal: React.FC<{
    onClose: () => void;
    onCreate: (name: string) => void;
}> = ({ onClose, onCreate }) => {
    const [name, setName] = useState('');

    const handleSubmit = () => {
        if (name.trim()) {
            onCreate(name.trim());
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div 
                className="p-6 rounded-lg shadow-2xl w-full max-w-md border bg-[#252526] border-[#333]"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-lg font-bold mb-4 text-[#22d3ee]">Create New Project</h2>
                <div>
                    <label className="block text-sm font-medium mb-1 text-slate-300">Project Name</label>
                    <input 
                        type="text" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        className="w-full bg-[#1e1e1e] rounded border border-[#333] px-3 py-2 text-sm text-white focus:border-[#22d3ee] outline-none transition-colors"
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    />
                </div>
                <div className="mt-6 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 rounded text-sm hover:bg-white/5 transition-colors text-slate-300">Cancel</button>
                    <button onClick={handleSubmit} disabled={!name.trim()} className="px-4 py-2 rounded text-sm font-bold bg-[#22d3ee] text-black disabled:opacity-50">Create</button>
                </div>
            </div>
        </div>
    );
};

const ImportGithubModal: React.FC<{
    onClose: () => void;
    onImport: (url: string) => Promise<void>;
}> = ({ onClose, onImport }) => {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!url.trim()) return;
        setLoading(true);
        setError('');
        try {
            await onImport(url.trim());
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to import repository. Ensure it is public and contains index.html');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div 
                className="p-6 rounded-lg shadow-2xl w-full max-w-md border bg-[#252526] border-[#333]"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-lg font-bold mb-4 text-[#22d3ee]">Import from GitHub</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-300">Repository URL</label>
                        <input 
                            type="text" 
                            value={url} 
                            onChange={(e) => setUrl(e.target.value)} 
                            placeholder="https://github.com/username/repo"
                            className="w-full bg-[#1e1e1e] rounded border border-[#333] px-3 py-2 text-sm text-white focus:border-[#22d3ee] outline-none transition-colors"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        />
                        <p className="text-xs text-slate-500 mt-1">Must be a public repository containing standard web files (index.html, style.css, script.js).</p>
                    </div>
                    {error && <p className="text-red-400 text-xs">{error}</p>}
                </div>
                <div className="mt-6 flex justify-end gap-2">
                    <button onClick={onClose} disabled={loading} className="px-4 py-2 rounded text-sm hover:bg-white/5 transition-colors text-slate-300">Cancel</button>
                    <button onClick={handleSubmit} disabled={!url.trim() || loading} className="px-4 py-2 rounded text-sm font-bold bg-[#22d3ee] text-black disabled:opacity-50 flex items-center gap-2">
                        {loading && <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-black"></div>}
                        Import
                    </button>
                </div>
            </div>
        </div>
    );
};

const EditProjectModal: React.FC<{
    project: Project;
    onClose: () => void;
    onSave: (newName: string) => void;
    onGenerateIcon: (prompt: string) => Promise<void>;
}> = ({ project, onClose, onSave, onGenerateIcon }) => {
    const [name, setName] = useState(project.name);
    const [iconPrompt, setIconPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        if (!iconPrompt.trim()) return;
        setIsGenerating(true);
        await onGenerateIcon(iconPrompt);
        setIsGenerating(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div 
                className="p-6 rounded-lg shadow-2xl w-full max-w-md border bg-[#252526] border-[#333]"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-lg font-bold mb-4 text-[#22d3ee]">Edit Project</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-300">Project Name</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-[#1e1e1e] rounded border border-[#333] px-3 py-2 text-sm text-white focus:border-[#22d3ee] outline-none transition-colors"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-300">Generate New Icon</label>
                        <div className="flex gap-2">
                            <input type="text" value={iconPrompt} onChange={(e) => setIconPrompt(e.target.value)} placeholder="e.g., a smiling sun" className="flex-grow bg-[#1e1e1e] rounded border border-[#333] px-3 py-2 text-sm text-white focus:border-[#22d3ee] outline-none transition-colors"/>
                            <button onClick={handleGenerate} disabled={isGenerating || !iconPrompt.trim()} className="px-4 py-2 rounded text-sm font-medium disabled:opacity-50 flex items-center justify-center w-24 bg-[#22d3ee] text-black">
                                {isGenerating ? <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-current"></div> : 'Generate'}
                            </button>
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 rounded text-sm hover:bg-white/5 transition-colors text-slate-300">Cancel</button>
                    <button onClick={() => { onSave(name); onClose(); }} className="px-4 py-2 rounded text-sm font-bold bg-[#22d3ee] text-black">Save</button>
                </div>
            </div>
        </div>
    );
};

const CodeEditor: React.FC<{file: ProjectFile, onChange: (content: string) => void}> = ({ file, onChange }) => {
    const lineNumbersRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const cursorPositionRef = useRef<number | null>(null);

    useEffect(() => {
        if (textareaRef.current && cursorPositionRef.current !== null) {
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(cursorPositionRef.current, cursorPositionRef.current);
            cursorPositionRef.current = null;
        }
    }, [file.content]);

    const lineCount = useMemo(() => (file.content.match(/\n/g) || []).length + 1, [file.content]);

    const handleScroll = () => {
        if (lineNumbersRef.current && textareaRef.current) {
            lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
        }
    };
    
    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        cursorPositionRef.current = e.target.selectionStart;
        
        const newContent = e.target.value;
        if (file.type === 'html' && newContent.trim() === '!') {
            const boilerplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <style>
    body { font-family: sans-serif; }
  </style>
</head>
<body>
  <h1>Hello World</h1>
  <script>
    console.log("Hello from JS");
  </script>
</body>
</html>`;
            onChange(boilerplate);
        } else {
            onChange(newContent);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const textarea = e.currentTarget;
        const { selectionStart, selectionEnd, value } = textarea;
        const pairs: { [key: string]: string } = { '(': ')', '{': '}', '[': ']', '"': '"', "'": "'" };

        if (pairs[e.key]) {
            e.preventDefault();
            const newValue = value.substring(0, selectionStart) + e.key + pairs[e.key] + value.substring(selectionEnd);
            cursorPositionRef.current = selectionStart + 1;
            onChange(newValue);
        }

        if (e.key === 'Tab') {
            e.preventDefault();
            const newValue = value.substring(0, selectionStart) + '  ' + value.substring(selectionEnd);
            cursorPositionRef.current = selectionStart + 2;
            onChange(newValue);
        }
    };

    return (
        <div className="flex h-full w-full bg-[#1e1e1e] text-[#d4d4d4] font-mono text-[13px] leading-6">
            <div ref={lineNumbersRef} className="py-2 pr-4 pl-2 text-right bg-[#1e1e1e] text-[#858585] overflow-hidden select-none min-w-[3rem] border-r border-[#333]">
                {Array.from({ length: lineCount }, (_, i) => <div key={i} className="h-6">{i + 1}</div>)}
            </div>
            <textarea
                ref={textareaRef}
                onScroll={handleScroll}
                value={file.content}
                onChange={handleContentChange}
                onKeyDown={handleKeyDown}
                className="flex-grow w-full h-full bg-transparent p-2 resize-none focus:outline-none whitespace-pre"
                spellCheck="false"
                autoCapitalize="off"
                autoComplete="off"
                style={{ fontFamily: 'Consolas, "Courier New", monospace' }}
            />
        </div>
    );
};

const AppBuilderApp: React.FC<AppBuilderAppProps> = ({ projects, onProjectsChange, onInstall, getAiCodeHelp, generateIcon }) => {
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projects[0]?.id || null);
    const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
    const [openFileIds, setOpenFileIds] = useState<string[]>([]);
    
    const [aiHelpQuery, setAiHelpQuery] = useState('');
    const [aiHelpResponse, setAiHelpResponse] = useState<string | { html: string; css: string; js: string; } | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [editingProject, setEditingProject] = useState<Project | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    
    // UI State
    const [sidebarWidth, setSidebarWidth] = useState(240);
    const [editorPanelHeight, setEditorPanelHeight] = useState(400);
    const [activeBottomTab, setActiveBottomTab] = useState<'preview' | 'ai'>('preview');
    const [isPreviewFullscreen, setIsPreviewFullscreen] = useState(false);
    const [resizing, setResizing] = useState<'sidebar' | 'editor' | null>(null);
    const [aiResponseTab, setAiResponseTab] = useState<'html' | 'css' | 'js'>('html');
    const [expandedSections, setExpandedSections] = useState<{files: boolean, projects: boolean}>({ files: true, projects: true });

    const mainPanelRef = useRef<HTMLDivElement>(null);

    const selectedProject = useMemo(() => projects.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);
    const selectedFile = useMemo(() => selectedProject?.files.find(f => f.id === selectedFileId), [selectedProject, selectedFileId]);

    // Handle initial selection and open files
    useEffect(() => {
        if (!selectedProjectId && projects.length > 0) setSelectedProjectId(projects[0].id);
    }, [projects, selectedProjectId]);

    useEffect(() => {
        if (selectedProject) {
            // Check if open files belong to the new selected project. If not, clear and open default.
            const currentProjectFileIds = selectedProject.files.map(f => f.id);
            const openFilesBelongToProject = openFileIds.every(id => currentProjectFileIds.includes(id));
            
            if (!openFilesBelongToProject || openFileIds.length === 0) {
                 const defaultFile = selectedProject.files.find(f => f.type === 'html') || selectedProject.files[0];
                 if (defaultFile) {
                     setOpenFileIds([defaultFile.id]);
                     setSelectedFileId(defaultFile.id);
                 } else {
                     setOpenFileIds([]);
                     setSelectedFileId(null);
                 }
            } else if (!selectedFileId && openFileIds.length > 0) {
                setSelectedFileId(openFileIds[0]);
            }
        }
    }, [selectedProjectId]);

    const handleResize = useCallback((e: MouseEvent) => {
        if (resizing === 'sidebar') {
            setSidebarWidth(prev => Math.max(200, Math.min(e.clientX - (mainPanelRef.current?.getBoundingClientRect().left || 0), 500)));
        } else if (resizing === 'editor' && mainPanelRef.current) {
            const mainPanelRect = mainPanelRef.current.getBoundingClientRect();
            const newHeight = e.clientY - mainPanelRect.top;
            setEditorPanelHeight(Math.max(100, Math.min(newHeight, mainPanelRect.height - 100)));
        }
    }, [resizing]);

    const stopResizing = useCallback(() => setResizing(null), []);

    useEffect(() => {
        if (resizing) {
            window.addEventListener('mousemove', handleResize);
            window.addEventListener('mouseup', stopResizing, { once: true });
        }
        return () => {
            window.removeEventListener('mousemove', handleResize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [resizing, handleResize, stopResizing]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsPreviewFullscreen(false); };
        if (isPreviewFullscreen) document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isPreviewFullscreen]);

    const updateProject = (projectId: string, updates: Partial<Project>) => {
        onProjectsChange(projects.map(p => p.id === projectId ? { ...p, ...updates } : p));
    };

    const updateFileContent = (fileId: string, content: string) => {
        if (!selectedProjectId || !selectedProject) return;
        const updatedFiles = selectedProject.files.map(f => f.id === fileId ? { ...f, content } : f);
        updateProject(selectedProjectId, { files: updatedFiles });
    };

    const executeCreateProject = (name: string) => {
        const now = Date.now();
        const newProject: Project = {
            id: `proj-${now}`, name,
            icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5-10 5zM2 17l10 5 10-5-10-5-10 5z"/></svg>',
            files: [
                { id: `file-${now}-html`, name: 'index.html', type: 'html', content: `<!DOCTYPE html>\n<html>\n<head>\n  <title>${name}</title>\n  <style>\n    body { font-family: sans-serif; background: #121212; color: white; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }\n  </style>\n</head>\n<body>\n  <h1>Hello, ${name}!</h1>\n  <script>\n    console.log("App loaded");\n  </script>\n</body>\n</html>` },
                { id: `file-${now}-css`, name: 'style.css', type: 'css', content: `/* Extra styles here */` },
                { id: `file-${now}-js`, name: 'script.js', type: 'js', content: `// Extra logic here` }
            ]
        };
        onProjectsChange([...projects, newProject]);
        setSelectedProjectId(newProject.id);
    };

    const executeImportProject = async (url: string) => {
        try {
            const newProject = await fetchGithubProject(url);
            onProjectsChange([...projects, newProject]);
            setSelectedProjectId(newProject.id);
        } catch (error) {
            console.error("Import failed:", error);
            throw error;
        }
    };
    
    const handleDeleteProject = (projectId: string) => {
        if (window.confirm(`Are you sure you want to delete project "${projects.find(p=>p.id===projectId)?.name}"?`)) {
            const newProjects = projects.filter(p => p.id !== projectId);
            onProjectsChange(newProjects);
            if (selectedProjectId === projectId) setSelectedProjectId(newProjects[0]?.id || null);
        }
    };

    const handleFileClick = (fileId: string) => {
        if (!openFileIds.includes(fileId)) {
            setOpenFileIds([...openFileIds, fileId]);
        }
        setSelectedFileId(fileId);
    };

    const closeFile = (e: React.MouseEvent, fileId: string) => {
        e.stopPropagation();
        const newOpenFiles = openFileIds.filter(id => id !== fileId);
        setOpenFileIds(newOpenFiles);
        if (selectedFileId === fileId) {
            setSelectedFileId(newOpenFiles[newOpenFiles.length - 1] || null);
        }
    };

    const handleAskAiHelp = async () => {
        if (!aiHelpQuery.trim() || !selectedFile || !selectedProject) return;
        setIsAiLoading(true); setAiHelpResponse(null);
        try {
            const response = await getAiCodeHelp(selectedProject.files, selectedFile, aiHelpQuery);
            setAiHelpResponse(response);
            setActiveBottomTab('ai');
            if (typeof response === 'object') {
                setAiResponseTab('html');
            }
        } catch (error) {
            setAiHelpResponse(`Error getting help: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsAiLoading(false);
        }
    };

    const handleApplyAiHelp = () => {
        if (!aiHelpResponse || !selectedProject) return;
    
        if (typeof aiHelpResponse === 'string') {
            if (!selectedFile || aiHelpResponse.startsWith('Error')) return;
            updateFileContent(selectedFile.id, aiHelpResponse);
        } else {
            const newFiles = selectedProject.files.map(file => {
                if (file.type === 'html') return { ...file, content: aiHelpResponse.html };
                if (file.type === 'css') return { ...file, content: aiHelpResponse.css };
                if (file.type === 'js') return { ...file, content: aiHelpResponse.js };
                return file;
            });
            updateProject(selectedProject.id, { files: newFiles });
        }
        
        setAiHelpResponse(null);
        setAiHelpQuery('');
    };

    const compilePreview = useMemo((): string => {
        if (!selectedProject) return '<html><body><p style="color:white; font-family:sans-serif; text-align:center; padding-top:20px;">Select a project to preview.</p></body></html>';
        const htmlFile = selectedProject.files.find(f => f.type === 'html');
        const cssFile = selectedProject.files.find(f => f.type === 'css');
        const jsFile = selectedProject.files.find(f => f.type === 'js');
        if (!htmlFile) return '<html><body><p style="color:white; font-family:sans-serif; text-align:center; padding-top:20px;">No HTML file found.</p></body></html>';
        
        let html = htmlFile.content;
        if (cssFile && cssFile.content.trim()) html = html.replace('</head>', `<style>${cssFile.content}</style></head>`);
        if (jsFile && jsFile.content.trim()) html = html.replace('</body>', `<script>${jsFile.content}</script></body>`);
        return html;
    }, [selectedProject]);

    // Render Helpers
    const toggleSection = (section: 'files' | 'projects') => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const renderAiHelper = () => {
        if (isAiLoading) return <div className="flex justify-center items-center h-full"><LoadingSpinner /></div>;
        if (aiHelpResponse) {
            const isError = typeof aiHelpResponse === 'string' && aiHelpResponse.startsWith('Error');
            return (
                <div className="p-3 h-full flex flex-col bg-[#1e1e1e]">
                    <div className="flex-shrink-0 flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-[#22d3ee] uppercase tracking-wider">AI Suggestion</span>
                        {typeof aiHelpResponse === 'object' && (
                            <div className="flex bg-slate-800 rounded p-0.5">
                                {['html', 'css', 'js'].map(t => (
                                    <button key={t} onClick={() => setAiResponseTab(t as any)} className={`px-3 py-1 text-[10px] uppercase rounded-sm ${aiResponseTab === t ? 'bg-[#22d3ee] text-black font-bold' : 'text-slate-400 hover:text-white'}`}>{t}</button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex-grow bg-[#252526] border border-[#333] rounded mb-3 flex flex-col min-h-0 relative">
                         <textarea 
                            readOnly 
                            value={typeof aiHelpResponse === 'string' ? aiHelpResponse : aiHelpResponse[aiResponseTab]} 
                            className={`w-full h-full bg-transparent text-xs font-mono resize-none focus:outline-none p-3 ${isError ? 'text-red-400' : 'text-[#9cdcfe]'}`}
                         />
                    </div>
                    <div className="flex gap-3 flex-shrink-0">
                        {!isError && <button onClick={handleApplyAiHelp} className="flex-1 px-4 py-2 rounded text-xs font-bold bg-[#22d3ee] text-black hover:bg-[#67e8f9] transition-colors">Apply Changes</button>}
                        <button onClick={() => {setAiHelpResponse(null); setAiHelpQuery('');}} className="flex-1 px-4 py-2 rounded text-xs font-bold bg-slate-700 text-white hover:bg-slate-600 transition-colors">Discard</button>
                    </div>
                </div>
            );
        }
        return (
            <div className="p-4 h-full flex flex-col justify-center items-center bg-[#1e1e1e]">
                <div className="text-center max-w-sm">
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4 text-[#22d3ee]">
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M9.401 3.003c.43-.429 1.13-.429 1.56 0l9 9a1.1 1.1 0 0 1 0 1.558l-9 9a1.1 1.1 0 0 1-1.56 0l-9-9a1.1 1.1 0 0 1 0-1.558l9-9zM10 5.12l-6.88 6.88L10 18.88l6.88-6.88L10 5.12z" clipRule="evenodd" /></svg>
                    </div>
                    <h3 className="text-sm font-bold text-white mb-2">Ask Gemini for Help</h3>
                    <p className="text-xs text-slate-400 mb-6">Describe what you want to change or add to your code. e.g., "Make the background blue"</p>
                    <div className="flex gap-2 w-full">
                        <input type="text" value={aiHelpQuery} onChange={e => setAiHelpQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAskAiHelp()} placeholder="Describe changes..." className="flex-grow bg-[#252526] border border-[#333] rounded px-3 py-2 text-xs text-white focus:border-[#22d3ee] outline-none" disabled={!selectedFile || isAiLoading} />
                        <button onClick={handleAskAiHelp} disabled={!selectedFile || isAiLoading || !aiHelpQuery.trim()} className="px-4 py-2 rounded text-xs font-bold bg-[#22d3ee] text-black hover:bg-[#67e8f9] disabled:opacity-50">Ask</button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex h-full w-full bg-[#1e1e1e] text-[#cccccc] font-sans text-sm select-none overflow-hidden">
             {isCreateModalOpen && <CreateProjectModal onClose={() => setIsCreateModalOpen(false)} onCreate={executeCreateProject} />}
             {isImportModalOpen && <ImportGithubModal onClose={() => setIsImportModalOpen(false)} onImport={executeImportProject} />}
             {editingProject && (
                <EditProjectModal
                    project={editingProject}
                    onClose={() => setEditingProject(null)}
                    onSave={(newName) => updateProject(editingProject.id, { name: newName })}
                    onGenerateIcon={async (prompt) => {
                        const newIcon = await generateIcon(prompt);
                        updateProject(editingProject.id, { icon: newIcon });
                    }}
                />
            )}
            {isPreviewFullscreen && (
                <div className="fixed inset-0 z-[100] bg-black flex flex-col">
                    <iframe srcDoc={compilePreview} title="App Preview Fullscreen" sandbox="allow-scripts allow-same-origin" className="w-full h-full border-0 bg-white"/>
                    <button onClick={() => setIsPreviewFullscreen(false)} className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 rounded-full text-sm bg-black/50 text-white hover:bg-black/70 backdrop-blur-md transition-colors border border-white/20">
                        {ICONS.restore} Exit Fullscreen
                    </button>
                </div>
            )}
            
            {/* Sidebar */}
            <div className="flex flex-col border-r border-[#333] bg-[#252526]" style={{ width: `${sidebarWidth}px`}}>
                <div className="p-3 text-xs font-bold text-slate-400 tracking-wider">EXPLORER</div>
                
                {/* Active Project Files Section */}
                {selectedProject && (
                    <div className="flex flex-col">
                        <div 
                            className="flex items-center px-2 py-1 cursor-pointer hover:text-white font-bold text-xs text-slate-300 transition-colors"
                            onClick={() => toggleSection('files')}
                        >
                            <span className={`mr-1 transition-transform duration-200 ${expandedSections.files ? 'rotate-90' : ''}`}>▶</span>
                            {selectedProject.name.toUpperCase()}
                        </div>
                        {expandedSections.files && (
                             <div className="flex flex-col mb-2">
                                {selectedProject.files.map(file => (
                                    <div 
                                        key={file.id} 
                                        onClick={() => handleFileClick(file.id)} 
                                        className={`pl-6 py-1 pr-2 cursor-pointer text-xs flex items-center gap-2 hover:bg-[#2a2d2e] ${selectedFileId === file.id ? 'bg-[#37373d] text-[#22d3ee]' : 'text-[#cccccc]'}`}
                                    >
                                        <span className={`w-3 h-3 flex items-center justify-center text-[10px] rounded-sm ${file.type === 'html' ? 'text-orange-500' : file.type === 'css' ? 'text-blue-500' : 'text-yellow-500'}`}>
                                           {file.type === 'html' ? '<>' : file.type === 'css' ? '#' : '{}'}
                                        </span>
                                        <span className="truncate">{file.name}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* All Projects Section */}
                <div className="flex flex-col mt-2">
                     <div 
                        className="flex items-center justify-between px-2 py-1 cursor-pointer hover:text-white font-bold text-xs text-slate-300 transition-colors group"
                        onClick={() => toggleSection('projects')}
                    >
                        <div className="flex items-center">
                            <span className={`mr-1 transition-transform duration-200 ${expandedSections.projects ? 'rotate-90' : ''}`}>▶</span>
                            PROJECTS
                        </div>
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-all">
                             <button onClick={(e) => { e.stopPropagation(); setIsImportModalOpen(true); }} className="p-1 rounded hover:bg-white/10 mr-1" title="Import from GitHub">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setIsCreateModalOpen(true); }} className="p-1 rounded hover:bg-white/10" title="New Project">
                                {ICONS.add}
                            </button>
                        </div>
                    </div>
                    {expandedSections.projects && (
                        <div className="flex flex-col overflow-y-auto custom-scrollbar flex-grow">
                             {projects.map(proj => (
                                <div 
                                    key={proj.id} 
                                    className={`group flex items-center px-4 py-1 cursor-pointer hover:bg-[#2a2d2e] ${selectedProjectId === proj.id ? 'text-white' : 'text-[#888]'}`}
                                    onClick={() => setSelectedProjectId(proj.id)}
                                >
                                    <span className="text-xs truncate flex-grow">{proj.name}</span>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => { e.stopPropagation(); onInstall(proj); }} title="Install" className="hover:text-green-400">{ICONS.upload}</button>
                                        <button onClick={(e) => { e.stopPropagation(); setEditingProject(proj); }} title="Edit" className="hover:text-blue-400">{ICONS.edit}</button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteProject(proj.id); }} title="Delete" className="hover:text-red-400">{ICONS.close}</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div onMouseDown={() => setResizing('sidebar')} className="w-1 cursor-col-resize flex-shrink-0 bg-[#252526] hover:bg-[#22d3ee] transition-colors z-10 border-l border-[#333]"></div>

            {/* Main Area */}
            <div ref={mainPanelRef} className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
                {/* Editor Tabs */}
                <div className="flex bg-[#252526] overflow-x-auto border-b border-[#333] min-h-[35px] flex-shrink-0">
                    {openFileIds.map(fileId => {
                         const file = selectedProject?.files.find(f => f.id === fileId);
                         if (!file) return null;
                         const isActive = selectedFileId === fileId;
                         return (
                             <div 
                                key={fileId}
                                onClick={() => setSelectedFileId(fileId)}
                                className={`group flex items-center gap-2 px-3 py-2 text-xs border-r border-[#333] cursor-pointer min-w-[120px] max-w-[200px] select-none ${isActive ? 'bg-[#1e1e1e] text-white border-t-2 border-t-[#22d3ee]' : 'text-[#969696] hover:bg-[#2a2d2e] border-t-2 border-t-transparent'}`}
                             >
                                <span className={`w-2 h-2 rounded-full ${file.type === 'html' ? 'bg-orange-500' : file.type === 'css' ? 'bg-blue-500' : 'bg-yellow-500'}`}></span>
                                <span className="truncate flex-grow">{file.name}</span>
                                <button onClick={(e) => closeFile(e, fileId)} className={`p-0.5 rounded-full hover:bg-white/20 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                </button>
                             </div>
                         );
                    })}
                </div>

                {/* Editor Panel */}
                <div className="flex flex-col relative" style={{ height: `${editorPanelHeight}px` }}>
                    <div className="flex-grow min-h-0 relative">
                        {selectedFile ? (
                            <CodeEditor file={selectedFile} onChange={(content) => updateFileContent(selectedFile.id, content)} />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-[#555]">
                                <div className="text-4xl mb-4 opacity-20">{ICONS.appBuilder}</div>
                                <p className="text-xs">Select a file from the explorer to edit</p>
                                <p className="text-xs mt-2 opacity-50">cmd+s to save (auto-saved)</p>
                            </div>
                        )}
                    </div>
                </div>
                
                <div onMouseDown={() => setResizing('editor')} className="h-1 cursor-row-resize flex-shrink-0 bg-[#252526] hover:bg-[#22d3ee] transition-colors z-10 border-t border-[#333]"></div>

                {/* Bottom Panel (Preview/AI) */}
                <div className="flex-1 flex flex-col min-h-0 bg-[#1e1e1e]">
                    <div className="flex-shrink-0 flex items-center border-b border-[#333] bg-[#252526]">
                        <button onClick={() => setActiveBottomTab('preview')} className={`px-4 py-2 text-xs font-bold uppercase tracking-wide border-t-2 transition-colors ${activeBottomTab === 'preview' ? 'border-[#22d3ee] text-white bg-[#1e1e1e]' : 'border-transparent text-[#969696] hover:text-white'}`}>Preview</button>
                        <button onClick={() => setActiveBottomTab('ai')} className={`px-4 py-2 text-xs font-bold uppercase tracking-wide border-t-2 transition-colors flex items-center gap-2 ${activeBottomTab === 'ai' ? 'border-[#22d3ee] text-white bg-[#1e1e1e]' : 'border-transparent text-[#969696] hover:text-white'}`}>
                             AI Helper {aiHelpResponse && <span className="w-1.5 h-1.5 rounded-full bg-[#22d3ee]"></span>}
                        </button>
                        <div className="flex-grow"></div>
                        {activeBottomTab === 'preview' && (
                             <button onClick={() => setIsPreviewFullscreen(true)} className="mr-2 p-1 text-[#969696] hover:text-white transition-colors" title="Fullscreen">
                                {ICONS.fullscreen}
                             </button>
                        )}
                    </div>
                     <div className="flex-grow min-h-0 relative">
                        {activeBottomTab === 'preview' ? (
                            <div className="w-full h-full bg-white relative">
                                <iframe key={selectedProject?.id} srcDoc={compilePreview} title="App Preview" sandbox="allow-scripts allow-same-origin" className="w-full h-full border-0"/>
                            </div>
                        ) : (
                            renderAiHelper()
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AppBuilderApp;
