import Image from "next/image"

export function TargetAudience() {
  return (
    <section className="w-full px-6 py-20 bg-[#F3EADB]">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center md:text-left space-y-4">
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 tracking-tight">
              Built for
            </h2>
            <h3 className="text-4xl md:text-5xl font-bold text-primary leading-snug">
              Students, Parents <br />
              <span className="text-primary">&amp; Teachers</span>
            </h3>
            <p className="text-gray-700 text-lg md:text-xl max-w-md mx-auto md:mx-0">
              Empowering learners, supporting parents, and enabling teachers with AI-driven tools that inspire success for everyone.
            </p>
          </div>

          {/* Right Image */}
          <div className="flex items-center justify-center">
            <Image
              src="/Frame.png"
              alt="Target audience frame"
              width={500}
              height={400}
              className="w-[70%] h-[70%] object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  )
}
