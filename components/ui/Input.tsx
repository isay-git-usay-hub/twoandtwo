import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string
    error?: string
    prefix?: string
    suffix?: string
}

export default function Input({
    className,
    label,
    error,
    prefix,
    suffix,
    ...props
}: InputProps) {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                    {label}
                </label>
            )}
            <div className="relative">
                {prefix && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 dark:text-gray-400">{prefix}</span>
                    </div>
                )}
                <input
                    className={cn(
                        "w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-slate-900 px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none",
                        prefix && "pl-8",
                        suffix && "pr-8",
                        error && "border-red-500 focus:ring-red-500",
                        className
                    )}
                    {...props}
                />
                {suffix && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 dark:text-gray-400">{suffix}</span>
                    </div>
                )}
            </div>
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    )
}
