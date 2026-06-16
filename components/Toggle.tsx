'use client'

interface ToggleProps {
  label: string
  description?: string
  value: boolean
  onChange: (value: boolean) => void
}

export function Toggle({ label, description, value, onChange }: ToggleProps) {
  return (
    <div className="flex items-center justify-between py-4">
      <div className="pr-4">
        <p className="text-sm font-medium">{label}</p>
        {description && (
          <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
        )}
      </div>
      <button
        onClick={() => onChange(!value)}
        aria-checked={value}
        role="switch"
        className={`relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200 ${
          value ? 'bg-accent' : 'bg-zinc-200 dark:bg-zinc-700'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            value ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}