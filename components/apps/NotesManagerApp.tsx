
import React from 'react';
import { SavedNote } from '../../types';
import { ICONS } from '../../constants';

interface NotesManagerAppProps {
    notes: SavedNote[];
    onOpenNote: (note: SavedNote) => void;
    onDeleteNote: (noteId: string) => void;
}

const NotesManagerApp: React.FC<NotesManagerAppProps> = ({ notes, onOpenNote, onDeleteNote }) => {

    const handleDelete = (noteId: string, noteTitle: string) => {
        if (window.confirm(`Are you sure you want to delete the note "${noteTitle}"?`)) {
            onDeleteNote(noteId);
        }
    };
    
    const sortedNotes = [...notes].sort((a, b) => b.createdAt - a.createdAt);

    return (
        <div className="h-full w-full text-cyan-200 p-2 space-y-2 overflow-y-auto">
            {sortedNotes.length === 0 ? (
                <div className="flex items-center justify-center h-full text-slate-400">
                    <p>No notes yet. Try asking: "create a note about..."</p>
                </div>
            ) : (
                sortedNotes.map(note => (
                    <div key={note.id} className="p-3 rounded-md flex items-center justify-between gap-4 transition-colors hover:bg-white/5"
                        style={{ backgroundColor: 'rgba(var(--background-rgb), 0.4)' }}>
                        <div className="flex-grow min-w-0 cursor-pointer" onDoubleClick={() => onOpenNote(note)}>
                            <p className="font-bold truncate" title={note.title}>{note.title}</p>
                            <p className="text-xs mt-1 text-slate-400">
                                Created: {new Date(note.createdAt).toLocaleString()}
                            </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                                onClick={() => onOpenNote(note)}
                                className="px-3 py-1 text-xs rounded bg-slate-600/50 hover:bg-[var(--primary-color)] hover:text-[var(--background-color)] transition-colors"
                                title="Open Note"
                            >
                                Open
                            </button>
                             <button
                                onClick={() => handleDelete(note.id, note.title)}
                                className="p-2 rounded hover:bg-red-500/30 text-slate-300 hover:text-red-400 transition-colors"
                                title="Delete Note"
                            >
                                {ICONS.uninstall}
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default NotesManagerApp;
