
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface MemoryData {
    time: number;
    usedHeap: number;
}

const formatBytes = (bytes: number): number => {
    if (bytes === 0) return 0;
    return parseFloat((bytes / (1024 * 1024)).toFixed(2));
};

const SystemStatusApp: React.FC = () => {
    const [data, setData] = useState<MemoryData[]>([]);
    const [memoryInfo, setMemoryInfo] = useState({
        used: 0,
        total: 0,
        limit: 0
    });
    const isMemoryApiSupported = 'performance' in window && 'memory' in performance;

    useEffect(() => {
        if (!isMemoryApiSupported) return;

        const interval = setInterval(() => {
            const memory = (performance as any).memory;
            const used = formatBytes(memory.usedJSHeapSize);
            const total = formatBytes(memory.totalJSHeapSize);
            const limit = formatBytes(memory.jsHeapSizeLimit);
            
            setMemoryInfo({ used, total, limit });

            setData(prevData => {
                const newDataPoint: MemoryData = {
                    time: new Date().getTime(),
                    usedHeap: used
                };
                const newDataSet = [...prevData.slice(-29), newDataPoint]; // Keep last 30 data points
                return newDataSet;
            });
        }, 2000);

        return () => clearInterval(interval);
    }, [isMemoryApiSupported]);

    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim();
    const backgroundRgb = getComputedStyle(document.documentElement).getPropertyValue('--background-rgb').trim();
    const primaryRgb = getComputedStyle(document.documentElement).getPropertyValue('--primary-rgb').trim();

    if (!isMemoryApiSupported) {
        return (
            <div className="w-full h-full flex items-center justify-center text-center p-4">
                <p style={{ color: 'var(--text-color)', opacity: 0.7 }}>
                    The Performance Memory API is not supported in this browser. <br/> System status cannot be displayed.
                </p>
            </div>
        );
    }

    return (
        <div className="w-full h-full text-xs font-roboto-mono flex flex-col p-2">
            <div className="grid grid-cols-3 gap-2 text-center mb-2">
                <div className="p-2 rounded" style={{backgroundColor: `rgba(${primaryRgb}, 0.1)`}}>
                    <div className="text-lg font-bold" style={{color: primaryColor}}>{memoryInfo.used.toFixed(2)} <span className="text-xs">MB</span></div>
                    <div className="text-xs opacity-70">Used Heap</div>
                </div>
                 <div className="p-2 rounded" style={{backgroundColor: `rgba(${primaryRgb}, 0.1)`}}>
                    <div className="text-lg font-bold">{memoryInfo.total.toFixed(2)} <span className="text-xs">MB</span></div>
                    <div className="text-xs opacity-70">Total Heap</div>
                </div>
                 <div className="p-2 rounded" style={{backgroundColor: `rgba(${primaryRgb}, 0.1)`}}>
                    <div className="text-lg font-bold">{memoryInfo.limit.toFixed(2)} <span className="text-xs">MB</span></div>
                    <div className="text-xs opacity-70">Heap Limit</div>
                </div>
            </div>
            <div className="flex-grow">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorUsed" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={primaryColor} stopOpacity={0.8}/>
                                <stop offset="95%" stopColor={primaryColor} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={`rgba(${primaryRgb}, 0.2)`} />
                        <XAxis 
                            dataKey="time" 
                            tickFormatter={(unixTime) => new Date(unixTime).toLocaleTimeString()} 
                            tick={{ fill: textColor, fontSize: 10 }} 
                            tickLine={{ stroke: textColor }}
                        />
                        <YAxis 
                            domain={['dataMin - 1', 'dataMax + 1']} 
                            unit=" MB" 
                            tick={{ fill: textColor, fontSize: 10 }} 
                            tickLine={{ stroke: textColor }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: `rgba(${backgroundRgb}, 0.8)`,
                                borderColor: primaryColor,
                                color: textColor,
                            }}
                            labelStyle={{ color: primaryColor }}
                             formatter={(value: number) => [`${value.toFixed(2)} MB`, "Used Heap"]}
                             labelFormatter={(label) => new Date(label).toLocaleString()}
                        />
                        <Area type="monotone" dataKey="usedHeap" stroke={primaryColor} strokeWidth={2} fillOpacity={1} fill="url(#colorUsed)" isAnimationActive={false}/>
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default SystemStatusApp;