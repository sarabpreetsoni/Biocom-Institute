import React, { useState } from 'react';
import { isFirebaseConfigured, getMissingFirebaseKeys } from '../firebase/config';
import { CheckCircle2, AlertTriangle, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

interface FirebaseStatusBannerProps {
  useDemoMode: boolean;
  onToggleDemoMode: (val: boolean) => void;
}

export const FirebaseStatusBanner: React.FC<FirebaseStatusBannerProps> = ({
  useDemoMode,
  onToggleDemoMode
}) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const missingKeys = getMissingFirebaseKeys();

  const sampleEnvText = `VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-app
VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:...`;

  const copyEnvSnippet = () => {
    navigator.clipboard.writeText(sampleEnvText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 text-slate-200 border-b border-slate-800 text-xs py-2 px-4">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          {isFirebaseConfigured && !useDemoMode ? (
            <span className="flex items-center text-emerald-400 font-medium">
              <CheckCircle2 size={14} className="mr-1" />
              Connected to Live Firebase Backend
            </span>
          ) : (
            <span className="flex items-center text-amber-400 font-medium">
              <AlertTriangle size={14} className="mr-1" />
              {useDemoMode ? 'Running in Local Demo Mode (Mock Backend)' : 'Firebase Credentials Not Configured'}
            </span>
          )}

          <span className="text-slate-500">•</span>
          <span className="text-slate-400">
            {isFirebaseConfigured
              ? 'Real-time Auth, Firestore & Storage Active'
              : 'Add your Firebase API keys to .env to connect live'}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onToggleDemoMode(!useDemoMode)}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
              useDemoMode
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            {useDemoMode ? 'Demo Mode Active' : 'Switch to Demo Mode'}
          </button>

          <button
            onClick={() => setExpanded(!expanded)}
            className="text-slate-400 hover:text-white flex items-center space-x-1 underline"
          >
            <span>Setup Guide</span>
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-800 text-slate-300 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-semibold text-white mb-1.5">How to connect to your real Firebase project:</p>
              <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px]">
                <li>Go to <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="text-blue-400 underline">Firebase Console</a> and create or open your project.</li>
                <li>Enable <strong>Authentication</strong> (Google Provider), <strong>Cloud Firestore</strong>, and <strong>Cloud Storage</strong>.</li>
                <li>In <strong>Project Settings → General</strong>, scroll down to <em>Your apps</em> and register a Web app.</li>
                <li>Copy your config keys into the <code>.env</code> file in this project root.</li>
                <li>Restart the dev server (<code>npm run dev</code>).</li>
              </ol>

              {missingKeys.length > 0 && (
                <div className="mt-2 text-amber-400 text-[11px]">
                  <strong>Missing in current .env:</strong> {missingKeys.join(', ')}
                </div>
              )}
            </div>

            <div className="bg-slate-950 p-2.5 rounded border border-slate-800 font-mono text-[11px] relative">
              <div className="flex justify-between items-center text-slate-400 mb-1">
                <span>Sample .env variables</span>
                <button onClick={copyEnvSnippet} className="hover:text-white flex items-center space-x-1">
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="text-slate-300 overflow-x-auto">{sampleEnvText}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
