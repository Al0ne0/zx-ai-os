
import React from 'react';
import { Message, WindowInstance, WindowState, AppType, VFSFile, CustomApp, SavedNote } from '../types';
import Window from './Window';
import FileManagerIcon from './FileManagerIcon';
import DesktopIcon from './DesktopIcon';
import WebBrowserIcon from './WebBrowserIcon';
import Clock from './Clock';
import BatteryStatus from './BatteryStatus';
import AppBuilderIcon from './AppBuilderIcon';
import WallpaperManagerIcon from './WallpaperManagerIcon';
import NotesManagerIcon from './NotesManagerIcon';
import ImageAnalyzerIcon from './ImageAnalyzerIcon';
import ImageEditorIcon from './ImageEditorIcon';
import TranscriberIcon from './TranscriberIcon';
import AppStoreIcon from './AppStoreIcon';

interface DesktopProps {
    messages: Message[];
    windows: WindowInstance[];
    customApps: CustomApp[];
    vfsFiles: VFSFile[];
    closeWindow: (id: string) => void;
    bringToFront: (id: string) => void;
    minimizeWindow: (id: string) => void;
    toggleMaximizeWindow: (id: string) => void;
    onWindowContentChange: (id: string, newContent: any) => void;
    onNoteContentChange: (noteId: string, newContent: string) => void;
    onLaunchApp: (app: CustomApp) => void;
    onEditApp: (appId: string) => void;
    onShowVersions: (appId: string) => void;
    onLaunchFileManager: () => void;
    onLaunchWebBrowser: () => void;
    onLaunchAppBuilder: () => void;
    onLaunchWallpaperManager: () => void;
    onLaunchNotesManager: () => void;
    onLaunchImageAnalyzer: () => void;
    onLaunchImageEditor: () => void;
    onLaunchTranscriber: () => void;
    onLaunchAppStore: () => void;
}

const Desktop: React.FC<DesktopProps> = ({ 
    messages, windows, customApps, vfsFiles,
    closeWindow, bringToFront, minimizeWindow, toggleMaximizeWindow, onWindowContentChange, onNoteContentChange,
    onLaunchApp, onEditApp, onShowVersions,
    onLaunchFileManager, onLaunchWebBrowser, onLaunchAppBuilder, onLaunchWallpaperManager, onLaunchNotesManager,
    onLaunchImageAnalyzer, onLaunchImageEditor, onLaunchTranscriber, onLaunchAppStore
}) => {
    return (
        <div className="flex-grow p-4 overflow-hidden relative">
            {/* Desktop Icons */}
            <div className="absolute top-4 left-4 flex flex-col items-center gap-4">
                <AppStoreIcon onLaunch={onLaunchAppStore} />
                <FileManagerIcon onLaunch={onLaunchFileManager} />
                <WebBrowserIcon onLaunch={onLaunchWebBrowser} />
                <AppBuilderIcon onLaunch={onLaunchAppBuilder} />
                <WallpaperManagerIcon onLaunch={onLaunchWallpaperManager} />
                <NotesManagerIcon onLaunch={onLaunchNotesManager} />
                <ImageAnalyzerIcon onLaunch={onLaunchImageAnalyzer} />
                <ImageEditorIcon onLaunch={onLaunchImageEditor} />
                <TranscriberIcon onLaunch={onLaunchTranscriber} />
                {customApps.map(app => (
                    <DesktopIcon
                        key={app.id}
                        app={app}
                        onLaunch={onLaunchApp}
                        onEdit={onEditApp}
                        onShowVersions={onShowVersions}
                    />
                ))}
            </div>

             {/* System Info */}
            <div className="absolute top-4 right-4 flex flex-col items-end gap-2 text-right text-white text-sm" style={{textShadow: '0 1px 3px rgba(0,0,0,0.5)'}}>
                <Clock />
                <BatteryStatus />
            </div>

            {/* App Windows */}
            {windows
                .filter(win => win.state !== WindowState.MINIMIZED)
                .map((win) => (
                    <Window
                        key={win.id}
                        instance={win}
                        onClose={closeWindow}
                        onFocus={bringToFront}
                        onMinimize={minimizeWindow}
                        onToggleMaximize={toggleMaximizeWindow}
                        onContentChange={onWindowContentChange}
                        onNoteContentChange={onNoteContentChange}
                        isDraggable={win.isDraggable}
                        isMaximizable={win.isMaximizable}
                        messages={messages}
                        vfsFiles={vfsFiles}
                    />
            ))}
        </div>
    );
};

export default Desktop;
