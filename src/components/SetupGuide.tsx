import React from 'react';
import {
  Key,
  ShieldCheck,
  Terminal,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';

interface SetupGuideProps {
  onGoToScanner: () => void;
}

export const SetupGuide: React.FC<SetupGuideProps> = ({ onGoToScanner }) => {
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const steps = [
    {
      num: 1,
      title: 'Open Google AI Studio',
      desc: 'Navigate to Google AI Studio to create or access your developer project.',
      link: 'https://aistudio.google.com/',
      linkText: 'aistudio.google.com',
    },
    {
      num: 2,
      title: 'Sign In with Google Account',
      desc: 'Use your preferred Google account credentials to authenticate.',
    },
    {
      num: 3,
      title: 'Create / Get a Gemini API Key',
      desc: 'Click on "Get API key" from the navigation drawer, then click "Create API key in new project".',
    },
    {
      num: 4,
      title: 'Copy the API Key',
      desc: 'Keep the key safe in your clipboard. Do not paste it in public forums or Git.',
    },
    {
      num: 5,
      title: 'Create a Local .env File',
      desc: 'In the project root, copy the example environment template (.env is already gitignored):',
      code: 'cp .env.example .env',
      codeId: 'env-copy',
    },
    {
      num: 6,
      title: 'Add GEMINI_API_KEY to .env',
      desc: 'Paste your real Gemini API key into the .env file:',
      code: 'GEMINI_API_KEY="AIzaSy..."',
      codeId: 'env-key',
    },
    {
      num: 7,
      title: 'Configure Multimodal Gemini Model',
      desc: 'Set the active vision-capable model in .env (defaults to gemini-3.8-flash):',
      code: 'GEMINI_MODEL=gemini-3.8-flash',
      codeId: 'env-model',
    },
    {
      num: 8,
      title: 'Start Application Server',
      desc: 'Run the development server with fullstack Express and Vite middleware:',
      code: 'npm run dev',
      codeId: 'run-dev',
    },
    {
      num: 9,
      title: 'Open Food Scan in Browser',
      desc: 'Visit http://localhost:3000 to access the Personalized Nutrition & Meal Planner.',
    },
    {
      num: 10,
      title: 'Upload or Snap Food Image',
      desc: 'Select a JPG, JPEG, PNG, or WEBP photo of a real meal, or use live camera capture.',
    },
    {
      num: 11,
      title: 'Click "Scan Food"',
      desc: 'The backend securely relays the image + prompt to Gemini without exposing any credentials.',
    },
    {
      num: 12,
      title: 'Verify Results & Log Meal',
      desc: 'Check nutritional accuracy, macro breakdowns, confidence score, and log directly into your diary.',
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Google AI Studio Setup Documentation
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Step-by-step instructions to configure your Google Gemini API key securely on the server.
        </p>
      </div>

      {/* Security Banner */}
      <div className="p-6 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-700 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-sm">Server-Side Key Isolation</h3>
            <p className="text-xs text-emerald-800">
              The Gemini API key is <strong>never</strong> exposed in client HTML, CSS, JavaScript, localStorage, cookies, or HTTP response headers. All multimodal requests are signed on the server via <code className="px-1 py-0.5 rounded bg-emerald-100 font-mono text-[11px]">server/gemini.ts</code> (or <code className="px-1 py-0.5 rounded bg-emerald-100 font-mono text-[11px]">utils/gemini.py</code>).
            </p>
          </div>
        </div>
      </div>

      {/* 12-Step Visual Flow */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {steps.map(step => (
          <div
            key={step.num}
            className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                  {step.num}
                </span>
                {step.link && (
                  <a
                    href={step.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    <span>{step.linkText}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <h3 className="font-bold text-slate-900 text-sm">{step.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{step.desc}</p>
            </div>

            {step.code && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs">
                <span className="truncate pr-2">{step.code}</span>
                <button
                  onClick={() => handleCopy(step.code!, step.codeId!)}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  title="Copy command"
                >
                  {copiedKey === step.codeId ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action Footer */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 text-center space-y-3">
        <h3 className="font-bold text-slate-900 text-base">Ready to test food recognition?</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Switch to the Food Scan tab to test with pre-rendered dishes or upload your own meals.
        </p>
        <button
          onClick={onGoToScanner}
          className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all inline-flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Go to Food Scanner</span>
        </button>
      </div>
    </div>
  );
};
