
import React, { useState, useRef, useEffect, useCallback } from 'react';
import LoadingSpinner from '../LoadingSpinner';
import { ICONS } from '../../constants';

interface ImageEditorAppProps {
    content: {
        file?: File;
        base64?: string;
        prompt?: string;
        editImage: (base64: string, mimeType: string, prompt: string) => Promise<string>;
    };
}

const ImageEditorApp: React.FC<ImageEditorAppProps> = ({ content }) => {
    const [originalImage, setOriginalImage] = useState<{ file: File, base64: string } | null>(
        content.file && content.base64 ? { file: content.file, base64: content.base64 } : null
    );
    const [editedImage, setEditedImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState(content.prompt || '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                setOriginalImage({ file, base64: loadEvent.target?.result as string });
                setEditedImage(null);
                setError('');
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleEdit = useCallback(async () => {
        if (!originalImage || !prompt.trim()) return;
        setIsLoading(true);
        setError('');
        try {
            const result = await content.editImage(originalImage.base64, originalImage.file.type, prompt);
            setEditedImage(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred during editing.');
        } finally {
            setIsLoading(false);
        }
    }, [originalImage, prompt, content.editImage]);
    
    useEffect(() => {
        if (originalImage && prompt) {
            handleEdit();
        }
    }, [originalImage, prompt, handleEdit]);

    const handleDownload = () => {
        if (!editedImage) return;
        const link = document.createElement('a');
        link.href = editedImage;
        link.download = `edited-${originalImage?.file.name || 'image.png'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="h-full w-full flex flex-col text-cyan-200 bg-transparent font-roboto-mono text-sm p-2 gap-2">
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            <div className="flex-shrink-0 flex gap-2">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your edit, e.g., 'add a retro filter'"
                    className="w-full p-2 bg-black/20 border-0 focus:outline-none rounded-md"
                    style={{ color: 'var(--text-color)', borderColor: 'rgba(var(--primary-rgb), 0.2)'}}
                    disabled={!originalImage || isLoading}
                />
                <button 
                    onClick={handleEdit} 
                    disabled={!originalImage || !prompt.trim() || isLoading}
                    className="px-4 py-2 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center"
                    style={{ backgroundColor: 'var(--primary-color)', color: 'var(--background-color)'}}
                >
                    {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-current"></div> : 'Generate'}
                </button>
            </div>
            
            <div className="flex-grow flex gap-2 min-h-0">
                <div className="w-1/2 h-full flex flex-col items-center justify-center p-2 rounded-md bg-black/20">
                    <h3 className="text-xs text-slate-400 mb-2">Original</h3>
                    {originalImage ? (
                        <img src={originalImage.base64} alt="Original" className="max-w-full max-h-full object-contain rounded-md" />
                    ) : (
                         <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 rounded-md" style={{backgroundColor: `rgba(var(--primary-rgb), 0.2)`}}>Select Image</button>
                    )}
                </div>
                <div className="w-1/2 h-full flex flex-col items-center justify-center p-2 rounded-md bg-black/20">
                    <h3 className="text-xs text-slate-400 mb-2">Edited</h3>
                    {isLoading && <LoadingSpinner />}
                    {error && <p className="text-red-400 text-center text-xs p-4">{error}</p>}
                    {editedImage && !isLoading && (
                        <>
                            <img src={editedImage} alt="Edited" className="max-w-full max-h-[calc(100%-2rem)] object-contain rounded-md" />
                            <button onClick={handleDownload} className="mt-2 text-xs hover:underline">{ICONS.download} Download</button>
                        </>
                    )}
                    {!isLoading && !error && !editedImage && <p className="text-slate-500">Result will appear here</p>}
                </div>
            </div>
        </div>
    );
};

export default ImageEditorApp;
