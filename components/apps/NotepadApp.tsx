
import React from 'react';
import { SavedNote } from '../../types';

interface NotepadAppProps {
    content: SavedNote;
    onContentChange: (noteId: string, newContent: string) => void;
}

const NotepadApp: React.FC<NotepadAppProps> = ({ content, onContentChange }) => {
    return (
        <div className="h-full w-full flex flex-col text-cyan-200 bg-transparent font-roboto-mono text-sm">
            <div className="text-xs text-slate-400 px-2 py-1 border-b border-white/10 flex-shrink-0">
                Created: {new Date(content.createdAt).toLocaleString()}
            </div>
            <textarea
                value={content.content}
                onChange={(e) => onContentChange(content.id, e.target.value)}
                className="w-full h-full p-2 bg-transparent border-0 resize-none focus:outline-none flex-grow"
                style={{ color: 'var(--text-color)'}}
            />
        </div>
    );
};

export default NotepadApp;
