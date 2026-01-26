export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <a href="https://prnow.io">
            <h1 className="text-xl font-semibold text-gray-900">PR Now Reports</h1>
          </a>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="mb-6">
            <svg
              className="mx-auto h-16 w-16 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Secure PDF Hosting
          </h2>
          <p className="text-gray-600 max-w-md mx-auto">
            This service hosts secure PDF reports for PR Now clients.
            Access your report using the personalized link provided to you.
          </p>
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 px-6 py-4">
        <p className="text-center text-sm text-gray-500">
          PR Now Reports - Secure PDF Hosting
        </p>
      </footer>
    </div>
  );
}
