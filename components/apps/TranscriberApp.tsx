import React, { useState, useEffect, useRef } from 'react';
// Fix: Remove `LiveSession` as it's not an exported member.
// The session type will be inferred from the `ai.live.connect` return type.
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';

// Base64 encoding/decoding functions for audio data
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// Fix: Initialize the GoogleGenAI client outside the component to allow type inference.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const TranscriberApp: React.FC = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState<string>('');
    const [error, setError] = useState<string>('');
    // Fix: Infer the session promise type from the `ai.live.connect` method.
    const sessionPromiseRef = useRef<ReturnType<typeof ai.live.connect> | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

    const stopRecording = () => {
        if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => session.close());
            sessionPromiseRef.current = null;
        }
        if (scriptProcessorRef.current) {
            scriptProcessorRef.current.disconnect();
            scriptProcessorRef.current = null;
        }
        if(mediaStreamSourceRef.current) {
            mediaStreamSourceRef.current.disconnect();
            mediaStreamSourceRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        setIsRecording(false);
    };

    const startRecording = async () => {
        setError('');
        setTranscript('');
        setIsRecording(true);

        try {
            // Fix: Use the `ai` instance defined outside the component.
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            audioContextRef.current = inputAudioContext;

            let currentInputTranscription = '';
            
            const sessionPromise = ai.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        const source = inputAudioContext.createMediaStreamSource(stream);
                        mediaStreamSourceRef.current = source;
                        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                        scriptProcessorRef.current = scriptProcessor;

                        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                            const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                            const pcmBlob = createBlob(inputData);
                            sessionPromise.then((session) => {
                                session.sendRealtimeInput({ media: pcmBlob });
                            });
                        };
                        source.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContext.destination);
                    },
                    onmessage: async (message: LiveServerMessage) => {
                        if (message.serverContent?.inputTranscription) {
                            const text = message.serverContent.inputTranscription.text;
                            currentInputTranscription += text;
                            setTranscript(currentInputTranscription);
                        }
                        if (message.serverContent?.turnComplete) {
                            currentInputTranscription += '\n'; 
                        }
                    },
                    onerror: (e: ErrorEvent) => {
                        console.error('Live session error:', e);
                        setError('An error occurred with the connection.');
                        stopRecording();
                    },
                    onclose: () => {},
                },
                config: {
                    inputAudioTranscription: {},
                },
            });
            sessionPromiseRef.current = sessionPromise;

        } catch (err) {
            console.error('Error starting transcription:', err);
            setError('Could not access microphone. Please grant permission and try again.');
            setIsRecording(false);
        }
    };
    
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopRecording();
        }
    }, []);

    return (
        <div className="h-full w-full flex flex-col p-4 text-cyan-200 bg-transparent font-roboto-mono text-sm">
            <div className="flex-shrink-0 flex items-center justify-center mb-4">
                <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className="px-6 py-3 rounded-full text-base font-bold flex items-center gap-2 transition-all duration-300"
                    style={{
                        backgroundColor: isRecording ? 'rgba(239, 68, 68, 0.8)' : 'rgba(var(--primary-rgb), 0.8)',
                        color: 'var(--background-color)',
                    }}
                >
                    {isRecording && <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span></span>}
                    {isRecording ? 'Stop Recording' : 'Start Recording'}
                </button>
            </div>
            <div className="flex-grow p-4 bg-black/20 rounded-md overflow-y-auto whitespace-pre-wrap">
                {error && <p className="text-red-400">{error}</p>}
                {transcript ? transcript : !isRecording && <p className="text-slate-400">Your transcription will appear here.</p>}
            </div>
        </div>
    );
};

export default TranscriberApp;