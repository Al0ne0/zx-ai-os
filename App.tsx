
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Message, MessageSender, WindowInstance, AppType, WindowState, VFSFile, CustomApp, AppVersion, Project, SavedWallpaper, SavedNote } from './types';
import { Chat } from '@google/genai';
import Desktop from './components/Desktop';
import Taskbar from './components/Taskbar';
import VideoGenerationToast from './components/VideoGenerationToast';
import LoadingSpinner from './components/LoadingSpinner';
import VoiceOrb from './components/VoiceOrb';
import { processCommand, getVideosOperation, generateImageFromApi, generateIcon as generateIconApi, getModifiedHtml, startChat, getAiCodeHelp, analyzeImageWithPrompt, editImageWithPrompt, executeComplexQuery } from './services/geminiService';
import * as storage from './services/storageService';
import EditAppModal from './components/EditAppModal';
import VersionHistoryModal from './components/VersionHistoryModal';
import CommandCenter from './components/CommandCenter';

const TASKBAR_HEIGHT = 68;

interface Theme { backgroundColor: string; textColor: string; primaryColor: string; }
interface Background { type: 'color' | 'image' | 'video'; value: string; fileId?: string; }
interface VideoJob {
    prompt: string;
    status: 'pending' | 'error';
    operation: any;
    type: 'background' | 'viewer';
    windowId?: string;
}
interface PendingFileAction {
    type: 'analyze' | 'edit';
    prompt: string;
}

const getApiErrorMessage = (error: unknown, context?: string): string => {
    const prefix = context ? `${context}. ` : '';
    let reason = '';
    
    if (typeof error === 'object' && error !== null) {
        const errorAsAny = error as any;
        if (errorAsAny?.error?.status === 'RESOURCE_EXHAUSTED') {
            const message = errorAsAny.error.message || 'Your API quota has been exceeded.';
            reason = `Error: ${message}. This is a limit on the free tier. Please check your Google AI Studio project settings or try again later.`;
            return prefix + reason;
        }
    }

    const errorMessage = (error instanceof Error) ? error.message : String(error);
    if (errorMessage.includes('quota exceeded') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
        reason = 'Error: The Gemini API quota has been exceeded. This is a limit on the free tier. Please check your Google AI Studio project settings or try again later.';
        return prefix + reason;
    }

    reason = 'An unexpected error occurred. Please check the console for details.';
    return prefix + reason;
};


