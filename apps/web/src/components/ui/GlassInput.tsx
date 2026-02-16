import React from "react";

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    icon?: React.ReactNode;
}

export default function GlassInput({
    label,
    icon,
    className = "",
    id,
    ...props
}: GlassInputProps) {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
        <div className="space-y-1.5">
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-sm font-medium text-gray-300 ml-1"
                >
                    {label}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                        {icon}
                    </div>
                )}
                <input
                    id={inputId}
                    className={`
            w-full bg-white/5 
            border border-white/10 
            text-white placeholder-gray-400 
            rounded-lg p-3 
            ${icon ? "pl-11" : ""}
            focus:outline-none focus:ring-2 focus:ring-blue-500/60 focus:border-transparent
            transition-all duration-200
            hover:bg-white/[0.07]
            ${className}
          `}
                    {...props}
                />
            </div>
        </div>
    );
}
