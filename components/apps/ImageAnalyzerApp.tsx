
import React, { useState, useRef, useEffect, useCallback } from 'react';
import LoadingSpinner from '../LoadingSpinner';
import { ICONS } from '../../constants';

interface ImageAnalyzerAppProps {
    content: {
        file?: File;
        base64?: string;
        prompt?: string;
        analyzeImage: (base64: string, mimeType: string, prompt: string) => Promise<string>;
    };
}

const ImageAnalyzerApp: React.FC<ImageAnalyzerAppProps> = ({ content }) => {
    const [imageFile, setImageFile] = useState<File | null>(content.file || null);
    const [imageBase64, setImageBase64] = useState<string | null>(content.base64 || null);
    const [prompt, setPrompt] = useState(content.prompt || '');
    const [analysis, setAnalysis] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (loadEvent) => {
                setImageFile(file);
                setImageBase64(loadEvent.target?.result as string);
                setAnalysis('');
                setError('');
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleAnalyze = useCallback(async () => {
        if (!imageBase64 || !imageFile || !prompt.trim()) return;
        setIsLoading(true);
        setError('');
        setAnalysis('');
        try {
            const result = await content.analyzeImage(imageBase64, imageFile.type, prompt);
            setAnalysis(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred during analysis.');
        } finally {
            setIsLoading(false);
        }
    }, [imageBase64, imageFile, prompt, content.analyzeImage]);

    useEffect(() => {
        if (content.base64 && content.prompt) {
            handleAnalyze();
        }
    }, [content.base64, content.prompt, handleAnalyze]);

    return (
        <div className="h-full w-full flex text-cyan-200 bg-transparent font-roboto-mono text-sm">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            <div className="w-1/2 h-full p-2 flex flex-col items-center justify-center border-r" style={{borderColor: 'rgba(var(--primary-rgb), 0.2)'}}>
                {imageBase64 ? (
                    <img src={imageBase64} alt="Preview" className="max-w-full max-h-full object-contain rounded-md" />
                ) : (
                    <div className="text-center">
                        <p className="mb-4">Upload an image to analyze</p>
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 rounded-md transition-colors"
                             style={{
                                backgroundColor: 'var(--primary-color)',
                                color: 'var(--background-color)'
                            }}
                        >
                            Select Image
                        </button>
                    </div>
                )}
            </div>
            <div className="w-1/2 h-full p-2 flex flex-col">
                <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ask something about the image..."
                    className="w-full h-24 p-2 bg-black/20 border-0 resize-none focus:outline-none rounded-md mb-2 flex-shrink-0"
                    style={{ color: 'var(--text-color)'}}
                    disabled={!imageBase64 || isLoading}
                />
                <button 
                    onClick={handleAnalyze} 
                    disabled={!imageBase64 || !prompt.trim() || isLoading}
                    className="w-full py-2 rounded-md transition-colors disabled:opacity-50 flex items-center justify-center"
                    style={{ backgroundColor: 'var(--primary-color)', color: 'var(--background-color)'}}
                >
                    {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-current"></div> : 'Analyze Image'}
                </button>
                <div className="flex-grow mt-2 p-2 rounded-md bg-black/20 overflow-y-auto whitespace-pre-wrap">
                    {error && <p className="text-red-400">{error}</p>}
                    {analysis && <p>{analysis}</p>}
                    {!isLoading && !error && !analysis && <p className="text-slate-400">Analysis will appear here.</p>}
                </div>
            </div>
        </div>
    );
};

export default ImageAnalyzerApp;
