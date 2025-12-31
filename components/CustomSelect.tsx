'use client'

import { useState, useRef, useEffect } from 'react'

interface CustomSelectProps {
  value: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
  className?: string
}

export default function CustomSelect({ 
  value, 
  onChange, 
  options, 
  placeholder = 'Select option',
  className = ''
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleSelect = (option: string) => {
    onChange(option)
    setIsOpen(false)
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-2 text-left bg-white border rounded-lg flex items-center justify-between transition-all duration-200 ${
          isOpen 
            ? 'border-blue-500 ring-2 ring-blue-100' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <span className={`block truncate ${!value ? 'text-gray-500' : 'text-gray-900'}`}>
          {value || placeholder}
        </span>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <svg
            className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-60 rounded-lg py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm animate-in fade-in zoom-in-95 duration-100">
          {options.map((option) => (
            <div
              key={option}
              className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-blue-50 transition-colors ${
                value === option ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-900'
              }`}
              onClick={() => handleSelect(option)}
            >
              <span className="block truncate">
                {option}
              </span>
              {value === option && (
                <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              )}
            </div>
          ))}
          {options.length === 0 && (
            <div className="cursor-default select-none relative py-2 pl-3 pr-9 text-gray-500 italic">
              No options available
            </div>
          )}
        </div>
      )}
    </div>
  )
}
