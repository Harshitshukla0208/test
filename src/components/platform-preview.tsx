import FrameBg from "@/assets/Frame100000.png"
import Image from "next/image"

export function PlatformPreview() {
  return (
    <section className="w-full px-6 py-10 bg-[#F3EADB] relative overflow-hidden">
      {/* Background Image */}
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
      
      <div className="max-w-5xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            This is our open learning platform
          </h2>
          <p className="text-xl text-primary font-semibold">
            Diversity and inclusion.
          </p>
        </div>

        {/* Platform Image */}
        <div className="relative flex items-center justify-center rounded-xl overflow-hidden">
          <Image
            src="/Employee Landing (3).png"
            alt="LeoQui Learning Platform"
            width={1100}
            height={600}
            className="w-[90%] h-[90%] object-cover"
            priority
          />
        </div>
      </div>
    </section>
  )
}
