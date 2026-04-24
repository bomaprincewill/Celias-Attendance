interface Props {
  label: string
  value: string | number
  sub?: string
  color?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'green'
  icon?: React.ReactNode
}

const colorMap = {
  indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  amber:   'bg-amber-50 text-amber-600 border-amber-100',
  rose:    'bg-rose-50 text-rose-600 border-rose-100',
  green:   'bg-green-50 text-green-600 border-green-100',
}

export default function StatCard({ label, value, sub, color = 'green', icon }: Props) {
  return (
    <div className={`rounded-2xl border p-5 ${colorMap[color]}`}>
      {icon && <div className="mb-3 opacity-80">{icon}</div>}
      <p className="text-3xl font-bold tracking-tight">{value}</p>
      <p className="text-sm font-medium mt-1 opacity-80">{label}</p>
      {sub && <p className="text-xs mt-0.5 opacity-60">{sub}</p>}
    </div>
  )
}
