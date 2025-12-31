'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface ConfirmModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    isDangerous?: boolean
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDangerous = false
}: ConfirmModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm p-6 overflow-hidden"
                    >
                        <h3 className="text-xl font-bold mb-2 dark:text-white">{title}</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors font-medium dark:text-gray-200"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={() => {
                                    onConfirm()
                                    onClose()
                                }}
                                className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors ${isDangerous
                                        ? 'bg-red-600 hover:bg-red-700'
                                        : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    )
}
