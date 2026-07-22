export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="col-span-full py-16 px-4 flex flex-col items-center justify-center text-center bg-white dark:bg-slate-950 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
      <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500 rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100 dark:border-slate-800/50">
        <Icon size={32} />
      </div>
      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-8 leading-relaxed">
        {description}
      </p>
      {action && (
        <div>
          {action}
        </div>
      )}
    </div>
  );
}
