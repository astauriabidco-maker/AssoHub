'use client';

import { Users } from 'lucide-react';

export default function UsersPage() {
    return (
        <div className="flex flex-col items-center justify-center h-96">
            <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
                Gestion des Utilisateurs
            </h2>
            <p className="text-gray-400 text-center max-w-md">
                Cette fonctionnalité sera disponible dans une prochaine version.
                Elle permettra de gérer tous les utilisateurs de la plateforme.
            </p>
        </div>
    );
}
