import { CATEGORIES } from '../../data/demoIssues';
import CategoryIcon from '../../assets/CategoryIcons';
import { focusRing } from './ui';
 
export default function CategoryGrid({ onSelect }) {
  return (
    <section aria-label="Issue categories" className="grid grid-cols-4 gap-x-2 gap-y-4 px-4 py-2 lg:grid-cols-8">
      {CATEGORIES.map((c) => (
        <button key={c.id} type="button" onClick={() => onSelect(c.id)} className={`group flex cursor-pointer flex-col items-center gap-1.5 rounded-xl p-1 ${focusRing}`}>
          <span className={`flex h-14 w-14 items-center justify-center rounded-full ${c.bg} ${c.fg} transition group-hover:scale-105`}>
            <CategoryIcon id={c.id} className="h-6 w-6" />
          </span>
          <span className="text-center text-[11px] font-medium leading-tight text-slate-700">{c.label}</span>
        </button>
      ))}
    </section>
  );
}