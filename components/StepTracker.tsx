
import React from 'react';
import type { Step } from '../types';

interface StepTrackerProps {
  steps: { id: Step; name: string }[];
  currentStep: Step;
}

const StepTracker: React.FC<StepTrackerProps> = ({ steps, currentStep }) => {
  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <nav aria-label="Progress">
      <ol role="list" className="flex items-center justify-center">
        {steps.map((step, stepIdx) => (
          <li key={step.name} className={`relative ${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
            {stepIdx < currentStepIndex ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-indigo-600" />
                </div>
                <span className="relative flex h-8 w-8 items-center justify-center bg-indigo-600 rounded-full">
                   <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              </>
            ) : stepIdx === currentStepIndex ? (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-slate-600" />
                </div>
                <span className="relative flex h-8 w-8 items-center justify-center bg-slate-700 rounded-full border-2 border-indigo-500">
                  <span className="h-2.5 w-2.5 bg-indigo-500 rounded-full" aria-hidden="true" />
                </span>
              </>
            ) : (
              <>
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="h-0.5 w-full bg-slate-600" />
                </div>
                <span className="relative flex h-8 w-8 items-center justify-center bg-slate-700 rounded-full">
                </span>
              </>
            )}
             <span className="absolute top-10 text-center w-24 -left-8 text-xs text-slate-400 hidden sm:block">{step.name}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default StepTracker;
