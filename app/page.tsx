export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Hatch
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Modern Event Management & Attendance Tracking Platform
          </p>
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              Getting Started
            </h2>
            <p className="text-gray-600">
              Your Hatch platform is now deployed and ready for development.
              Start building your event management features!
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}