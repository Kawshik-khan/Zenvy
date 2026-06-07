import React from 'react';
import Link from 'next/link';

interface ErrorViewProps {
  error: any;
  title?: string;
  message?: string;
  resetPath?: string;
}

export default function ErrorView({ 
  error, 
  title = "Connection Interrupted", 
  message = "The application could not reach the database. This is usually caused by an incorrect DATABASE_URL in Vercel settings or a firewall blocking the connection.",
  resetPath = "/login"
}: ErrorViewProps) {
  return (
    <div className="app-aurora flex flex-col items-center justify-center min-h-screen p-10 text-center">
      <div className="w-20 h-20 rounded-full bg-error-container flex items-center justify-center mb-6 text-error">
        <span className="material-symbols-outlined text-4xl">database_off</span>
      </div>
      <h1 className="text-3xl font-black text-on-surface mb-4 tracking-tighter uppercase">{title}</h1>
      <p className="text-on-surface-variant max-w-md mb-8">
        {message}
      </p>
      <div className="glass-panel-subtle p-6 rounded-xl text-left w-full max-w-lg overflow-auto">
        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3 italic">Technical Trace</p>
        <pre className="text-[10px] text-on-surface font-mono whitespace-pre-wrap leading-relaxed">
          {String(error)}
        </pre>
      </div>
      <div className="mt-10">
        <Link href={resetPath} className="px-8 py-3 app-primary-button rounded-full font-bold text-sm">
          Return to Gateway
        </Link>
      </div>
    </div>
  );
}
