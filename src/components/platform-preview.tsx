import FrameBg from "@/assets/Frame100000.png"
import Image from "next/image"

export function PlatformPreview() {
  return (
    <section className="w-full px-6 py-20 bg-[#F3EADB] relative overflow-hidden">
      {/* Responsive Background Image Overlay */}
      <div className="absolute inset-0 w-full h-full z-0">
        <Image
          src={FrameBg}
          alt="Background"
          fill
          style={{ objectFit: 'cover' }}
          className="pointer-events-none select-none"
          priority
          sizes="100vw"
        />
      </div>
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">This is our open learning platform</h2>
          <p className="text-xl text-primary font-semibold">Diversity and inclusion.</p>
        </div>

        {/* Platform mockup */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl mx-auto">
          <div className="bg-gray-100 rounded-xl p-6">
            {/* Sidebar mockup */}
            <div className="flex gap-6">
              <div className="w-64 bg-white rounded-lg p-4 shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-sm">📊</span>
                    </div>
                    <span className="text-sm font-medium">Overview</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 text-sm">📚</span>
                    </div>
                    <span className="text-sm font-medium">Courses</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#714B9014] rounded-full flex items-center justify-center">
                      <span className="text-[#714B90] text-sm">✏️</span>
                    </div>
                    <span className="text-sm font-medium">Assignments</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-600 text-sm">📝</span>
                    </div>
                    <span className="text-sm font-medium">Tests</span>
                  </div>
                </div>
              </div>

              {/* Main content mockup */}
              <div className="flex-1 bg-white rounded-lg p-6 shadow-sm">
                <div className="mb-4">
                  <div className="bg-primary text-white px-4 py-2 rounded-lg inline-block text-sm font-medium mb-4">
                    Welcome to your learning dashboard
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="flex gap-4 mt-6">
                    <Image
                      src="/student-learning.png"
                      alt="Learning illustration"
                      width={120}
                      height={80}
                      className="w-30 h-20 rounded-lg object-cover"
                    />
                    <Image
                      src="/education-technology.png"
                      alt="Education tech"
                      width={120}
                      height={80}
                      className="w-30 h-20 rounded-lg object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
