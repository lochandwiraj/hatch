export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-secondary">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-accent-400 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
        <h2 className="text-xl font-semibold text-primary-700 mb-2">Loading Hatch</h2>
        <p className="text-primary-500">Please wait while we prepare your experience...</p>
      </div>
    </div>
  )
}