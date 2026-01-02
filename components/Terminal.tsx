import React, { useState, useRef } from 'react';
import * as linuxBridge from '../services/linuxBridge';

const Terminal: React.FC = () => {
    const [lines, setLines] = useState<string[]>([]);
    const [input, setInput] = useState('');
    const outputRef = useRef<HTMLDivElement | null>(null);

    const append = (text: string) => setLines(l => [...l, text]);

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim()) return;
        append(`$ ${input}`);
        try {
            const res = await linuxBridge.execCommand(input);
            if (res.stdout) append(res.stdout);
            if (res.stderr) append(`ERR: ${res.stderr}`);
        } catch (err: any) {
            append(`Error: ${err?.message || String(err)}`);
        }
        setInput('');
        // scroll to bottom
        setTimeout(() => outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight, behavior: 'smooth' }), 50);
    };

    return (
        <div className="bg-black text-green-300 font-roboto-mono p-3 rounded-md h-full flex flex-col">
            <div ref={outputRef} className="flex-1 overflow-auto text-sm" style={{ whiteSpace: 'pre-wrap' }}>
                {lines.map((l, i) => <div key={i}>{l}</div>)}
            </div>
            <form onSubmit={handleSubmit} className="mt-2 flex">
                <input className="flex-1 bg-gray-900 text-green-300 p-2 rounded-l border border-gray-700" value={input} onChange={e => setInput(e.target.value)} placeholder="Escribe un comando..." />
                <button className="bg-blue-600 text-white px-4 rounded-r" type="submit">Run</button>
            </form>
        </div>
    );
};

export default Terminal;
