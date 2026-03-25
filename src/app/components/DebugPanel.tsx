import { useState, useEffect } from 'react';
import { X, Copy, Trash2, Download, AlertCircle } from 'lucide-react';

interface DebugLog {
  id: string;
  timestamp: string;
  level: 'log' | 'error' | 'warn' | 'info';
  message: string;
  data?: any;
}

export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filterLevel, setFilterLevel] = useState<'all' | 'error' | 'warn'>('all');

  useEffect(() => {
    // Override console methods to capture logs
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    const originalInfo = console.info;

    const addLog = (level: DebugLog['level'], message: string, data?: any) => {
      const timestamp = new Date().toLocaleTimeString();
      const newLog: DebugLog = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp,
        level,
        message: String(message),
        data,
      };
      setLogs((prev) => [...prev, newLog].slice(-100)); // Keep last 100 logs
    };

    console.log = (...args) => {
      originalLog(...args);
      addLog('log', args[0], args.slice(1));
    };

    console.error = (...args) => {
      originalError(...args);
      addLog('error', args[0], args.slice(1));
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addLog('warn', args[0], args.slice(1));
    };

    console.info = (...args) => {
      originalInfo(...args);
      addLog('info', args[0], args.slice(1));
    };

    // Also capture unhandled errors
    const handleError = (event: ErrorEvent) => {
      addLog('error', event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    };

    window.addEventListener('error', handleError);

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
      console.info = originalInfo;
      window.removeEventListener('error', handleError);
    };
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (filterLevel === 'all') return true;
    return log.level === filterLevel;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-500';
      case 'warn':
        return 'text-yellow-500';
      case 'info':
        return 'text-blue-500';
      default:
        return 'text-gray-400';
    }
  };

  const getLevelBg = (level: string) => {
    switch (level) {
      case 'error':
        return 'bg-red-500/20';
      case 'warn':
        return 'bg-yellow-500/20';
      case 'info':
        return 'bg-blue-500/20';
      default:
        return 'bg-gray-500/20';
    }
  };

  const copyToClipboard = () => {
    const text = filteredLogs
      .map((log) => `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    alert('Logs copied to clipboard!');
  };

  const downloadLogs = () => {
    const text = filteredLogs
      .map((log) => {
        let output = `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`;
        if (log.data) {
          output += '\n' + JSON.stringify(log.data, null, 2);
        }
        return output;
      })
      .join('\n\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearLogs = () => {
    if (confirm('Clear all logs?')) {
      setLogs([]);
    }
  };

  const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    const isIPhone = /iPhone/.test(ua);
    const isIPad = /iPad/.test(ua);
    const isAndroid = /Android/.test(ua);
    
    return {
      userAgent: ua,
      platform: navigator.platform,
      isIPhone,
      isIPad,
      isAndroid,
      screenSize: `${window.innerWidth}x${window.innerHeight}`,
      viewport: `${window.visualViewport?.width || 'N/A'}x${window.visualViewport?.height || 'N/A'}`,
      orientation: window.innerWidth > window.innerHeight ? 'Landscape' : 'Portrait',
      pixelRatio: window.devicePixelRatio,
      online: navigator.onLine,
    };
  };

  const deviceInfo = getDeviceInfo();

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-[9998] bg-purple-600 hover:bg-purple-700 text-white rounded-full p-3 shadow-lg transition-all"
        title="Debug Panel"
      >
        <AlertCircle size={20} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 left-0 top-0 z-[9999] bg-black/80 flex items-end sm:items-center sm:justify-end p-2 sm:p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg w-full sm:w-96 h-2/3 sm:h-3/4 max-h-[600px] flex flex-col text-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800">
          <div>
            <h2 className="font-bold text-lg">Debug Panel</h2>
            <p className="text-xs text-gray-400 mt-1">{filteredLogs.length} logs</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-white transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Device Info Tab */}
        <div className="px-4 py-3 border-b border-gray-700 bg-gray-800 text-xs space-y-1">
          <div className="grid grid-cols-2 gap-2">
            <p><span className="text-gray-400">Device:</span> {deviceInfo.isIPhone ? 'iPhone' : deviceInfo.isIPad ? 'iPad' : deviceInfo.isAndroid ? 'Android' : 'Desktop'}</p>
            <p><span className="text-gray-400">Screen:</span> {deviceInfo.screenSize}</p>
            <p><span className="text-gray-400">Orientation:</span> {deviceInfo.orientation}</p>
            <p><span className="text-gray-400">Pixel Ratio:</span> {deviceInfo.pixelRatio}</p>
            <p><span className="text-gray-400">Online:</span> {deviceInfo.online ? '✅' : '❌'}</p>
            <p><span className="text-gray-400">Platform:</span> {deviceInfo.platform}</p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 p-3 border-b border-gray-700 bg-gray-800">
          {['all', 'error', 'warn'].map((level) => (
            <button
              key={level}
              onClick={() => setFilterLevel(level as any)}
              className={`px-3 py-1 rounded text-xs font-medium transition ${
                filterLevel === level
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {level.charAt(0).toUpperCase() + level.slice(1)}
            </button>
          ))}
        </div>

        {/* Logs Container */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-xs">
          {filteredLogs.length === 0 ? (
            <p className="text-gray-500 text-center mt-4">No logs yet</p>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className={`${getLevelBg(log.level)} p-2 rounded border border-gray-700`}>
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <span className={`font-bold ${getLevelColor(log.level)}`}>
                      {log.level.toUpperCase()}
                    </span>
                    <span className="text-gray-400 ml-2">{log.timestamp}</span>
                    <p className="text-gray-100 break-words mt-1">{log.message}</p>
                    {log.data && log.data.length > 0 && (
                      <details className="mt-1">
                        <summary className="cursor-pointer text-gray-400 hover:text-gray-300 text-xs">
                          View data
                        </summary>
                        <pre className="mt-1 text-xs bg-black/40 p-2 rounded overflow-x-auto">
                          {JSON.stringify(log.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div id="debug-logs-end" />
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-2 p-3 border-t border-gray-700 bg-gray-800 flex-wrap">
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-3 py-1 rounded text-xs font-medium transition ${
              autoScroll
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Auto Scroll {autoScroll ? '✓' : ''}
          </button>
          <button
            onClick={copyToClipboard}
            className="px-3 py-1 rounded text-xs font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition flex items-center gap-1"
          >
            <Copy size={14} /> Copy
          </button>
          <button
            onClick={downloadLogs}
            className="px-3 py-1 rounded text-xs font-medium bg-gray-700 text-gray-300 hover:bg-gray-600 transition flex items-center gap-1"
          >
            <Download size={14} /> Download
          </button>
          <button
            onClick={clearLogs}
            className="px-3 py-1 rounded text-xs font-medium bg-red-600/40 text-red-300 hover:bg-red-600/60 transition flex items-center gap-1"
          >
            <Trash2 size={14} /> Clear
          </button>
        </div>
      </div>
    </div>
  );
}
