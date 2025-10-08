"use client"
import { useRef, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowRight, Play, Pause, Volume2, VolumeX } from "lucide-react"

export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const router = useRouter()
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [showControls, setShowControls] = useState(true)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.log("Video autoplay prevented:", error)
      })
      setIsPlaying(true)
    }
    const hideTimer = setTimeout(() => setShowControls(false), 2000)
    return () => clearTimeout(hideTimer)
  }, [])

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  return (
    <section className="w-full min-h-[92vh] flex items-center px-6 py-16 bg-gradient-to-b from-[#FFFBF2] to-[#FFF8E7] relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto w-full relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column */}
          <div className="text-center lg:text-left space-y-4">
            <div className="inline-block px-4 py-2 bg-primary/10 rounded-full mb-2">
              <span className="text-primary font-semibold text-sm">🚀 Welcome to the Future</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
              Future of{" "}
              <span className="whitespace-nowrap bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
                AI Learning
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Discover an AI-powered study companion that understands how you learn. From personalised guidance to
              real-time practice and review, Leoqui brings together the best of adaptive tutoring and collaborative
              classrooms so every learner can master new skills with confidence.
            </p>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
              <Button
                onClick={() => router.push('/login?view=signup')}
                className="group bg-primary hover:bg-primary/90 text-white px-8 py-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2"
              >
                Try it out
                <motion.span
                  initial={{ rotate: 0 }}
                  whileHover={{ rotate: -45 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className="inline-block"
                >
                  <ArrowRight className="w-5 h-5 transition-transform duration-300" />
                </motion.span>
              </Button>
            </div>
          </div>

          {/* Right Column - Video */}
          <div className="relative w-full flex justify-center lg:justify-end">
            <div className="relative w-full max-w-2xl">
              <div className="group relative aspect-video rounded-3xl overflow-hidden shadow-2xl ring-1 ring-gray-200 transform hover:scale-105 transition-transform duration-500">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                  poster="/video-poster.jpg"
                >
                  <source src="/output_HD720.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent pointer-events-none"></div>
                
                {/* Video Controls */}
                <div
                  className={
                    `absolute bottom-4 right-4 flex gap-2 transition-opacity duration-300 ` +
                    `${showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'} ` +
                    `group-hover:opacity-100 group-hover:pointer-events-auto`
                  }
                >
                  <Button
                    onClick={togglePlayPause}
                    size="sm"
                    className="bg-black/70 hover:bg-black/80 text-white border-0 rounded-full w-10 h-10 p-0 flex items-center justify-center backdrop-blur-sm"
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 ml-0.5" />
                    )}
                  </Button>
                  <Button
                    onClick={toggleMute}
                    size="sm"
                    className="bg-black/70 hover:bg-black/80 text-white border-0 rounded-full w-10 h-10 p-0 flex items-center justify-center backdrop-blur-sm"
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
