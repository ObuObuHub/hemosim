'use client';

import { useState, useEffect, useCallback } from 'react';

export function DisclaimerPopup(): React.ReactElement | null {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  const dismiss = useCallback((): void => {
    setIsExiting(true);
    setTimeout(() => setIsVisible(false), 300);
  }, []);

  useEffect(() => {
    const timer = setTimeout(dismiss, 12000);
    return () => clearTimeout(timer);
  }, [dismiss]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 transition-opacity duration-300 ${
        isExiting ? 'opacity-0' : 'opacity-100'
      }`}
      onClick={dismiss}
    >
      {/* Desktop version */}
      <div
        className={`hidden md:block bg-white rounded-xl shadow-2xl max-w-lg mx-4 p-6 transform transition-all duration-300 ${
          isExiting ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="text-3xl mb-3">⚕️</div>
          <h2 className="text-lg font-bold text-slate-800 mb-4">ATENȚIONARE</h2>

          <div className="text-sm text-slate-600 space-y-3 text-left">
            <p>
              <span className="font-semibold text-slate-700">HemoSim</span> este un instrument de{' '}
              <span className="font-semibold text-blue-600">STUDIU</span> și{' '}
              <span className="font-semibold text-blue-600">INTERPRETARE</span>{' '}
              destinat studenților și medicilor.
            </p>

            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li>Oferă diagnostice diferențiale și sugestii de investigații suplimentare</li>
              <li><span className="font-semibold">NU</span> oferă recomandări terapeutice</li>
              <li>Decizia clinică aparține <span className="font-semibold">EXCLUSIV</span> medicului curant</li>
              <li>Corelația clinico-biologică este <span className="font-semibold">OBLIGATORIE</span></li>
            </ul>

            <p className="pt-2 font-bold text-center text-red-700 border-t border-slate-200">
              ACEST INSTRUMENT NU PUNE DIAGNOSTICE<br />
              ȘI NU ÎNLOCUIEȘTE JUDECATA CLINICĂ.
            </p>
          </div>

          <p className="mt-4 text-xs text-slate-400">
            © Dr. Chiper-Leferman Andrei
            <br />
            <span className="text-[10px]">Medic specialist medicină de laborator</span>
          </p>
        </div>
      </div>

      {/* Mobile version */}
      <div
        className={`md:hidden bg-white rounded-lg shadow-2xl mx-3 p-4 transform transition-all duration-300 ${
          isExiting ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="text-xl mb-2">⚕️</div>
          <h2 className="text-xs font-bold text-slate-800 mb-2">ATENȚIONARE</h2>

          <p className="text-[8px] leading-relaxed text-slate-600">
            HemoSim este un instrument de <span className="font-semibold text-blue-600">STUDIU</span> și{' '}
            <span className="font-semibold text-blue-600">INTERPRETARE</span> destinat studenților și medicilor.
            Oferă diagnostice diferențiale și sugestii de investigații suplimentare —{' '}
            <span className="font-semibold">NU</span> recomandări terapeutice.
            Decizia clinică aparține <span className="font-semibold">EXCLUSIV</span> medicului curant.
            Corelația clinico-biologică este <span className="font-semibold">OBLIGATORIE</span>.
          </p>

          <p className="mt-2 text-[8px] font-bold text-red-700 border-t border-slate-200 pt-2">
            ACEST INSTRUMENT NU PUNE DIAGNOSTICE ȘI NU ÎNLOCUIEȘTE JUDECATA CLINICĂ.
          </p>

          <p className="mt-2 text-[7px] text-slate-400">
            © Dr. Chiper-Leferman Andrei
            <br />
            <span className="text-[6px]">Medic specialist medicină de laborator</span>
          </p>
        </div>
      </div>
    </div>
  );
}
