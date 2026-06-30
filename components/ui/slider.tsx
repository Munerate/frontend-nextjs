import * as React from "react"
import { cn } from "@/lib/utils"

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  label: string;
  value: string;
  raw: number;
  onChange: (val: number) => void;
}

export function Slider({ className, label, value, raw, onChange, min, max, step, ...props }: SliderProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-white/90">{label}</label>
        <span className="text-sm font-bold text-field-b">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={raw}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-field-b cursor-pointer"
        {...props}
      />
    </div>
  )
}
