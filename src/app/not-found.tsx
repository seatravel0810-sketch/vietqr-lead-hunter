import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-slate-900 text-center">
      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 font-black text-2xl">
        404
      </div>
      <h1 className="text-2xl font-bold mb-2">Không tìm thấy trang</h1>
      <p className="text-slate-600 text-sm max-w-sm mb-6">
        Trang bạn đang tìm kiếm không tồn tại hoặc đã được chuyển sang đường dẫn khác.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
      >
        Về trang săn khách
      </Link>
    </div>
  );
}
