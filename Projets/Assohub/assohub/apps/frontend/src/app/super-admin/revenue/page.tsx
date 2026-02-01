'use client';

import { DollarSign } from 'lucide-react';

export default function RevenuePage() {
    return (
        <div className="flex flex-col items-center justify-center h-96">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                <DollarSign className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
                Suivi des Revenus
            </h2>
            <p className="text-gray-400 text-center max-w-md">
                Cette fonctionnalité sera disponible dans une prochaine version.
                Elle permettra de suivre les revenus par plan (Free, Pro, Enterprise).
            </p>
        </div>
    );
}
