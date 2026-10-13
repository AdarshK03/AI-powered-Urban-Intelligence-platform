export default function Placeholder({ title, text, onBack }) {
  return (
    <section className="flex min-h-[400px] flex-col justify-center rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:min-h-[740px]">
      <h1 className="text-center text-2xl font-bold text-slate-900">{title}</h1>
      <p className="mx-auto mt-3 mb-6 max-w-sm text-center text-sm leading-6 text-slate-500">{text}</p>
      <button
        type="button"
        onClick={onBack}
        className="h-12 w-full rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white transition hover:bg-teal-700 cursor-pointer"
      >
        Back to Login
      </button>
    </section>
  );
}
