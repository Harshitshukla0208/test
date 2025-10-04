"use client"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Image from "next/image"
import LeoquiIcon from "@/assets/create-profile/LeoQuiIconBall.png"
import { isAuthenticated, logout, checkUserProfile } from "@/utils/auth"

export function Header() {
  const router = useRouter()
  const [userState, setUserState] = useState({
    isLoggedIn: false,
    profileExists: false,
    loading: true
  })

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = isAuthenticated()

      if (!authenticated) {
        setUserState({
          isLoggedIn: false,
          profileExists: false,
          loading: false
        })
        return
      }

      // Check if user has profile
      const { exists } = await checkUserProfile()

      setUserState({
        isLoggedIn: true,
        profileExists: exists,
        loading: false
      })
    }

    checkAuth()
  }, [])

  const handleGetStarted = () => {
    router.push("login?view=signup")
  }

  const handleLogout = () => {
    logout()
  }

  const handleDashboard = async () => {
    if (!userState.profileExists) {
      router.push("/profile/create")
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <header className="w-full px-6 py-4 bg-[#FFFBF2]">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-white">
            <Image
              src={LeoquiIcon}
              alt="LeoQui Logo"
              width={32}
              height={32}
              className="w-8 h-8 object-contain"
              priority
            />
          </div>
          <span className="text-xl font-semibold text-[#714B90]">LeoQui</span>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#" className="text-gray-700 hover:text-gray-900 font-medium">
            Products
          </a>
          <a href="#" className="text-gray-700 hover:text-gray-900 font-medium">
            Pricing
          </a>
          <a href="#" className="text-gray-700 hover:text-gray-900 font-medium">
            Solutions
          </a>
          <a href="#" className="text-gray-700 hover:text-gray-900 font-medium">
            About
          </a>
          <a href="#" className="text-gray-700 hover:text-gray-900 font-medium">
            Resources
          </a>
        </nav>

        {/* CTA Buttons */}
        <div className="flex items-center gap-3">
          {userState.loading ? (
            <div className="w-24 h-10 bg-gray-200 animate-pulse rounded-lg"></div>
          ) : !userState.isLoggedIn ? (
            <>
              <Button
                onClick={() => router.push('/login?view=login')}
                className="bg-white border border-primary text-primary hover:bg-primary/10 px-6 py-2 rounded-lg font-medium mr-2"
                variant="outline"
              >
                Sign In
              </Button>
              <Button
                onClick={handleGetStarted}
                className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium"
              >
                Get Started
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={handleDashboard}
                className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium"
              >
                {userState.profileExists ? "Dashboard" : "Create Profile"}
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="bg-white border border-primary text-primary hover:bg-primary/10 px-6 py-2 rounded-lg font-medium mr-2"
              >
                Logout
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