const App: React.FC = () => {
    const [isAppLoading, setIsAppLoading] = useState<boolean>(true);
    const [messages, setMessages] = useState<Message[]>([
        { id: '1', sender: MessageSender.SYSTEM, text: 'ZX STUDIO Initialized. Try "what is this image?" or "open transcriber".' },
        { id: 'quota-info', sender: MessageSender.SYSTEM, text: 'Welcome to ZX STUDIO. As a free tier user, please be aware there are limits on AI generation. If you exceed your quota, features like image and video generation will be temporarily unavailable. You can monitor your usage in your Google AI Studio account.' }
    ]);
    const [windows, setWindows] = useState<WindowInstance[]>([]);
    const [customApps, setCustomApps] = useState<CustomApp[]>([]);
    const [vfsFiles, setVfsFiles] = useState<VFSFile[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [theme, setTheme] = useState<Theme>({ backgroundColor: '#0f172a', textColor: '#e0f2fe', primaryColor: '#22d3ee' });
    const [backgroundContent, setBackgroundContent] = useState<Background>({ type: 'color', value: '#0f172a' });
    const [cursorSvg, setCursorSvg] = useState<string | null>(null);
    const [isTtsEnabled, setIsTtsEnabled] = useState<boolean>(false);
    const [videoGenerationJobs, setVideoGenerationJobs] = useState<{ [key: string]: VideoJob }>({});
    const [editingApp, setEditingApp] = useState<CustomApp | null>(null);
    const [versionHistoryApp, setVersionHistoryApp] = useState<CustomApp | null>(null);
    const [chat, setChat] = useState<Chat | null>(null);
    const [isCommandCenterOpen, setIsCommandCenterOpen] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [savedWallpapers, setSavedWallpapers] = useState<SavedWallpaper[]>([]);
    const [savedNotes, setSavedNotes] = useState<SavedNote[]>([]);
    const [pendingFileAction, setPendingFileAction] = useState<PendingFileAction | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const windowsRef = useRef(windows);
    useEffect(() => { windowsRef.current = windows; }, [windows]);

    const addMessage = (sender: MessageSender, text: string, component?: React.ReactNode) => {
        setMessages(prev => [...prev, { id: Date.now().toString(), sender, text, component }]);
    };

    const handleDeleteNote = useCallback((noteId: string) => {
        const noteToDelete = savedNotes.find(note => note.id === noteId);
        if (noteToDelete) {
            setSavedNotes(prev => prev.filter(note => note.id !== noteId));
            setWindows(prev => prev.filter(win => !(win.appType === AppType.NOTEPAD && win.content.id === noteId)));
            addMessage(MessageSender.SYSTEM, `Note "${noteToDelete.title}" deleted.`);
        }
    }, [savedNotes]);

    const handleSetBackground = useCallback((file: VFSFile) => {
        if (file.type.startsWith('image/')) {
            setBackgroundContent({ type: 'image', value: file.url, fileId: file.id });
        } else if (file.type.startsWith('video/')) {
            setBackgroundContent({ type: 'video', value: file.url, fileId: file.id });
        }
    }, []);

    const handleDeleteFile = useCallback(async (fileId: string) => {
        setVfsFiles(prev => {
            const fileToDelete = prev.find(f => f.id === fileId);
            if (fileToDelete) {
                URL.revokeObjectURL(fileToDelete.url);
            }
            return prev.filter(f => f.id !== fileId);
        });
        try {
            await storage.deleteVfsFile(fileId);
            addMessage(MessageSender.SYSTEM, "File deleted.");
        } catch (error) {
            console.error("Failed to delete file:", error);
            addMessage(MessageSender.SYSTEM, "Error deleting file from storage.");
        }
    }, []);
    
    const calculateNewWindowPosition = (existingWindows: WindowInstance[], newWindowSize: { width: number, height: number }): { x: number; y: number } => {
        const nonChatWindowsCount = existingWindows.length;
        const offset = 30;
        const cascadeIndex = nonChatWindowsCount % 10;
        
        let x = 100 + cascadeIndex * offset;
        let y = 50 + cascadeIndex * offset;
    
        const desktopHeight = window.innerHeight - TASKBAR_HEIGHT;
    
        if (x + newWindowSize.width > window.innerWidth) {
            x = window.innerWidth - newWindowSize.width - 20;
        }
        if (y + newWindowSize.height > desktopHeight) {
            y = desktopHeight - newWindowSize.height - 20;
        }
    
        return { x: Math.max(20, x), y: Math.max(20, y) };
    };

    const bringToFront = (id: string) => {
        setWindows(prev => {
            const windowToMove = prev.find(w => w.id === id);
            if (!windowToMove) return prev;
            return [...prev.filter(w => w.id !== id), windowToMove];
        });
    };

    const addWindow = useCallback((appType: AppType, title: string, content: any, size = { width: 500, height: 400 }): string => {
        const newWindow: WindowInstance = {
            id: `${appType}-${Date.now()}`, appType, title, content,
            position: calculateNewWindowPosition(windowsRef.current, size),
            size, state: WindowState.NORMAL,
        };
        setWindows(prev => [...prev, newWindow]);
        bringToFront(newWindow.id);
        return newWindow.id;
    }, []);


    useEffect(() => {
        const initialize = async () => {
            try {
                const [savedState, savedFiles] = await Promise.all([
                    storage.loadOsState(),
                    storage.loadAllVfsFiles()
                ]);

                if (savedFiles) setVfsFiles(savedFiles);

                if (savedState) {
                    setCustomApps(savedState.customApps || []);
                    setTheme(savedState.theme || { backgroundColor: '#0f172a', textColor: '#e0f2fe', primaryColor: '#22d3ee' });
                    setCursorSvg(savedState.cursorSvg || null);
                    setProjects(savedState.projects || []);
                    setSavedWallpapers(savedState.savedWallpapers || []);
                    setSavedNotes(savedState.savedNotes || []);
                    
                    let bgContent = savedState.backgroundContent || { type: 'color', value: '#0f172a' };
                    if (bgContent.fileId && savedFiles) {
                        const bgFile = savedFiles.find(f => f.id === bgContent.fileId);
                        bgContent.value = bgFile ? bgFile.url : savedState.theme?.backgroundColor || '#0f172a';
                        bgContent.type = bgFile ? (bgFile.type.startsWith('video/') ? 'video' : 'image') : 'color';
                    }
                    setBackgroundContent(bgContent);

                    let otherWindows = (savedState.windows || [])
                        .map((win: WindowInstance) => {
                             if (win.appType === AppType.FILE_MANAGER) {
                                return { ...win, content: { ...win.content, onSetBackground: handleSetBackground, onDeleteFile: handleDeleteFile } };
                            }
                            return win;
                        });
                     setWindows(otherWindows);

                }
            } catch (error) {
                console.error("Error loading initial state:", error);
            } finally {
                setIsAppLoading(false);
                setChat(startChat());
            }
        };

        initialize();
    }, [handleSetBackground, handleDeleteFile]);
    
    useEffect(() => {
        if (isAppLoading) return;
        
        const bgContentForStorage = {
            ...backgroundContent,
            value: backgroundContent.type === 'color' ? backgroundContent.value : ''
        };
        
        const serializableWindows = windows.map(win => {
             // Generic sanitization for all windows to prevent cloning errors
             if (win.content && typeof win.content === 'object') {
                const { content, ...rest } = win;
                const newContent = { ...content };
                // Remove non-serializable parts from content (functions)
                Object.keys(newContent).forEach(key => {
                    if (typeof newContent[key] === 'function') {
                        delete newContent[key];
                    }
                });
                return { ...rest, content: newContent };
            }
            return win;
        });

        const stateToSave = {
            windows: serializableWindows,
            customApps,
            theme,
            backgroundContent: bgContentForStorage,
            cursorSvg,
            projects,
            savedWallpapers,
            savedNotes,
        };
        storage.saveOsState(stateToSave).catch(err => {
            console.error("Failed to save OS state:", err);
        });
    }, [windows, customApps, theme, backgroundContent, cursorSvg, isAppLoading, projects, savedWallpapers, savedNotes]);
    
    const handleLaunchWebBrowser = useCallback(() => {
        addWindow(AppType.WEB_BROWSER, "Web Browser", {}, { width: 1024, height: 768 });
    }, [addWindow]);

    const handleInstallProject = useCallback(async (project: Project) => {
        const htmlFile = project.files.find(f => f.type === 'html');
        if (!htmlFile) {
            addMessage(MessageSender.SYSTEM, `Project "${project.name}" cannot be installed without an index.html file.`);
            return;
        }

        const cssFile = project.files.find(f => f.type === 'css');
        const jsFile = project.files.find(f => f.type === 'js');
        
        let compiledHtml = htmlFile.content;
        if (cssFile) {
             compiledHtml = compiledHtml.replace('</head>', `<style>${cssFile.content}</style></head>`);
        }
        if (jsFile) {
            compiledHtml = compiledHtml.replace('</body>', `<script>${jsFile.content}</script></body>`);
        }
        
        const newApp: CustomApp = {
            id: `app-${Date.now()}`,
            name: project.name,
            versions: [{
                versionId: `v-${Date.now()}`,
                createdAt: Date.now(),
                icon: project.icon,
                htmlContent: compiledHtml
            }],
            activeVersionId: `v-${Date.now()}`
        };
        
        setCustomApps(prev => [...prev, newApp]);
        handleLaunchApp(newApp);
        addMessage(MessageSender.SYSTEM, `Successfully installed and launched "${project.name}".`);
    }, [addWindow, setCustomApps]);

    const handleLaunchAppBuilder = useCallback(() => {
        addWindow(
            AppType.APP_BUILDER,
            "App Studio",
            {
                projects,
                onProjectsChange: setProjects,
                onInstall: handleInstallProject,
                getAiCodeHelp: getAiCodeHelp,
                generateIcon: generateIconApi,
            },
            { width: 1200, height: 800 }
        );
    }, [addWindow, projects, handleInstallProject]);

    const handleLaunchAppStore = useCallback(() => {
        addWindow(
            AppType.APP_STORE,
            "App Store",
            { onInstall: handleInstallProject },
            { width: 1024, height: 768 }
        );
    }, [addWindow, handleInstallProject]);

    const handleLaunchWallpaperManager = useCallback(() => {
        addWindow(
            AppType.WALLPAPER_MANAGER, "Wallpapers",
            {
                wallpapers: savedWallpapers,
                vfsFiles: vfsFiles,
                onSetWallpaper: handleSetBackground,
                onDeleteWallpaper: handleDeleteWallpaper,
                onDownloadWallpaper: handleDownloadWallpaper,
            },
            { width: 800, height: 600 }
        );
    }, [addWindow, savedWallpapers, vfsFiles, handleSetBackground, handleDeleteFile]);

    const handleLaunchNotesManager = useCallback(() => {
        addWindow(
            AppType.NOTES_MANAGER, "Notes",
            {
                notes: savedNotes,
                onDeleteNote: handleDeleteNote,
                onOpenNote: (note: SavedNote) => {
                    const existingWindow = windows.find(win => win.appType === AppType.NOTEPAD && win.content.id === note.id);
                    if (existingWindow) {
                        bringToFront(existingWindow.id);
                        if(existingWindow.state === WindowState.MINIMIZED) {
                            setWindows(prev => prev.map(w => w.id === existingWindow.id ? { ...w, state: WindowState.NORMAL } : w));
                        }
                    } else {
                        addWindow(AppType.NOTEPAD, note.title, note);
                    }
                },
            },
            { width: 700, height: 500 }
        );
    }, [addWindow, savedNotes, windows, handleDeleteNote]);
    
    const handleLaunchImageAnalyzer = useCallback(() => {
        addWindow(AppType.IMAGE_ANALYZER, "Image Analyzer", { analyzeImage: analyzeImageWithPrompt }, { width: 900, height: 600 });
    }, [addWindow]);

    const handleLaunchImageEditor = useCallback(() => {
        addWindow(AppType.IMAGE_EDITOR, "Image Editor", { editImage: editImageWithPrompt }, { width: 1024, height: 768 });
    }, [addWindow]);

    const handleLaunchTranscriber = useCallback(() => {
        addWindow(AppType.TRANSCRIBER, "Transcriber", {}, { width: 600, height: 400 });
    }, [addWindow]);

    useEffect(() => {
        setWindows(prev => prev.map(win => {
            if (win.appType === AppType.APP_BUILDER) {
                return { 
                    ...win, 
                    content: { 
                        ...win.content, 
                        projects, 
                        onProjectsChange: setProjects,
                        onInstall: handleInstallProject,
                        getAiCodeHelp: getAiCodeHelp,
                        generateIcon: generateIconApi
                    } 
                };
            }
             if (win.appType === AppType.WALLPAPER_MANAGER) {
                return { ...win, content: { ...win.content, wallpapers: savedWallpapers, vfsFiles } };
            }
             if (win.appType === AppType.NOTES_MANAGER) {
                return { ...win, content: { ...win.content, notes: savedNotes } };
            }
            if (win.appType === AppType.APP_STORE) {
                return { ...win, content: { ...win.content, onInstall: handleInstallProject } };
            }
            if (win.appType === AppType.IMAGE_ANALYZER) {
                return { ...win, content: { ...win.content, analyzeImage: analyzeImageWithPrompt } };
            }
            if (win.appType === AppType.IMAGE_EDITOR) {
                 return { ...win, content: { ...win.content, editImage: editImageWithPrompt } };
            }
            return win;
        }));
    }, [projects, savedWallpapers, vfsFiles, savedNotes, handleInstallProject]);
    
    const handleLaunchApp = useCallback((app: CustomApp) => {
        const activeVersion = app.versions.find(v => v.versionId === app.activeVersionId);
        if (activeVersion) {
            addWindow(
                AppType.HTML_APP,
                app.name,
                { htmlContent: activeVersion.htmlContent, customAppId: app.id },
                { width: 600, height: 450 }
            );
        }
    }, [addWindow]);

    const updateWindow = (id: string, updates: Partial<WindowInstance>) => {
        setWindows(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
    };
    
    const handleNoteContentChange = useCallback((noteId: string, newContent: string) => {
        setSavedNotes(prevNotes =>
            prevNotes.map(note =>
                note.id === noteId ? { ...note, content: newContent } : note
            )
        );
        setWindows(prevWindows =>
            prevWindows.map(win =>
                win.appType === AppType.NOTEPAD && win.content.id === noteId
                    ? { ...win, content: { ...win.content, content: newContent } }
                    : win
            )
        );
    }, []);

    const processApiResults = useCallback(async (results: any[], isAgentRun = false) => {
        for (const result of results) {
            if (result.message && !isAgentRun) addMessage(MessageSender.AI, result.message);

            switch(result.type) {
                case 'app':
                    addWindow(result.appType, result.title, result.content, result.size);
                    break;
                case 'note_create': {
                    const { title, content } = result;
                    const newNote: SavedNote = {
                        id: `note-${Date.now()}`,
                        title,
                        content,
                        createdAt: Date.now()
                    };
                    setSavedNotes(prev => [...prev, newNote]);
                    addWindow(AppType.NOTEPAD, title, newNote);
                    break;
                }
                case 'note_delete_request': {
                    const { title } = result;
                    const noteToDelete = savedNotes.find(n => n.title.toLowerCase() === title.toLowerCase());
                    if (noteToDelete) {
                        handleDeleteNote(noteToDelete.id);
                    } else {
                        addMessage(MessageSender.SYSTEM, `Could not find a note with the title "${title}".`);
                    }
                    break;
                }
                case 'list_notes_request': {
                    if (savedNotes.length === 0) {
                        addMessage(MessageSender.SYSTEM, "You have no saved notes.");
                    } else {
                        const noteList = savedNotes.map(n => `- ${n.title}`).join('\n');
                        addMessage(MessageSender.SYSTEM, `Here are your notes:\n${noteList}`);
                    }
                    break;
                }
                case 'list_apps_request': {
                    if (customApps.length === 0) {
                        addMessage(MessageSender.SYSTEM, "You have no custom apps installed.");
                    } else {
                        const appList = customApps.map(a => `- ${a.name}`).join('\n');
                        addMessage(MessageSender.SYSTEM, `Here are your installed apps:\n${appList}`);
                    }
                    break;
                }
                case 'open_app_builder_request':
                    handleLaunchAppBuilder();
                    break;
                case 'open_wallpaper_manager_request':
                    handleLaunchWallpaperManager();
                    break;
                case 'open_notes_manager_request':
                    handleLaunchNotesManager();
                    break;
                case 'open_image_analyzer_request':
                    handleLaunchImageAnalyzer();
                    break;
                case 'open_image_editor_request':
                    handleLaunchImageEditor();
                    break;
                case 'open_transcriber_request':
                    handleLaunchTranscriber();
                    break;
                case 'image_analysis_start':
                case 'image_edit_start':
                    setPendingFileAction({
                        type: result.type === 'image_analysis_start' ? 'analyze' : 'edit',
                        prompt: result.prompt,
                    });
                    fileInputRef.current?.click();
                    break;
                case 'complex_query': {
                     if (!isAgentRun) addMessage(MessageSender.SYSTEM, `Thinking more deeply...`);
                     const complexResponse = await executeComplexQuery(result.prompt);
                     if (!isAgentRun) addMessage(MessageSender.AI, complexResponse);
                     break;
                }
                case 'html_app_create':
                    const newApp: CustomApp = {
                        id: `app-${Date.now()}`, name: result.name,
                        versions: [{ versionId: `v-${Date.now()}`, createdAt: Date.now(), icon: result.icon, htmlContent: result.htmlContent }],
                        activeVersionId: `v-${Date.now()}`
                    };
                    setCustomApps(prev => [...prev, newApp]);
                    handleLaunchApp(newApp);
                    break;
                 case 'html_app_modify_request': {
                    const { appName, modificationRequest } = result;
                    const appToModify = customApps.find(app => app.name.toLowerCase() === appName.toLowerCase());
                    if (!appToModify) {
                        if (!isAgentRun) addMessage(MessageSender.SYSTEM, `Could not find an app named "${appName}".`);
                        break;
                    }
                    const activeVersion = appToModify.versions.find(v => v.versionId === appToModify.activeVersionId);
                    if (!activeVersion) {
                        if (!isAgentRun) addMessage(MessageSender.SYSTEM, `Could not find an active version for "${appName}".`);
                        break;
                    }
                    
                    if (!isAgentRun) addMessage(MessageSender.SYSTEM, `Modifying "${appName}"...`);
                    try {
                        const newHtmlContent = await getModifiedHtml(activeVersion.htmlContent, modificationRequest);
                        const newVersion: AppVersion = {
                            versionId: `v-${Date.now()}`,
                            createdAt: Date.now(),
                            icon: activeVersion.icon,
                            htmlContent: newHtmlContent,
                        };
                        
                        setCustomApps(prev => prev.map(app => {
                            if (app.id === appToModify.id) {
                                return {
                                    ...app,
                                    versions: [...app.versions, newVersion],
                                    activeVersionId: newVersion.versionId,
                                };
                            }
                            return app;
                        }));
                        
                        if (!isAgentRun) addMessage(MessageSender.SYSTEM, `Successfully updated "${appName}". A new version has been created.`);
                    } catch (error) {
                        const friendlyMessage = getApiErrorMessage(error, `Failed to modify "${appName}"`);
                        if (!isAgentRun) addMessage(MessageSender.SYSTEM, friendlyMessage);
                    }
                    break;
                }
                case 'html_app_uninstall':
                    setCustomApps(prev => {
                        const appToUninstall = prev.find(app => app.name.toLowerCase() === result.appName.toLowerCase());
                        if (appToUninstall) {
                            setWindows(currentWindows => currentWindows.filter(win => 
                                !(win.appType === AppType.HTML_APP && win.content.customAppId === appToUninstall.id)
                            ));
                        }
                        return prev.filter(app => app.name.toLowerCase() !== result.appName.toLowerCase());
                    });
                    break;
                case 'theme_change': setTheme(result.theme); break;
                
                case 'background_generation_start': {
                    const { prompt } = result;
                    if (!isAgentRun) addMessage(MessageSender.SYSTEM, `Generating background image: "${prompt}"...`);
                    
                    const dataURLtoBlob = (dataurl: string): Blob => {
                        const arr = dataurl.split(',');
                        const mimeMatch = arr[0].match(/:(.*?);/);
                        if (!mimeMatch) throw new Error("Invalid data URL");
                        const mime = mimeMatch[1];
                        const bstr = atob(arr[1]);
                        let n = bstr.length;
                        const u8arr = new Uint8Array(n);
                        while (n--) { u8arr[n] = bstr.charCodeAt(n); }
                        return new Blob([u8arr], { type: mime });
                    };

                    const imageUrl = await generateImageFromApi(prompt, '16:9');
                    const imageBlob = dataURLtoBlob(imageUrl);
                    const fileId = `vfs-${Date.now()}`;
                    const newFile: VFSFile = {
                        id: fileId, name: `${prompt.substring(0, 20)}.jpg`, type: 'image/jpeg',
                        url: URL.createObjectURL(imageBlob), blob: imageBlob
                    };
                    
                    await storage.saveVfsFile(newFile);
                    setVfsFiles(prev => [...prev, newFile]);

                    const newWallpaper: SavedWallpaper = {
                        id: `wp-${Date.now()}`, prompt: prompt, type: 'image',
                        url: newFile.url, fileId: newFile.id,
                    };
                    setSavedWallpapers(prev => [...prev, newWallpaper]);

                    setBackgroundContent({ type: 'image', value: newFile.url, fileId: newFile.id });
                    if (!isAgentRun) addMessage(MessageSender.SYSTEM, `Background updated and saved to Wallpapers.`);
                    break;
                }
                
                case 'image_generation_start': {
                    const { prompt } = result;
                    const windowId = addWindow(AppType.IMAGE_GENERATOR, `Image: ${prompt.substring(0, 20)}...`, { prompt, status: 'generating' }, { width: 512, height: 512 });
                    try {
                        const imageUrl = await generateImageFromApi(prompt, '1:1');
                        updateWindow(windowId, { content: { prompt, imageUrl, status: 'success' } });
                    } catch (e) {
                         updateWindow(windowId, { content: { prompt, status: 'error' } });
                        throw e;
                    }
                    break;
                }
                
                case 'video_generation_start': {
                    const { prompt, operation } = result;
                    const windowId = addWindow(AppType.VIDEO_GENERATOR, `Video: ${prompt.substring(0, 20)}...`, { prompt, status: 'generating' }, { width: 512, height: 512 });
                    const jobId = `video-job-${Date.now()}`;
                    setVideoGenerationJobs(prev => ({ ...prev, [jobId]: { prompt, status: 'pending', operation, type: 'viewer', windowId }}));
                    break;
                }
                
                case 'cursor_change': setCursorSvg(result.svg); break;
                
                case 'video_background_generation_start': {
                    const jobId = `video-job-${Date.now()}`;
                    const newJob: VideoJob = {
                        prompt: result.prompt,
                        status: 'pending',
                        operation: result.operation,
                        type: 'background'
                    };
                    setVideoGenerationJobs(prev => ({ ...prev, [jobId]: newJob }));
                    break;
                }
            }
        }
    }, [addWindow, customApps, handleLaunchApp, setCustomApps, setWindows, setTheme, setVfsFiles, setSavedWallpapers, setBackgroundContent, updateWindow, setVideoGenerationJobs, setCursorSvg, setSavedNotes, savedNotes, handleDeleteNote, handleLaunchAppBuilder, handleLaunchWallpaperManager, handleLaunchNotesManager, handleLaunchImageAnalyzer, handleLaunchImageEditor, handleLaunchTranscriber]);

    const handleFileForPendingAction = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !pendingFileAction) {
            setPendingFileAction(null);
            return;
        }

        const file = e.target.files[0];
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64Image = reader.result as string;
            const imageData = {
                file: file,
                base64: base64Image,
                prompt: pendingFileAction.prompt,
            };

            if (pendingFileAction.type === 'analyze') {
                addWindow(AppType.IMAGE_ANALYZER, "Image Analyzer", {
                    ...imageData,
                    analyzeImage: analyzeImageWithPrompt,
                }, { width: 900, height: 600 });
            } else if (pendingFileAction.type === 'edit') {
                 addWindow(AppType.IMAGE_EDITOR, "Image Editor", {
                    ...imageData,
                    editImage: editImageWithPrompt,
                }, { width: 1024, height: 768 });
            }
            setPendingFileAction(null);
        };
        reader.onerror = () => {
            addMessage(MessageSender.SYSTEM, "Error reading the selected file.");
            setPendingFileAction(null);
        };
        
        e.target.value = ''; // Reset file input

    }, [pendingFileAction, addWindow]);


    const hexToRgb = (hex: string): string => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0,0,0';
    };

    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--background-color', theme.backgroundColor);
        root.style.setProperty('--background-rgb', hexToRgb(theme.backgroundColor));
        root.style.setProperty('--text-color', theme.textColor);
        root.style.setProperty('--text-rgb', hexToRgb(theme.textColor));
        root.style.setProperty('--primary-color', theme.primaryColor);
        root.style.setProperty('--primary-rgb', hexToRgb(theme.primaryColor));
        if (backgroundContent.type === 'color') {
            setBackgroundContent(bg => ({ ...bg, value: theme.backgroundColor }));
        }
    }, [theme, backgroundContent.type]);

    useEffect(() => {
        let styleElement = document.getElementById('custom-cursor-style');
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'custom-cursor-style';
            document.head.appendChild(styleElement);
        }
        if (cursorSvg) {
            const encodedSvg = encodeURIComponent(cursorSvg).replace(/'/g, '%27').replace(/"/g, '%22');
            styleElement.innerHTML = `.custom-cursor { cursor: url("data:image/svg+xml,${encodedSvg}"), auto; }`;
        } else {
            styleElement.innerHTML = '';
        }
    }, [cursorSvg]);

    useEffect(() => {
        if (!isTtsEnabled) {
            window.speechSynthesis.cancel();
            return;
        };
        const lastMessage = messages[messages.length - 1];
        if (lastMessage && lastMessage.sender === MessageSender.AI && lastMessage.text) {
            const utterance = new SpeechSynthesisUtterance(lastMessage.text);
            window.speechSynthesis.speak(utterance);
        }
    }, [messages, isTtsEnabled]);

    const handleWindowContentChange = (id: string, newContent: any) => {
        // Check for the specific object structure sent on drag end to update position.
        // This prevents the entire window instance from being nested inside the 'content' property.
        if (typeof newContent === 'object' && newContent !== null && newContent.id === id && newContent.appType && newContent.position) {
            updateWindow(id, { position: newContent.position });
        } else {
            updateWindow(id, { content: newContent });
        }
    };

    useEffect(() => {
        const pendingJobs = Object.keys(videoGenerationJobs).filter(
            (id) => videoGenerationJobs[id].status === 'pending'
        );
        if (pendingJobs.length === 0) return;

        const interval = setInterval(() => {
            pendingJobs.forEach(async (jobId) => {
                const job = videoGenerationJobs[jobId];
                if (!job || !job.operation) return;

                try {
                    let result = await getVideosOperation(job.operation);

                    if (result.done) {
                        const downloadLink = result.response?.generatedVideos?.[0]?.video?.uri;
                        if (downloadLink) {
                            const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
                            const videoBlob = await response.blob();
                            const videoUrl = URL.createObjectURL(videoBlob);
                            
                            if (job.type === 'background') {
                                const videoFile: VFSFile = { id: `vfs-${Date.now()}`, name: `${job.prompt.substring(0, 20)}.mp4`, type: 'video/mp4', url: videoUrl, blob: videoBlob };
                                await storage.saveVfsFile(videoFile);
                                setVfsFiles(prev => [...prev, videoFile]);

                                const newWallpaper: SavedWallpaper = {
                                    id: `wp-${Date.now()}`, prompt: job.prompt, type: 'video',
                                    url: videoFile.url, fileId: videoFile.id,
                                };
                                setSavedWallpapers(prev => [...prev, newWallpaper]);

                                setBackgroundContent({ type: 'video', value: videoFile.url, fileId: videoFile.id });
                                addMessage(MessageSender.SYSTEM, `Video background "${job.prompt}" finished, applied, and saved to Wallpapers.`);
                            } else if (job.type === 'viewer' && job.windowId) {
                                updateWindow(job.windowId, { content: { prompt: job.prompt, imageUrl: videoUrl, status: 'success' } });
                            }
                        }
                        setVideoGenerationJobs(prev => {
                            const newJobs = { ...prev };
                            delete newJobs[jobId];
                            return newJobs;
                        });
                    } else {
                        setVideoGenerationJobs(prev => ({ ...prev, [jobId]: { ...job, operation: result } }));
                    }
                } catch (error) {
                    console.error('Video generation polling error:', error);
                    const friendlyMessage = getApiErrorMessage(error, `Video generation failed for "${job.prompt}"`);
                    addMessage(MessageSender.SYSTEM, friendlyMessage);
                    if (job.type === 'viewer' && job.windowId) {
                        updateWindow(job.windowId, { content: { ...job, status: 'error' } });
                    }
                    setVideoGenerationJobs(prev => ({...prev, [jobId]: {...job, status: 'error', operation: null}}));
                }
            });
        }, 10000);

        return () => clearInterval(interval);
    }, [videoGenerationJobs]);
    
    const closeWindow = (id: string) => setWindows(prev => prev.filter(w => w.id !== id));
    
    const minimizeWindow = (id: string) => setWindows(prev => prev.map(w => w.id === id ? { ...w, state: WindowState.MINIMIZED } : w));

    const toggleMaximizeWindow = (id: string) => {
        setWindows(prev => prev.map(w => w.id === id ? { ...w, state: w.state === WindowState.MAXIMIZED ? WindowState.NORMAL : WindowState.MAXIMIZED } : w));
        bringToFront(id);
    };

    const handleTaskbarClick = (id: string) => {
        const windowInstance = windows.find(w => w.id === id);
        if (!windowInstance) return;

        const isTopWindow = windows[windows.length - 1].id === id;
        if (windowInstance.state === WindowState.MINIMIZED) {
            setWindows(prev => prev.map(w => w.id === id ? { ...w, state: WindowState.NORMAL } : w));
            bringToFront(id);
        } else if (isTopWindow) {
            minimizeWindow(id);
        } else {
            bringToFront(id);
        }
    };
    
    const handleEditApp = (appId: string) => {
        const appToEdit = customApps.find(app => app.id === appId);
        if (appToEdit) setEditingApp(appToEdit);
    };

    const handleShowVersions = (appId: string) => {
        const appToShow = customApps.find(app => app.id === appId);
        if (appToShow) setVersionHistoryApp(appToShow);
    };
    
    const handleSaveApp = async (appId: string, newName: string, newIconPrompt: string) => {
        setCustomApps(prev => prev.map(app => app.id === appId ? { ...app, name: newName } : app));
        if (newIconPrompt) {
            addMessage(MessageSender.SYSTEM, `Generating new icon for "${newName}"...`);
            try {
                const iconSvg = await generateIconApi(newIconPrompt);
                setCustomApps(prev => prev.map(app => {
                    if (app.id === appId) {
                        const activeVersion = app.versions.find(v => v.versionId === app.activeVersionId);
                        if (activeVersion) {
                            activeVersion.icon = iconSvg;
                        }
                    }
                    return app;
                }));
                 addMessage(MessageSender.SYSTEM, "Icon updated.");
            } catch (error) {
                const friendlyMessage = getApiErrorMessage(error, `Failed to generate new icon for "${newName}"`);
                addMessage(MessageSender.SYSTEM, friendlyMessage);
            }
        }
    };
    
    const handleRevertAppVersion = (appId: string, versionId: string) => {
        setCustomApps(prev => prev.map(app => app.id === appId ? { ...app, activeVersionId: versionId } : app));
    };
    
    const getActiveVersion = (app: CustomApp): AppVersion | undefined => {
        return app.versions.find(v => v.versionId === app.activeVersionId);
    };

    const handleFileImport = async (files: FileList) => {
        const newVfsFiles: VFSFile[] = Array.from(files).map(file => ({
            id: `vfs-${Date.now()}-${file.name}`,
            name: file.name, type: file.type, url: URL.createObjectURL(file), blob: file
        }));
        try {
            await Promise.all(newVfsFiles.map(file => storage.saveVfsFile(file)));
            setVfsFiles(prev => [...prev, ...newVfsFiles]);
        } catch (error) {
            console.error("Failed to save imported files:", error);
            addMessage(MessageSender.SYSTEM, "Error importing files. They may not persist.");
        }
    };

    const handleDeleteWallpaper = useCallback(async (wallpaperId: string) => {
        const wallpaperToDelete = savedWallpapers.find(wp => wp.id === wallpaperId);
        if (!wallpaperToDelete) return;

        setSavedWallpapers(prev => prev.filter(wp => wp.id !== wallpaperId));
        await handleDeleteFile(wallpaperToDelete.fileId);

        addMessage(MessageSender.SYSTEM, "Wallpaper deleted.");
    }, [savedWallpapers, handleDeleteFile]);

    const handleDownloadWallpaper = useCallback((wallpaper: SavedWallpaper) => {
        const fileToDownload = vfsFiles.find(f => f.id === wallpaper.fileId);
        if (!fileToDownload) {
            addMessage(MessageSender.SYSTEM, "Could not find file to download.");
            return;
        }
        const link = document.createElement('a');
        link.href = fileToDownload.url;
        link.download = fileToDownload.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [vfsFiles]);

    const handleCommandSubmit = useCallback(async (command: string) => {
        if (!command.trim() || isLoading || !chat) return;
        addMessage(MessageSender.USER, command);
        setIsLoading(true);

        try {
            const results: any[] = await processCommand(command, chat);
            await processApiResults(results, false);

        } catch (error) {
            console.error('Error processing command:', error);
            const friendlyMessage = getApiErrorMessage(error);
            addMessage(MessageSender.SYSTEM, friendlyMessage);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, chat, processApiResults]);
    
    if (isAppLoading) {
        return (
            <main className="h-screen w-screen flex items-center justify-center" style={{backgroundColor: '#0f172a'}}>
                <LoadingSpinner />
            </main>
        );
    }
    
    const activeVideoJobs = Object.values(videoGenerationJobs).filter((job: VideoJob) => job.status === 'pending');

    return (
        <main className={`h-screen w-screen overflow-hidden flex flex-col bg-cover bg-center transition-all duration-500 ${cursorSvg ? 'custom-cursor' : ''}`}>
             <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileForPendingAction}
            />
            {backgroundContent.type === 'video' && (
                <video src={backgroundContent.value} autoPlay loop muted className="absolute top-0 left-0 w-full h-full object-cover -z-10" />
            )}
            <div 
                className="absolute top-0 left-0 w-full h-full -z-10 bg-cover bg-center"
                style={{
                    backgroundColor: backgroundContent.type === 'color' ? backgroundContent.value : 'transparent',
                    backgroundImage: backgroundContent.type === 'image' ? `url(${backgroundContent.value})` : 'none',
                }}
            />

            <Desktop 
                messages={messages} windows={windows} customApps={customApps} vfsFiles={vfsFiles}
                closeWindow={closeWindow} bringToFront={bringToFront} 
                minimizeWindow={minimizeWindow} toggleMaximizeWindow={toggleMaximizeWindow}
                onWindowContentChange={handleWindowContentChange}
                onNoteContentChange={handleNoteContentChange}
                onLaunchApp={handleLaunchApp} onEditApp={handleEditApp} onShowVersions={handleShowVersions}
                onLaunchFileManager={() => addWindow(AppType.FILE_MANAGER, "File Manager", { onSetBackground: handleSetBackground, onDeleteFile: handleDeleteFile }, { width: 700, height: 500 })}
                onLaunchWebBrowser={handleLaunchWebBrowser}
                onLaunchAppBuilder={handleLaunchAppBuilder}
                onLaunchWallpaperManager={handleLaunchWallpaperManager}
                onLaunchNotesManager={handleLaunchNotesManager}
                onLaunchImageAnalyzer={handleLaunchImageAnalyzer}
                onLaunchImageEditor={handleLaunchImageEditor}
                onLaunchTranscriber={handleLaunchTranscriber}
                onLaunchAppStore={handleLaunchAppStore}
            />
            <VoiceOrb onCommandSubmit={handleCommandSubmit} isLoading={isLoading} />
            
            {isCommandCenterOpen && (
                <CommandCenter 
                    messages={messages}
                    onCommandSubmit={handleCommandSubmit}
                    isLoading={isLoading}
                />
            )}

            <Taskbar 
                windows={windows}
                onTaskbarItemClick={handleTaskbarClick} 
                isTtsEnabled={isTtsEnabled}
                onToggleTts={() => setIsTtsEnabled(prev => !prev)}
                onFileImport={handleFileImport}
                isCommandCenterOpen={isCommandCenterOpen}
                onToggleCommandCenter={() => setIsCommandCenterOpen(prev => !prev)}
            />
            <div className="absolute bottom-20 right-4 space-y-2">
              {activeVideoJobs.map((job: VideoJob) => job.type === 'background' && <VideoGenerationToast key={job.operation?.name} prompt={job.prompt} /> )}
            </div>

            {editingApp && <EditAppModal app={editingApp} onClose={() => setEditingApp(null)} onSave={handleSaveApp} />}
            {versionHistoryApp && <VersionHistoryModal app={versionHistoryApp} onClose={() => setVersionHistoryApp(null)} onRevert={handleRevertAppVersion} getActiveVersion={getActiveVersion} />}
        </main>
    );
};

export default App;
