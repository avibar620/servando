import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-100 flex items-center justify-center p-4" dir="rtl">
      <div className="text-center max-w-md">
        <div className="text-7xl font-extrabold text-indigo-600 mb-4">404</div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">הדף לא נמצא</h1>
        <p className="text-slate-500 mb-8">
          הדף שחיפשת לא קיים או שהועבר למיקום אחר.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
        >
          חזרה לדף הראשי
        </Link>
      </div>
    </div>
  );
}
