import { AuthForm } from '@/components/auth/AuthForm'
import Image from 'next/image'
import FrameBg from '@/assets/Frame100000.png'
import { Suspense } from 'react'

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#FFFCF6] relative overflow-hidden flex items-center justify-center p-4">
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
      <div className="relative z-10">
        <Suspense fallback={<div>Loading...</div>}>
          <AuthForm />
        </Suspense>
      </div>
    </main>
  )
}
