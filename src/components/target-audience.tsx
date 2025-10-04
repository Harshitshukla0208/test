import Image from "next/image"

export function TargetAudience() {
  return (
    <section className="w-full px-6 py-20 bg-[#F3EADB]">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">Built for</h2>
            <h3 className="text-4xl font-bold text-primary mb-8 text-balance">
              Students,
              <br />
              Parents &<br />
              Teachers
            </h3>
          </div>

          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              <Image src="/happy-student-with-graduation-cap.jpg" alt="Student" width={300} height={192} className="w-full h-48 object-cover rounded-2xl" />
              <Image
                src="/placeholder-0bwxa.png"
                alt="Parent and child"
                width={300}
                height={192}
                className="w-full h-48 object-cover rounded-2xl mt-8"
              />
              <Image
                src="/placeholder-c8ip3.png"
                alt="Teacher"
                width={300}
                height={192}
                className="w-full h-48 object-cover rounded-2xl -mt-8"
              />
              <Image
                src="/diverse-group-of-students-studying.jpg"
                alt="Students studying"
                width={300}
                height={192}
                className="w-full h-48 object-cover rounded-2xl"
              />
            </div>

            {/* Decorative curved line */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24">
              <svg viewBox="0 0 100 100" className="w-full h-full text-primary">
                <path d="M20,80 Q50,20 80,80" stroke="currentColor" strokeWidth="3" fill="none" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
