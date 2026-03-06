import React, { useEffect, useState } from 'react';

const ZynixLogo: React.FC = () => (
    <div className="flex items-center space-x-3 text-white">
        <div className="w-10 h-10 flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 2.66663L3.33325 9.33329V22.6666L16 29.3333L28.6666 22.6666V9.33329L16 2.66663Z" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3.33325 9.33329L16 16L28.6666 9.33329" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 29.3333V16" stroke="white" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        </div>
        <span className="text-3xl font-light tracking-wider" style={{ fontFamily: "'Orbitron', 'Rajdhani', 'Exo 2', sans-serif" }}>ContaRs Pro</span>
    </div>
);

interface LoadingScreenDashboardProps {
  onLoadingComplete: () => void;
}

const LoadingScreenDashboard: React.FC<LoadingScreenDashboardProps> = ({ onLoadingComplete }) => {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Iniciando...');

  useEffect(() => {
    const loadingSteps = [
      { progress: 20, text: 'Cargando configuración...', duration: 300 },
      { progress: 40, text: 'Conectando con el servidor...', duration: 400 },
      { progress: 60, text: 'Cargando datos del usuario...', duration: 300 },
      { progress: 80, text: 'Preparando dashboard...', duration: 400 },
      { progress: 100, text: '¡Listo!', duration: 200 }
    ];

    let currentStep = 0;

    const runStep = () => {
      if (currentStep < loadingSteps.length) {
        const step = loadingSteps[currentStep];
        setProgress(step.progress);
        setLoadingText(step.text);

        setTimeout(() => {
          currentStep++;
          if (currentStep < loadingSteps.length) {
            runStep();
          } else {
            // Pequeño delay antes de completar
            setTimeout(() => {
              onLoadingComplete();
            }, 300);
          }
        }, step.duration);
      }
    };

    runStep();
  }, [onLoadingComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-600 via-purple-700 to-blue-600 flex items-center justify-center animate-fadeIn">
      <div className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath opacity='.5' d='M96 95h4v1h-4v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4h-9v4h-1v-4H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15v-9H0v-1h15V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h9V0h1v15h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9zm-1 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm9-10v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-10 0v-9h-9v9h9zm-9-10h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9zm10 0h9v-9h-9v9z'/%3E%3Cpath d='M6 5V0h1v5h9V0h1v5h9V0h1v5h9V0h1v5h9V0h1v5h9V0h1v5h9V0h1v5h9V0h1v5h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h4v1h-4v9h-1v-9h-9v9h-1v-9h-9v9h-1v-9h-9v9h-1v-9h-9v9h-1v-9h-9v9h-1v-9h-9v9h-1v-9h-9v9H0v-1h5v-9H0v-1h5v-9H0v-1h5v-9H0v-1h5v-9H0v-1h5v-9H0v-1h5V0h1v5h9V0h1v5h9V0h1v5h9V0h1v5h9V0h1v5h9V0h1v5h9V0h1v5h9V0h1v5z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      <div className="relative z-10 text-center animate-scaleIn">
        <div className="mb-12">
          <ZynixLogo />
        </div>

        {/* Spinner animado */}
        <div className="relative mb-8">
          <div className="w-32 h-32 mx-auto">
            <svg className="animate-spin-slow" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="white"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${progress * 2.51}, 251.2`}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
                style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white text-xl font-light tracking-wide" style={{ fontFamily: "'Orbitron', 'Rajdhani', 'Exo 2', sans-serif" }}>{progress}%</span>
            </div>
          </div>
        </div>

        {/* Texto de carga */}
        <div className="text-white">
          <p className="text-lg font-light mb-2 animate-pulse tracking-wide" style={{ fontFamily: "'Orbitron', 'Rajdhani', 'Exo 2', sans-serif" }}>{loadingText}</p>
          <p className="text-sm text-white text-opacity-80 font-light">Por favor espere...</p>
        </div>

        {/* Barra de progreso lineal */}
        <div className="mt-8 w-64 mx-auto bg-white bg-opacity-20 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// Agregar esta animación al CSS global si no existe
const style = document.createElement('style');
style.textContent = `
  @keyframes spin-slow {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  .animate-spin-slow {
    animation: spin-slow 3s linear infinite;
  }
`;
if (!document.querySelector('style[data-loading-screen]')) {
  style.setAttribute('data-loading-screen', 'true');
  document.head.appendChild(style);
}

export default LoadingScreenDashboard;
