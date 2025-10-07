"use client"
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { withProtectedRoute } from "@/components/ProtectedRoute"
import { Room } from "livekit-client"
import {
    RoomAudioRenderer,
    RoomContext,
    StartAudio,
    useRoomContext,
    useChat,
    VideoTrack,
    useLocalParticipant,
} from "@livekit/components-react"
import { Track } from "livekit-client"
import { useAgentControlBar } from "@/components/livekit/agent-control-bar/hooks/use-agent-control-bar"
import useConnectionDetails from "@/hooks/useConnectionDetails"
import useChatAndTranscription from "@/hooks/useChatAndTranscription"
import {
    ChevronDown,
    Menu,
    X,
    Send,
    Mic,
    MicOff,
    Video,
    VideoOff,
    MonitorUp,
    PhoneOff,
    FileText,
    BookOpen,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import Logo from "@/assets/create-profile/LeoQuiIconBall.png"
import LeoCoin from "@/assets/Coin.png"
import ComputerImg from "@/assets/ComputerImg.svg"
import EnglishImg from "@/assets/EnglishImg.svg"
import HindiImg from "@/assets/HindiImg.svg"
import MathsImg from "@/assets/MathsImg.svg"
import ScienceImg from "@/assets/ScienceImg.svg"
import FrameBg from "@/assets/Frame100000.png"
import AskQuestionsImg from "@/assets/AskQuestionsImg.svg"
import HomeWorkImg from "@/assets/HomeWorkImg.svg"
import StudyNotesImg from "@/assets/StudyNotesImg.svg"
import PracticeQuestionsImg from "@/assets/PracticeQuestionsImg.svg"
import ReactMarkdown from "react-markdown"
import { AudioNoteSummarizerLoader } from "@/components/loader"
import type { AppConfig } from "@/hooks/useConnectionDetails"

// Types
type Profile = {
    profile_id: string
    last_name: string
    student_name?: string
    grade: string
    gender?: string
    days_streak?: number
    user_id: string
    first_name: string
    user_type: string
    board: string
    date_of_birth?: string
    phone_no?: string
    email?: string
    remaining_creds: number
    profile_completed: boolean
}

const studyOptions = [
    {
        img: AskQuestionsImg,
        title: "Ask Questions",
        description: "Provides comprehensive solutions to all your doubts",
    },
    {
        img: HomeWorkImg,
        title: "Homework Help",
        description: "Provides comprehensive solutions to all your doubts",
    },
    {
        img: StudyNotesImg,
        title: "Study Notes",
        description: "Provides comprehensive solutions to all your doubts",
    },
    {
        img: PracticeQuestionsImg,
        title: "Practice Questions",
        description: "Provides comprehensive solutions to all your doubts",
    },
    {
        img: HomeWorkImg,
        title: "This or that",
        description: "Provides comprehensive solutions to all your doubts",
    },
    {
        img: HomeWorkImg,
        title: "Flash Cards",
        description: "Provides comprehensive solutions to all your doubts",
    },
]

// Helper to get subject image
const getSubjectImage = (rawName: string) => {
    const name = (rawName || "").toLowerCase()
    if (/(math|mathematics|arith)/.test(name)) return MathsImg
    if (/computer|informatics|it|ict/.test(name)) return ComputerImg
    if (/hindi/.test(name)) return HindiImg
    if (/english|language arts/.test(name)) return EnglishImg
    if (/science|sci/.test(name)) return ScienceImg
    return EnglishImg
}

// Helper to convert text content into bullet points
const formatAsBulletPoints = (text: string) => {
    if (!text) return []
    
    // Split by common separators and clean up
    const points = text
        .split(/[•\n\r]+/)
        .map(point => point.trim())
        .filter(point => point.length > 0)
        .map(point => point.replace(/^\d+\.\s*/, '')) // Remove numbered lists
    
    return points
}

const Classroom = () => {
    const [profile, setProfile] = useState<Profile | null>(null)
    const [subjects, setSubjects] = useState<string[]>([])
    const [subjectsLoading, setSubjectsLoading] = useState(false)
    const [subjectsError, setSubjectsError] = useState<string | null>(null)
    const [selectedSubject, setSelectedSubject] = useState<string>("")
    const [chapters, setChapters] = useState<{ number: string; title: string }[]>([])
    const [chaptersLoading, setChaptersLoading] = useState(false)
    const [chaptersError, setChaptersError] = useState<string | null>(null)
    const [selectedChapter, setSelectedChapter] = useState<{ number: string; title: string } | null>(null)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [callOpen, setCallOpen] = useState(false)
    const room = useMemo(() => new Room(), [])
    const [connecting, setConnecting] = useState(false)
    const appConfig = {
        board: profile?.board || "CBSE",
        grade: profile?.grade || "",
        subject: selectedSubject || "",
        chapter: selectedChapter?.number || "", // pass chapter number only
        participantIdentity: profile?.profile_id || "string",
        thread: "string",
    }
    const { fetchConnectionDetailsWithConfig } = useConnectionDetails(appConfig)
    const [loading, setLoading] = useState(true)
    const [sidebarWidth, setSidebarWidth] = useState(288)
    const sidebarRef = useRef(null)
    const isDragging = useRef(false)
    const [firstMessageArrived, setFirstMessageArrived] = useState(false)

    // Remove static activityHistory and add state for threads
    const [threads, setThreads] = useState<ThreadObject[]>([])
    const [threadsLoading, setThreadsLoading] = useState(false)
    const [threadsError, setThreadsError] = useState<string | null>(null)

    const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
    const [threadHistory, setThreadHistory] = useState<ThreadMessage[]>([])
    const [loadingThread, setLoadingThread] = useState(false)
    const [showContinueButton, setShowContinueButton] = useState(false)

    // Lesson Plan States
    const [showLessonPlanModal, setShowLessonPlanModal] = useState(false)
    const [lessonPlanFormData, setLessonPlanFormData] = useState({
        numberOfLectures: 1,
        durationOfLecture: 20,
    })
    const [lessonPlanData, setLessonPlanData] = useState<
        { generated_output?: Record<string, unknown>[] } | Record<string, unknown>[] | null
    >(null)
    const [lessonPlanLoading, setLessonPlanLoading] = useState(false)
    const [viewingLessonPlan, setViewingLessonPlan] = useState(false)

    // Assessment States
    const [assessmentData, setAssessmentData] = useState<AssessmentData | null>(null)
    const [assessmentLoading, setAssessmentLoading] = useState(false)
    const [viewingAssessment, setViewingAssessment] = useState(false)
    const [userAnswers, setUserAnswers] = useState<Record<string, string>>({})
    const [submittingAssessment, setSubmittingAssessment] = useState(false)
    const [assessmentResult, setAssessmentResult] = useState<AssessmentResult | null>(null)
    const [viewingAssessmentResult, setViewingAssessmentResult] = useState(false)
    const [historicalAssessmentData, setHistoricalAssessmentData] = useState<AssessmentData | null>(null)
    const [viewingHistoricalAssessment, setViewingHistoricalAssessment] = useState(false)
    const [isViewingHistoricalResult, setIsViewingHistoricalResult] = useState(false)

    const resetAllViews = () => {
        // Reset lesson plan states
        setViewingLessonPlan(false)
        setLessonPlanData(null)
        setShowLessonPlanModal(false)
        
        // Reset assessment states
        setViewingAssessment(false)
        setViewingAssessmentResult(false)
        setViewingHistoricalAssessment(false)
        setAssessmentData(null)
        setAssessmentResult(null)
        setHistoricalAssessmentData(null)
        setUserAnswers({})
        setIsViewingHistoricalResult(false)
        
        // Reset call states
        setCallOpen(false)
        setSelectedThreadId(null)
        setThreadHistory([])
        setShowContinueButton(false)
    }

    const searchParams = useSearchParams()

    // Fetch profile
    useEffect(() => {
        const userData = searchParams?.get("userData")
        async function fetchProfile() {
            try {
                const res = await fetch("/api/get-user-profile")
                if (!res.ok) throw new Error("Failed to fetch profile")
                const data = await res.json()
                if (data?.data?.profile) {
                    setProfile(data.data.profile)
                } else {
                    // setError('Profile not found.'); // Removed
                }
            } catch {
                // setError('Error loading profile.'); // Removed
            } finally {
                setLoading(false)
            }
        }
        if (userData) {
            try {
                const parsedProfile = JSON.parse(decodeURIComponent(userData))
                setProfile(parsedProfile)
                setLoading(false)
            } catch {
                // setError('Error parsing user data.'); // Removed
                setLoading(false)
            }
        } else {
            fetchProfile()
        }
    }, [searchParams])

    // Fetch subjects when profile is loaded
    useEffect(() => {
        if (!profile) return
        setSubjectsLoading(true)
        setSubjectsError(null)
        setSubjects([])
        setSelectedSubject("")
        fetch(`/api/dropdown-values?board=${encodeURIComponent(profile.board)}&grade=${encodeURIComponent(profile.grade)}`)
            .then((res) => res.json())
            .then((data) => {
                const list = data?.data?.data || data?.data || []
                if (Array.isArray(list) && list.length > 0) {
                    setSubjects(list)
                    const urlSubjectRaw = searchParams?.get("subject") || ""
                    if (urlSubjectRaw) {
                        const target = decodeURIComponent(urlSubjectRaw).trim().toLowerCase()
                        const exactMatch = list.find((s: string) => (s || "").trim().toLowerCase() === target)
                        const partialMatch = exactMatch || list.find((s: string) => (s || "").trim().toLowerCase().includes(target))
                        setSelectedSubject(partialMatch || list[0])
                    } else {
                        setSelectedSubject(list[0])
                    }
                } else {
                    setSubjectsError("No subjects found.")
                }
            })
            .catch(() => setSubjectsError("Failed to load subjects."))
            .finally(() => setSubjectsLoading(false))
    }, [profile, searchParams])

    // Fetch chapters when subject changes
    useEffect(() => {
        if (!profile || !selectedSubject) {
            setChapters([])
            return
        }
        setChaptersLoading(true)
        setChaptersError(null)
        setChapters([])
        setSelectedChapter(null)
        fetch(
            `/api/dropdown-values?board=${encodeURIComponent(profile.board)}&grade=${encodeURIComponent(profile.grade)}&subject=${encodeURIComponent(selectedSubject)}`,
        )
            .then((res) => res.json())
            .then((data) => {
                const list = data?.data?.data || data?.data || []
                if (Array.isArray(list) && list.length > 0) {
                    const parsedChapters = list.map((chapter: [string, string]) => ({
                        number: chapter[0],
                        title: chapter[1],
                    }))
                    setChapters(parsedChapters)
                    setSelectedChapter(parsedChapters[0])
                } else {
                    setChaptersError("No chapters found.")
                }
            })
            .catch(() => setChaptersError("Failed to load chapters."))
            .finally(() => setChaptersLoading(false))
    }, [profile, selectedSubject])

    const fetchThreadsData = useCallback(async () => {
        if (!profile || !selectedSubject || !selectedChapter) {
            setThreads([])
            return
        }

        setThreadsLoading(true)
        setThreadsError(null)

        try {
            const res = await fetch(
                `/api/livekit/get-all-threads?board=${encodeURIComponent(profile.board)}&subject=${encodeURIComponent(selectedSubject)}&grade=${encodeURIComponent(profile.grade)}&chapter=${encodeURIComponent(selectedChapter.number)}`,
            )
            const data = await res.json()

            if (data?.status && Array.isArray(data.data)) {
                setThreads(data.data)
            } else {
                setThreadsError("No history found.")
            }
        } catch (error) {
            console.error("Error fetching threads:", error)
            setThreadsError("Failed to load history.")
        } finally {
            setThreadsLoading(false)
        }
    }, [profile, selectedSubject, selectedChapter])

    // Fetch threads when profile and selectedSubject are available
    useEffect(() => {
        fetchThreadsData()
    }, [fetchThreadsData])

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (!isDragging.current) return
            const min = 180,
                max = 400
            setSidebarWidth(
                Math.min(
                    max,
                    Math.max(min, e.clientX - (sidebarRef.current as unknown as HTMLElement)?.getBoundingClientRect().left),
                ),
            )
        }

        const handleMouseUp = () => {
            isDragging.current = false
        }
        window.addEventListener("mousemove", onMouseMove)
        window.addEventListener("mouseup", handleMouseUp)
        return () => {
            window.removeEventListener("mousemove", onMouseMove)
            window.removeEventListener("mouseup", handleMouseUp)
        }
    }, [])

    const fetchThreadById = async (threadId: string, threadType = 'tutor') => {
        setLoadingThread(true)
        try {
            const res = await fetch(
                `/api/livekit/get-thread-by-id?threadId=${threadId}&thread_type=${encodeURIComponent(threadType)}`
            )
            const data = await res.json()
            if (data.status && data.data) {
                if (threadType === 'assessment') {
                    // Handle assessment result view
                    setAssessmentResult({
                        grade: data.data.grade,
                        score_summary: data.data.score_summary,
                        teacher_feedback: data.data.teacher_feedback,
                        next_step: data.data.next_step || '',
                    })
                    // Set historical assessment data for viewing questions and answers
                    setHistoricalAssessmentData(data.data.exam_data)
                    setIsViewingHistoricalResult(true) // Mark as historical assessment
                    setViewingAssessmentResult(true)
                    setViewingAssessment(false)
                    setViewingLessonPlan(false)
                    setViewingHistoricalAssessment(false)
                    setCallOpen(false)
                } else if (threadType === 'tutor') {
                    setSelectedThreadId(threadId)
                    setThreadHistory(data.data.thread_data || [])
                    setShowContinueButton(true)
                    setCallOpen(true)
                }
            }
        } catch (error) {
            console.error('Error fetching thread:', error)
        } finally {
            setLoadingThread(false)
        }
    }

    const refreshHistory = async () => {
        await fetchThreadsData()
    }

    const fetchLessonPlanById = async (planId: string) => {
        try {
            const res = await fetch(`/api/livekit/get-thread-by-id?threadId=${planId}&thread_type=lesson_plan`)
            const data = await res.json()
            if (data.status && data.data) {
                setLessonPlanData(data.data)
                setViewingLessonPlan(true)
                setCallOpen(false)
            }
        } catch {
            console.error("Error fetching lesson plan")
        }
    }

    const generateLessonPlan = async () => {
        if (!profile || !selectedSubject || !selectedChapter) {
            alert("Please select a subject and chapter first.")
            return
        }

        setLessonPlanLoading(true)
        try {
            const res = await fetch("/api/lesson-plan/generate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    Board: profile.board,
                    Grade: profile.grade,
                    Subject: selectedSubject,
                    Chapter_Number: selectedChapter.number,
                    Number_of_Lecture: lessonPlanFormData.numberOfLectures,
                    Duration_of_Lecture: lessonPlanFormData.durationOfLecture,
                    Class_Strength: 40,
                    Language: "English",
                    Quiz: true,
                    Assignment: true,
                }),
            })

            const data = await res.json()
            if (data.status && data.data) {
                setLessonPlanData({ generated_output: data.data })
                setShowLessonPlanModal(false)
                setViewingLessonPlan(true)
                setCallOpen(false)
                // Reset assessment states to ensure mutual exclusivity
                setViewingAssessment(false)
                setViewingAssessmentResult(false)
                setAssessmentData(null)
                setUserAnswers({})
                setAssessmentResult(null)
                // Refresh history list with the new lesson plan entry
                fetchThreadsData()
            } else {
                alert("Failed to generate lesson plan. Please try again.")
            }
        } catch (error) {
            console.error("Error generating lesson plan:", error)
            alert("Error generating lesson plan. Please try again.")
        } finally {
            setLessonPlanLoading(false)
        }
    }

    const generateAssessment = async () => {
        if (!profile || !selectedSubject || !selectedChapter) {
            alert('Please select a subject and chapter first.')
            return
        }

        setAssessmentLoading(true)
        try {
            const res = await fetch('/api/assessment/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    board: profile.board,
                    grade: profile.grade,
                    subject: selectedSubject,
                    chapter: selectedChapter.number,
                    test_duration: 10,
                    difficulty: 'easy',
                    total_marks: 7,
                }),
            })

            const data = await res.json()
            if (data.status && data.data) {
                setAssessmentData(data.data)
                setUserAnswers({})
                setViewingAssessment(true)
                setViewingAssessmentResult(false)
                setCallOpen(false)
                // Reset lesson plan states to ensure mutual exclusivity
                setViewingLessonPlan(false)
                setLessonPlanData(null)
                setShowLessonPlanModal(false)
            } else {
                alert('Failed to generate assessment. Please try again.')
            }
        } catch (error) {
            console.error('Error generating assessment:', error)
            alert('Error generating assessment. Please try again.')
        } finally {
            setAssessmentLoading(false)
        }
    }

    const submitAssessment = async () => {
        if (!assessmentData || !profile || !selectedSubject || !selectedChapter) {
            return
        }

        setSubmittingAssessment(true)
        try {
            // Helper function to extract question number and text
            const extractQuestionData = (questions: Array<Array<Record<string, string>>>) => {
                if (!questions || questions.length === 0 || questions[0].length === 0) return []

                return questions[0].map((q) => {
                    const qNum = Object.keys(q)[0]
                    const qText = q[qNum]
                    return {
                        [qNum]: qText,
                        [`answer-${qNum}`]: userAnswers[qNum] || '',
                    }
                })
            }

            // Build exam_data structure exactly as shown in the curl example
            const examData = {
                General_Instructions: assessmentData.General_Instructions,
                MCQs: assessmentData.MCQs.length > 0 && assessmentData.MCQs[0].length > 0
                    ? [extractQuestionData(assessmentData.MCQs)]
                    : [],
                True_False_Questions: assessmentData.True_False_Questions.length > 0 && assessmentData.True_False_Questions[0].length > 0
                    ? [extractQuestionData(assessmentData.True_False_Questions)]
                    : [],
                Fill_in_the_Blanks: assessmentData.Fill_in_the_Blanks.length > 0 && assessmentData.Fill_in_the_Blanks[0].length > 0
                    ? [extractQuestionData(assessmentData.Fill_in_the_Blanks)]
                    : [],
                Very_Short_Answers: assessmentData.Very_Short_Answers.length > 0 && assessmentData.Very_Short_Answers[0].length > 0
                    ? [extractQuestionData(assessmentData.Very_Short_Answers)]
                    : [],
                Short_Answers: assessmentData.Short_Answers.length > 0 && assessmentData.Short_Answers[0].length > 0
                    ? [extractQuestionData(assessmentData.Short_Answers)]
                    : [],
                Long_Answers: assessmentData.Long_Answers.length > 0 && assessmentData.Long_Answers[0].length > 0
                    ? [extractQuestionData(assessmentData.Long_Answers)]
                    : [],
                Very_Long_Answers: assessmentData.Very_Long_Answers.length > 0 && assessmentData.Very_Long_Answers[0].length > 0
                    ? [extractQuestionData(assessmentData.Very_Long_Answers)]
                    : [],
                Case_Studies: assessmentData.Case_Studies.length > 0 && assessmentData.Case_Studies[0].length > 0
                    ? [extractQuestionData(assessmentData.Case_Studies)]
                    : [],
                Answers: assessmentData.Answers,
            }

            const res = await fetch('/api/assessment/evaluate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    board: profile.board,
                    grade: profile.grade,
                    subject: selectedSubject,
                    chapter: selectedChapter.number,
                    exam_data: examData,
                }),
            })

            const data = await res.json()

            if (data.status && data.data) {
                setAssessmentResult(data.data)
                setViewingAssessmentResult(true)
                setViewingAssessment(false)
                // Refresh history to show new assessment
                fetchThreadsData()
            } else {
                console.error('Evaluation failed:', data)
                alert('Failed to evaluate assessment. Please try again.')
            }
        } catch (error) {
            console.error('Error submitting assessment:', error)
            alert('Error submitting assessment. Please try again.')
        } finally {
            setSubmittingAssessment(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FFFBF2]">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-[#714B90] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading classroom...</p>
                </div>
            </div>
        )
    }

    if (!profile) {
        return null
    }

    const userInitials = `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase() || "U"
    // Compute main container classes so we can expand the lesson plan view
    const mainContainerClass = `${callOpen ? 'max-w-3xl' : viewingLessonPlan || viewingAssessment || viewingAssessmentResult || viewingHistoricalAssessment ? 'max-w-5xl' : 'max-w-xl'} w-full mx-auto relative z-10 ${callOpen ? '' : viewingLessonPlan || viewingAssessment || viewingAssessmentResult || viewingHistoricalAssessment ? '' : 'bg-[#F5F6FA] rounded-2xl shadow-lg p-6'} ${viewingLessonPlan || viewingAssessment || viewingAssessmentResult || viewingHistoricalAssessment ? 'px-4 md:px-6 py-3' : 'px-3 md:px-4'}`

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-xs w-full">
                <div className="flex items-center justify-between mx-auto">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard">
                            <div className="flex items-center gap-1">
                                <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-white">
                                    <Image
                                        src={Logo || "/placeholder.svg"}
                                        alt="LeoQui Logo"
                                        width={32}
                                        height={32}
                                        className="w-8 h-8 object-contain"
                                        priority
                                    />
                                </div>
                                <span className="text-lg sm:text-xl font-semibold text-[#714B90]">LeoQui</span>
                            </div>
                        </Link>
                        <div className="hidden sm:flex items-center text-sm text-gray-600">
                            <span>{profile.board}</span>
                            <span className="mx-2">›</span>
                            <span>Class {profile.grade}th</span>
                        </div>
                    </div>
                    <div className="hidden sm:flex items-center space-x-4">
                        <span className="text-gray-600">Contact us</span>
                        <div className="flex items-center space-x-1 bg-[#714B9014] px-2 py-1 rounded-xl">
                            <Image
                                src={LeoCoin || "/placeholder.svg"}
                                alt="LeoCoin"
                                width={20}
                                height={20}
                                className="w-5 h-5 object-contain"
                                priority
                            />
                            <span className="font-semibold text-black">{profile.remaining_creds}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-[#714B90] rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-medium">{userInitials}</span>
                            </div>
                            <span className="text-gray-900">Accounts</span>
                            <ChevronDown className="w-4 h-4 text-gray-600" />
                        </div>
                    </div>
                    <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="sm:hidden p-2">
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
                {mobileMenuOpen && (
                    <div className="sm:hidden border-t border-gray-200 mt-2 pt-2 px-4 pb-3">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                                <div className="w-8 h-8 bg-[#714B90] rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm font-medium">{userInitials}</span>
                                </div>
                                <span className="text-gray-900">Accounts</span>
                            </div>
                            <div className="flex items-center space-x-1 bg-[#714B9014] px-2 py-1 rounded-xl">
                                <Image
                                    src={LeoCoin || "/placeholder.svg"}
                                    alt="LeoCoin"
                                    width={20}
                                    height={20}
                                    className="w-5 h-5 object-contain"
                                    priority
                                />
                                <span className="font-semibold text-black">{profile.remaining_creds}</span>
                            </div>
                        </div>
                        <div className="text-sm text-gray-600">
                            <span>
                                {profile.board} › Class {profile.grade}th
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Content Row */}
            <div className="flex flex-1">
                {/* Subjects Sidebar */}
                <aside className="w-60 bg-gradient-to-b from-[#f5f3ff] to-[#f8fbfc] border-r border-gray-200 flex flex-col py-6 px-4 gap-4">
                    <div className="px-2">
                        <h2 className="text-xs font-semibold uppercase tracking-wide text-[#714B90]/80">Subjects</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-1">
                        {subjectsLoading ? (
                            <div className="text-gray-500 text-xs px-2">Loading...</div>
                        ) : subjectsError ? (
                            <div className="text-[#714B90] text-xs px-2">{subjectsError}</div>
                        ) : (
                            <div className="space-y-2">
                                {subjects.map((subject) => {
                                    const isSelected = subject === selectedSubject
                                    return (
                                        <button
                                            key={subject}
                                            onClick={() => {
                                                setSelectedSubject(subject)
                                                resetAllViews()
                                            }}
                                            className={`w-full flex items-center gap-3 rounded-2xl px-3 py-2 transition-all duration-200 ${isSelected
                                                ? "bg-white shadow-[0_6px_18px_rgba(113,75,144,0.12)]"
                                                : "bg-transparent hover:bg-white/70"
                                                }`}
                                        >
                                            <div
                                                className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-colors ${isSelected ? "border-[#714B90] bg-white" : "border-transparent bg-white/60"
                                                    }`}
                                            >
                                                <Image
                                                    src={getSubjectImage(subject) || "/placeholder.svg"}
                                                    alt={subject}
                                                    width={40}
                                                    height={40}
                                                    className="w-10 h-10 object-contain"
                                                />
                                            </div>
                                            <span
                                                className={`flex-1 text-left text-sm font-medium leading-snug ${isSelected ? "text-[#3d2758]" : "text-[#4b4b63]"}`}
                                            >
                                                {subject}
                                            </span>
                                        </button>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </aside>

                {/* Chapters Sidebar */}
                <div
                    ref={sidebarRef}
                    style={{ width: sidebarWidth, minWidth: 180, maxWidth: 400 }}
                    className="bg-gray-50 min-h-full border-r border-gray-200 p-4 transition-all duration-75 ease-linear relative"
                >
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Chapters</h3>
                        <div className="space-y-1">
                            {chaptersLoading ? (
                                <>
                                    {[...Array(8)].map((_, i) => (
                                        <div key={i} className="w-full flex items-center p-2 rounded-lg animate-pulse">
                                            <div className="min-w-[1.8rem] h-6 bg-gray-200 rounded mr-2"></div>
                                            <div
                                                className="flex-1 h-4 bg-gray-200 rounded"
                                                style={{ width: `${60 + Math.random() * 30}%` }}
                                            ></div>
                                        </div>
                                    ))}
                                </>
                            ) : chaptersError ? (
                                <div className="text-[#714B90] text-sm p-2">{chaptersError}</div>
                            ) : (
                                chapters.map((chapter: { number: string; title: string }) => (
                                    <button
                                        key={`${chapter.number}-${chapter.title}`}
                                        onClick={() => {
                                            setSelectedChapter(chapter)
                                            resetAllViews()
                                        }}
                                        className={`w-full flex items-center text-left p-2 rounded-lg text-sm transition-colors ${chapter === selectedChapter ? "bg-[#f4f5fc] text-[#714b90] shadow-sm" : "text-gray-700 hover:bg-gray-100"
                                            }`}
                                    >
                                        <span
                                            className={`inline-block min-w-[1.8rem] text-center px-2 py-0.5 rounded font-semibold mr-2 transition-all ${chapter === selectedChapter ? "bg-[#f4f5fc] text-[#714b90]" : "bg-white text-gray-700"
                                                }`}
                                        >
                                            {chapter.number}
                                        </span>
                                        <span className="truncate">{chapter.title}</span>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 p-3 bg-[#FFFBF2] relative overflow-hidden">
                    <div className="absolute inset-0 w-full h-full z-0">
                        <Image
                            src={FrameBg || "/placeholder.svg"}
                            alt="Background"
                            fill
                            style={{ objectFit: "cover" }}
                            className="pointer-events-none select-none"
                            priority
                            sizes="100vw"
                        />
                    </div>
                    <div className={mainContainerClass}>
                        {!callOpen && !viewingLessonPlan && !viewingAssessment && !viewingAssessmentResult && !viewingHistoricalAssessment && (
                            <>
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">How can I help you,</h1>
                                <p className="text-gray-600 mb-4">
                                    I&apos;m Clara, your AI study assistant. Select an option below to start learning{" "}
                                    {selectedChapter ? `Chapter ${selectedChapter.number}` : "this chapter"}
                                </p>
                                <div className="mb-5 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (!selectedSubject) {
                                                alert("Please select a subject before starting the call.")
                                                return
                                            }
                                            if (!selectedChapter) {
                                                alert("Please select a chapter before starting the call.")
                                                return
                                            }
                                            setCallOpen(true)
                                            if (room.state === "disconnected") {
                                                try {
                                                    setConnecting(true)
                                                    const details = await fetchConnectionDetailsWithConfig({
                                                        username: profile.first_name,
                                                        board: profile.board,
                                                        grade: profile.grade,
                                                        subject: selectedSubject,
                                                        chapter: selectedChapter?.number ?? "",
                                                        participantIdentity: profile.profile_id,
                                                    })
                                                    await room.connect(details.serverUrl, details.participantToken)
                                                    await room.localParticipant.setMicrophoneEnabled(true, undefined, { preConnectBuffer: true })
                                                } catch (e) {
                                                    console.error("connect error", e)
                                                } finally {
                                                    setConnecting(false)
                                                }
                                            }
                                            setSelectedThreadId(null)
                                            setThreadHistory([])
                                            setShowContinueButton(false)
                                            setCallOpen(true)
                                        }}
                                        className="bg-[#714B90] hover:bg-[#5a3a73] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-md hover:shadow-lg flex items-center gap-2"
                                    >
                                        <Mic className="w-4 h-4" />
                                        {connecting ? "Connecting…" : "Start Call"}
                                    </button>

                                    {profile.user_type === "Teacher" && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!selectedSubject || !selectedChapter) {
                                                    alert("Please select a subject and chapter first")
                                                    return
                                                }
                                                setShowLessonPlanModal(true)
                                            }}
                                            className="bg-white border-2 border-[#714B90] text-[#714B90] px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-md hover:shadow-lg hover:bg-[#714B9014] flex items-center gap-2"
                                        >
                                            <FileText className="w-4 h-4" />
                                            Generate Lesson Plan
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (!selectedSubject || !selectedChapter) {
                                                alert('Please select a subject and chapter first')
                                                return
                                            }
                                            generateAssessment()
                                        }}
                                        disabled={assessmentLoading}
                                        className="bg-white border-2 border-[#714B90] text-[#714B90] px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-md hover:shadow-lg hover:bg-[#714B9014] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {assessmentLoading ? (
                                            <>
                                                <div className="w-4 h-4 truncate border-2 border-[#714B90] border-t-transparent rounded-full animate-spin"></div>
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <FileText className="w-4 h-4" />
                                                Give Assessment
                                            </>
                                        )}
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {studyOptions.map((option, index) => (
                                        <div
                                            key={index}
                                            className="bg-white rounded-xl p-2 cursor-pointer hover:shadow-md transition-shadow flex flex-col items-center justify-between h-full"
                                        >
                                            <div className="mb-2 flex items-center justify-center w-full">
                                                <Image
                                                    src={option.img || "/placeholder.svg"}
                                                    alt={option.title + " image"}
                                                    width={80}
                                                    height={80}
                                                    className="w-20 h-20 object-contain"
                                                />
                                            </div>
                                            <h3 className="font-semibold text-gray-700 mb-1 text-sm">{option.title}</h3>
                                            <p className="text-gray-500 text-xs line-clamp-3">{option.description}</p>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {!callOpen && viewingLessonPlan && lessonPlanData && (
                            <div className="space-y-4 max-w-5xl mx-auto px-3 md:px-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                        <BookOpen className="w-6 h-6 text-[#714B90]" />
                                        Lesson Plan
                                    </h2>
                                    <button
                                        onClick={() => {
                                            setViewingLessonPlan(false)
                                            setLessonPlanData(null)
                                            // Reset assessment states to ensure mutual exclusivity
                                            setViewingAssessment(false)
                                            setViewingAssessmentResult(false)
                                            setAssessmentData(null)
                                            setUserAnswers({})
                                            setAssessmentResult(null)
                                        }}
                                        className="text-[#714B90] hover:underline text-sm font-medium"
                                    >
                                        ← Back to Options
                                    </button>
                                </div>

                                <div className="space-y-6 max-h-[78vh] border border-gray-200 rounded-xl overflow-y-auto p-2 md:p-3">
                                    {Array.isArray(
                                        (lessonPlanData as { generated_output?: Record<string, unknown>[] })?.generated_output,
                                    ) ? (
                                        (lessonPlanData as { generated_output: Record<string, unknown>[] }).generated_output.map(
                                            (lesson: Record<string, unknown>, idx: number) => (
                                                <div key={idx} className="bg-white p-6">
                                                    <h3 className="font-bold rounded-xl text-xl text-[#714B90] mb-4 pb-2 border-b border-gray-200">
                                                        Lesson {idx + 1}: {String(lesson.Lesson_Topic)}
                                                    </h3>

                                                    <div className="space-y-4 text-sm text-gray-700">
                                                        <div>
                                                            <h4 className="font-semibold text-gray-900 mb-2">Learning Objectives:</h4>
                                                            <ul className="space-y-1">
                                                                {formatAsBulletPoints(String(lesson.Learning_Objectives)).map((point, idx) => (
                                                                    <li key={idx} className="flex items-start">
                                                                        <span className="text-[#714B90] mr-2 mt-1">•</span>
                                                                        <span className="text-gray-700">{point}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>

                                                        <div>
                                                            <h4 className="font-semibold text-gray-900 mb-2">Learning Outcomes:</h4>
                                                            <ul className="space-y-1">
                                                                {formatAsBulletPoints(String(lesson.Learning_Outcomes)).map((point, idx) => (
                                                                    <li key={idx} className="flex items-start">
                                                                        <span className="text-[#714B90] mr-2 mt-1">•</span>
                                                                        <span className="text-gray-700">{point}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>

                                                        <div>
                                                            <h4 className="font-semibold text-gray-900 mb-2">Materials Required:</h4>
                                                            <ul className="space-y-1">
                                                                {formatAsBulletPoints(String(lesson.Materials_Required)).map((point, idx) => (
                                                                    <li key={idx} className="flex items-start">
                                                                        <span className="text-[#714B90] mr-2 mt-1">•</span>
                                                                        <span className="text-gray-700">{point}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>

                                                        {Boolean(lesson.Step_by_Step_Instructional_Plan) &&
                                                            typeof lesson.Step_by_Step_Instructional_Plan === "object" &&
                                                            lesson.Step_by_Step_Instructional_Plan !== null && (
                                                                <div>
                                                                    <h4 className="font-semibold text-gray-900 mb-2">Instructional Plan:</h4>
                                                                    <div className="space-y-4">
                                                                        {Object.entries(
                                                                            lesson.Step_by_Step_Instructional_Plan as Record<string, unknown>,
                                                                        ).map(([key, value]) => (
                                                                            <div key={key}>
                                                                                <h5 className="font-semibold text-gray-800 mb-2">{key.replace(/_/g, " ")}:</h5>
                                                                                <ul className="space-y-1">
                                                                                    {formatAsBulletPoints(String(value)).map((point, idx) => (
                                                                                        <li key={idx} className="flex items-start">
                                                                                            <span className="text-[#714B90] mr-2 mt-1">•</span>
                                                                                            <span className="text-gray-600">{point}</span>
                                                                                        </li>
                                                                                    ))}
                                                                                </ul>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}

                                                        <div>
                                                            <h4 className="font-semibold text-gray-900 mb-2">Real Life Applications:</h4>
                                                            <ul className="space-y-1">
                                                                {formatAsBulletPoints(String(lesson.Real_Life_Applications)).map((point, idx) => (
                                                                    <li key={idx} className="flex items-start">
                                                                        <span className="text-[#714B90] mr-2 mt-1">•</span>
                                                                        <span className="text-gray-700">{point}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>

                                                        {Boolean(lesson.Web_Resources) &&
                                                            Array.isArray(lesson.Web_Resources) &&
                                                            (lesson.Web_Resources as unknown[]).length > 0 && (
                                                                <div>
                                                                    <h4 className="font-semibold text-gray-900 mb-2">Web Resources:</h4>
                                                                    {(lesson.Web_Resources as string[]).map((url: string, i: number) => (
                                                                        <a
                                                                            key={i}
                                                                            href={url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-[#714B90] hover:underline block"
                                                                        >
                                                                            {url}
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            )}
                                                    </div>
                                                </div>
                                            ),
                                        )
                                    ) : Array.isArray(lessonPlanData) ? (
                                        lessonPlanData.map((lesson: Record<string, unknown>, idx: number) => (
                                            <div key={idx} className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                                                <h3 className="font-bold text-xl text-[#714B90] mb-4 pb-2 border-b border-gray-200">
                                                    Lesson {idx + 1}: {String(lesson.Lesson_Topic)}
                                                </h3>
                                                {/* ...rest of lesson rendering... */}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-gray-500 text-center">No lesson plan data available.</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {!callOpen && viewingAssessment && assessmentData && (
                            <AssessmentView
                                assessmentData={assessmentData}
                                userAnswers={userAnswers}
                                setUserAnswers={setUserAnswers}
                                onSubmit={submitAssessment}
                                submitting={submittingAssessment}
                                onBack={() => {
                                    setViewingAssessment(false)
                                    setAssessmentData(null)
                                    setUserAnswers({})
                                    // Reset lesson plan states to ensure mutual exclusivity
                                    setViewingLessonPlan(false)
                                    setLessonPlanData(null)
                                    setShowLessonPlanModal(false)
                                }}
                            />
                        )}

                        {!callOpen && viewingAssessmentResult && assessmentResult && (
                            <AssessmentResultView
                                result={assessmentResult}
                                onBack={() => {
                                    setViewingAssessmentResult(false)
                                    setAssessmentResult(null)
                                    setHistoricalAssessmentData(null)
                                    setIsViewingHistoricalResult(false)
                                    // Reset lesson plan states to ensure mutual exclusivity
                                    setViewingLessonPlan(false)
                                    setLessonPlanData(null)
                                    setShowLessonPlanModal(false)
                                }}
                                onViewAssessment={() => {
                                    setViewingAssessmentResult(false)
                                    setViewingHistoricalAssessment(true)
                                }}
                                isHistorical={isViewingHistoricalResult}
                            />
                        )}

                        {!callOpen && viewingHistoricalAssessment && historicalAssessmentData && (
                            <HistoricalAssessmentView
                                assessmentData={historicalAssessmentData}
                                userAnswers={historicalAssessmentData.Answers}
                                onBack={() => {
                                    setViewingHistoricalAssessment(false)
                                    setViewingAssessmentResult(true)
                                }}
                            />
                        )}

                        {callOpen && (
                            <RoomContext.Provider value={room}>
                                <div className="mb-3 md:mb-4 flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-semibold text-[#714B90]">Ask Questions</div>
                                        <div className="text-xs text-gray-500">
                                            {showContinueButton
                                                ? "Review your previous conversation"
                                                : "Start by asking questions for this chapter"}
                                        </div>
                                    </div>
                                </div>
                                <div className="relative overflow-hidden pt-2 pb-3">
                                    <RoomAudioRenderer />
                                    <StartAudio label="" />
                                    <div className="relative max-w-3xl mx-auto pr-2 px-1 md:px-2">
                                        <ClassroomMessages
                                            loading={!firstMessageArrived && (loading || connecting)}
                                            onFirstMessage={() => setFirstMessageArrived(true)}
                                            historyMessages={threadHistory}
                                        />
                                    </div>
                                </div>
                                <div className="max-w-3xl mx-auto px-1 md:px-2">
                                    {showContinueButton ? (
                                        <button
                                            onClick={async () => {
                                                setShowContinueButton(false)
                                                // threadHistory remains in state, so history stays visible
                                                if (room.state === "disconnected") {
                                                    try {
                                                        setConnecting(true)
                                                        const config: AppConfig = {
                                                            username: profile.first_name,
                                                            board: profile.board,
                                                            grade: profile.grade,
                                                            subject: selectedSubject,
                                                            chapter: selectedChapter?.number ?? "",
                                                            participantIdentity: profile.profile_id,
                                                            thread: selectedThreadId ?? undefined,
                                                        }
                                                        const details = await fetchConnectionDetailsWithConfig(config)
                                                        await room.connect(details.serverUrl, details.participantToken)
                                                        await room.localParticipant.setMicrophoneEnabled(true, undefined, {
                                                            preConnectBuffer: true,
                                                        })
                                                    } catch (e) {
                                                        console.error("connect error", e)
                                                    } finally {
                                                        setConnecting(false)
                                                    }
                                                }
                                            }}
                                            disabled={connecting}
                                            className="w-full bg-[#714B90] hover:bg-[#5a3a73] text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors shadow-md hover:shadow-lg disabled:opacity-50 mt-5"
                                        >
                                            {connecting ? "Connecting..." : "Continue Conversation"}
                                        </button>
                                    ) : (
                                        <ClassroomControlBar setCallOpen={setCallOpen} refreshHistory={refreshHistory} />
                                    )}
                                </div>
                            </RoomContext.Provider>
                        )}
                    </div>

                    {showLessonPlanModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-xl font-bold text-gray-900">Lesson Plan Configuration</h2>
                                    <button onClick={() => setShowLessonPlanModal(false)} className="text-gray-700 hover:text-gray-700">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Number of Lectures</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="4"
                                            value={lessonPlanFormData.numberOfLectures}
                                            onChange={(e) =>
                                                setLessonPlanFormData({
                                                    ...lessonPlanFormData,
                                                    numberOfLectures: Number.parseInt(e.target.value) || 1,
                                                })
                                            }
                                            className="w-full border text-gray-700 border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#714B90] focus:border-transparent outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Duration per Lecture (minutes)
                                        </label>
                                        <input
                                            type="number"
                                            min="10"
                                            max="60"
                                            step="5"
                                            value={lessonPlanFormData.durationOfLecture}
                                            onChange={(e) =>
                                                setLessonPlanFormData({
                                                    ...lessonPlanFormData,
                                                    durationOfLecture: Number.parseInt(e.target.value) || 10,
                                                })
                                            }
                                            className="w-full border text-gray-700 border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#714B90] focus:border-transparent outline-none"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={generateLessonPlan}
                                    disabled={lessonPlanLoading}
                                    className="w-full bg-[#714B90] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#5a3a73] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {lessonPlanLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Generating...
                                        </span>
                                    ) : (
                                        "Generate Lesson Plan"
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                </div>

                {/* Activity History Sidebar */}
                <div className="w-64 bg-gray-50 min-h-full border-r border-l border-gray-300 p-4">
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Activity History</h3>
                        <button
                            onClick={async () => {
                                if (!selectedSubject) {
                                    alert("Please select a subject before starting the call.")
                                    return
                                }
                                if (!selectedChapter) {
                                    alert("Please select a chapter before starting the call.")
                                    return
                                }
                                setCallOpen(true)
                                setViewingLessonPlan(false)
                                setLessonPlanData(null)
                                if (room.state === "disconnected") {
                                    try {
                                        setConnecting(true)
                                        const details = await fetchConnectionDetailsWithConfig({
                                            username: profile.first_name,
                                            board: profile.board,
                                            grade: profile.grade,
                                            subject: selectedSubject,
                                            chapter: selectedChapter?.number ?? "",
                                            participantIdentity: profile.profile_id,
                                        })
                                        await room.connect(details.serverUrl, details.participantToken)
                                        await room.localParticipant.setMicrophoneEnabled(true, undefined, { preConnectBuffer: true })
                                    } catch (e) {
                                        console.error("connect error", e)
                                    } finally {
                                        setConnecting(false)
                                    }
                                }
                                setSelectedThreadId(null)
                                setThreadHistory([])
                                setShowContinueButton(false)
                            }}
                            className="bg-[#714B90] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#5a3a73] transition-colors mb-4 w-full"
                        >
                            + New Conversation
                        </button>
                         <div className="space-y-2 h-[calc(100vh-180px)] overflow-y-auto pr-2 scrollbar-hide">
                            {threadsLoading ? (
                                <div className="text-gray-500 text-xs px-2">Loading history...</div>
                            ) : threadsError ? (
                                <div className="text-[#714B90] text-xs px-2">{threadsError}</div>
                            ) : threads.length === 0 ? (
                                <div className="text-gray-500 text-xs px-2">No history found.</div>
                            ) : (
                                threads.map((thread, index) => {
                                    // const isLessonPlan = thread.thread_type === "lesson_plan"

                                    return (
                                        <button
                                            key={thread.thread_id || index}
                                            onClick={() => {
                                                if (thread.thread_type === 'lesson_plan') {
                                                    fetchLessonPlanById(thread.thread_id)
                                                } else if (thread.thread_type === 'assessment') {
                                                    fetchThreadById(thread.thread_id, 'assessment')
                                                } else {
                                                    fetchThreadById(thread.thread_id, 'tutor')
                                                }
                                            }}
                                            disabled={loadingThread}
                                            className="w-full pb-3 border-b border-gray-200 last:border-b-0 text-left bg-white hover:bg-white hover:shadow-sm px-3 py-2.5 rounded-lg transition-all group"
                                        >
                                            <div className="flex items-start gap-2 mb-1.5">
                                                <div className="flex-shrink-0 mt-0.5">
                                                    {thread.thread_type === 'lesson_plan' ? (
                                                        <FileText className="w-4 h-4 text-[#714B90]" />
                                                    ) : thread.thread_type === 'assessment' ? (
                                                        <BookOpen className="w-4 h-4 text-[#714B90]" />
                                                    ) : (
                                                        <BookOpen className="w-4 h-4 text-[#714B90]" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-medium text-gray-900 mb-1 truncate group-hover:text-[#714B90] transition-colors">
                                                        {thread.thread_title || `Thread: ${thread.thread_id.slice(0, 8)}...`}
                                                    </h4>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span
                                                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${thread.thread_type === 'lesson_plan'
                                                                ? 'bg-yellow-50 text-[#714B90] border border-[#714B9033]'
                                                                : thread.thread_type === 'assessment'
                                                                    ? 'bg-green-50 text-[#714B90] border border-green-200'
                                                                    : 'bg-purple-50 text-[#714B90] border border-purple-200'
                                                                }`}
                                                        >
                                                            {thread.thread_type === 'lesson_plan' ? 'Lesson Plan' : thread.thread_type === 'assessment' ? 'Assessment' : 'Tutor Session'}
                                                        </span>
                                                        <span className="text-[10px] text-gray-500">
                                                            {new Date(thread.updated_at).toLocaleDateString("en-US", {
                                                                month: "short",
                                                                day: "numeric",
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    )
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default withProtectedRoute(Classroom)

// Add ThreadMessage type for thread history
export type ThreadMessage = {
    role: string
    timestamp: string
    message: string
}

// Add ThreadObject type for thread data
export type ThreadObject = {
    thread_id: string
    thread_title: string
    thread_type: string
    updated_at: string
}

// Add ThreadDetailData type for detailed thread response
export type ThreadDetailData = {
    board: string
    thread_id: string
    subject: string
    agent_name: string
    thread_data: ThreadMessage[]
    conversation_summary: (string | null)[]
    session_data: Array<{
        topics_covered: string[]
        strong_areas: string[]
        needs_improvement: string[]
    }>
    thread_title: string
    updated_at: string
    grade: string
    user_id: string
    chapter: string
    room_name: string
    created_at: string
}

type AssessmentData = {
    General_Instructions: string
    MCQs: Array<Array<Record<string, string>>>
    True_False_Questions: Array<Array<Record<string, string>>>
    Fill_in_the_Blanks: Array<Array<Record<string, string>>>
    Very_Short_Answers: Array<Array<Record<string, string>>>
    Short_Answers: Array<Array<Record<string, string>>>
    Long_Answers: Array<Array<Record<string, string>>>
    Very_Long_Answers: Array<Array<Record<string, string>>>
    Case_Studies: Array<Array<Record<string, string>>>
    Answers: Record<string, string>
}

type AssessmentResult = {
    grade: string
    score_summary: {
        score: number
        total: number
        remark: string
    }
    teacher_feedback: {
        positive_note: string
        improvement_note: string
    }
    next_step: string
}

function ClassroomMessages({
    onFirstMessage,
    historyMessages = [],
}: {
    loading?: boolean
    onFirstMessage?: () => void
    historyMessages?: ThreadMessage[]
}) {
    const { messages } = useChatAndTranscription()
    const room = useRoomContext()
    const containerRef = React.useRef<HTMLDivElement | null>(null)
    const firstMessageShown = React.useRef(false)

    // Combine history messages with live messages
    const allMessages = React.useMemo(() => {
        const historyConverted = historyMessages.map((msg, idx) => ({
            id: `history-${idx}`,
            from: { isLocal: msg.role === "user" },
            timestamp: new Date(msg.timestamp).getTime(),
            message: msg.message,
        }))
        return [...historyConverted, ...messages]
    }, [historyMessages, messages])

    React.useEffect(() => {
        const el = containerRef.current
        if (!el) return
        el.scrollTop = el.scrollHeight
    }, [allMessages])

    useEffect(() => {
        if (!firstMessageShown.current && messages.length > 0) {
            firstMessageShown.current = true
            onFirstMessage?.()
        }
    }, [messages, onFirstMessage])

    if (allMessages.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[65vh]">
                <AudioNoteSummarizerLoader />
                <div className="flex justify-start w-full mt-6">
                    <div className="bg-white text-[#714B90] rounded-tl-sm shadow rounded-2xl px-4 py-2 max-w-[80%] text-[13px] leading-relaxed font-semibold mx-auto">
                        Connecting Tutor, Please wait...
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div ref={containerRef} className="space-y-3 h-[65vh] overflow-y-auto pr-2 pb-4 md:pb-6 scrollbar-hide">
            {allMessages.map((m) => {
                // Fix: Only check identity if it exists on both sides
                let isLocal = false
                if (m.from) {
                    if (m.from.isLocal === true) {
                        isLocal = true
                    } else if (
                        "identity" in m.from &&
                        room.localParticipant &&
                        "identity" in room.localParticipant &&
                        m.from.identity === room.localParticipant.identity
                    ) {
                        isLocal = true
                    }
                }
                const ts = new Date(m.timestamp || Date.now())
                const timeStr = ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                return (
                    <div key={m.id} className={`flex ${isLocal ? "justify-end" : "justify-start"}`}>
                        <div
                            className={`${isLocal ? "bg-[#714B90] text-white rounded-tr-sm" : "bg-white text-gray-800 rounded-tl-sm shadow"} rounded-2xl px-4 py-2 max-w-[80%] text-[13px] leading-relaxed`}
                        >
                            <div className="whitespace-pre-wrap break-words">
                                <ReactMarkdown>{m.message}</ReactMarkdown>
                            </div>
                            <div className={`${isLocal ? "text-white/70" : "text-gray-500"} text-[10px] mt-1 text-right`}>
                                {timeStr}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

function ClassroomControlBar({
    setCallOpen,
    refreshHistory,
}: { setCallOpen: (open: boolean) => void; refreshHistory: () => void }) {
    // Force all controls to be visible
    const visibleControls = {
        microphone: true,
        camera: true,
        screenShare: true,
        chat: true,
        leave: true,
    }
    const { cameraToggle, microphoneToggle, screenShareToggle, handleDisconnect } = useAgentControlBar({})

    const [message, setMessage] = React.useState("")
    const room = React.useContext(RoomContext) as Room
    const chat = useChat()
    const { localParticipant } = useLocalParticipant()
    const canSend = room?.state === "connected"

    // Track video state
    const cameraTrack = localParticipant?.getTrackPublication(Track.Source.Camera)
    const isCameraEnabled = cameraTrack?.track && !cameraTrack?.isMuted

    async function sendMessage() {
        if (!canSend || !message.trim()) return
        try {
            await chat.send(message)
            setMessage("")
        } catch (e) {
            console.error("send message error", e)
        }
    }

    return (
        <div className="space-y-2">
            {/* Video Preview - Only show when camera is enabled */}
            {isCameraEnabled && cameraTrack?.track && (
                <DraggableVideoPreviewer>
                    <VideoTrack
                        trackRef={{
                            participant: localParticipant,
                            source: Track.Source.Camera,
                            publication: cameraTrack,
                        }}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
                        <span className="text-white text-xs font-medium">You</span>
                    </div>
                </DraggableVideoPreviewer>
            )}

            <div className="flex flex-col gap-2">
                {/* Chat Input Area (always open, above control bar) */}
                <div className="bg-white border-2 border-gray-200 rounded-2xl shadow-sm p-2 mt-0">
                    <div className="flex items-center gap-2">
                        <input
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault()
                                    sendMessage()
                                }
                            }}
                            placeholder="Type your message..."
                            className="flex-1 rounded-xl text-gray-700 border-0 px-3 py-2 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#714B90] focus:bg-white transition-all"
                            disabled={!canSend}
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!canSend || !message.trim()}
                            className="inline-flex items-center justify-center rounded-xl bg-[#714B90] px-4 py-2 text-sm font-medium text-white hover:bg-[#5a3a73] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-95"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                {/* Main Control Bar */}
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-2 shadow-lg">
                    <div className="flex items-center justify-between gap-2">
                        {/* Left Side Controls */}
                        <div className="flex items-center gap-1">
                            {/* Microphone Control */}
                            {visibleControls.microphone && (
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => microphoneToggle.toggle()}
                                        disabled={microphoneToggle.pending}
                                        className={`relative inline-flex items-center justify-center gap-1 rounded-xl px-3 py-2 text-sm font-medium transition-all shadow-md hover:shadow-lg active:scale-95 ${microphoneToggle.enabled
                                            ? "bg-[#714B90] text-white hover:bg-[#5a3a73]"
                                            : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                                            } ${microphoneToggle.pending ? "opacity-60 cursor-wait" : ""}`}
                                    >
                                        {microphoneToggle.pending ? (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : microphoneToggle.enabled ? (
                                            <Mic className="w-4 h-4" />
                                        ) : (
                                            <MicOff className="w-4 h-4" />
                                        )}
                                        <span className="hidden sm:inline">{microphoneToggle.enabled ? "Mic On" : "Mic Off"}</span>
                                    </button>
                                </div>
                            )}
                            {/* Camera Control */}
                            {visibleControls.camera && (
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => cameraToggle.toggle()}
                                        disabled={cameraToggle.pending}
                                        className={`relative inline-flex items-center justify-center gap-1 rounded-xl px-3 py-2 text-sm font-medium transition-all shadow-md hover:shadow-lg active:scale-95 ${cameraToggle.enabled
                                            ? "bg-[#714B90] text-white hover:bg-[#5a3a73]"
                                            : "bg-gray-600 text-white hover:bg-gray-700"
                                            } ${cameraToggle.pending ? "opacity-60 cursor-wait" : ""}`}
                                    >
                                        {cameraToggle.pending ? (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : cameraToggle.enabled ? (
                                            <Video className="w-4 h-4" />
                                        ) : (
                                            <VideoOff className="w-4 h-4" />
                                        )}
                                        <span className="hidden sm:inline">{cameraToggle.enabled ? "Video On" : "Video Off"}</span>
                                    </button>
                                </div>
                            )}
                            {/* Screen Share Control */}
                            {visibleControls.screenShare && (
                                <button
                                    onClick={() => screenShareToggle.toggle()}
                                    disabled={screenShareToggle.pending}
                                    className={`relative inline-flex items-center justify-center gap-1 rounded-xl px-3 py-2 text-sm font-medium transition-all shadow-md hover:shadow-lg active:scale-95 ${screenShareToggle.enabled
                                        ? "bg-blue-500 text-white hover:bg-blue-600"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        } ${screenShareToggle.pending ? "opacity-60 cursor-wait" : ""}`}
                                >
                                    {screenShareToggle.pending ? (
                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <MonitorUp className="w-4 h-4" />
                                    )}
                                    <span className="hidden sm:inline">{screenShareToggle.enabled ? "Stop Share" : "Share Screen"}</span>
                                </button>
                            )}
                        </div>
                        {/* Right Side Controls */}
                        <div className="flex items-center gap-1">
                            {/* End Call */}
                            {visibleControls.leave && (
                                <button
                                    onClick={() => {
                                        handleDisconnect()
                                        setCallOpen(false)
                                        // Refresh history sidebar to show latest data after 1.5 seconds
                                        setTimeout(() => {
                                            refreshHistory()
                                        }, 2000) // 2 second delay to allow history generation to complete
                                    }}
                                    className="inline-flex items-center justify-center gap-1 rounded-xl bg-[#714B90] px-3 py-2 text-sm font-medium text-white hover:bg-[#5a3a73] transition-all shadow-md hover:shadow-lg active:scale-95"
                                >
                                    <PhoneOff className="w-4 h-4" />
                                    <span className="hidden sm:inline">End Session</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function AssessmentView({
    assessmentData,
    userAnswers,
    setUserAnswers,
    onSubmit,
    submitting,
    onBack,
}: {
    assessmentData: AssessmentData
    userAnswers: Record<string, string>
    setUserAnswers: (answers: Record<string, string>) => void
    onSubmit: () => void
    submitting: boolean
    onBack: () => void
}) {
    const handleAnswerChange = (questionNum: string, value: string) => {
        setUserAnswers({ ...userAnswers, [questionNum]: value })
    }

    const renderQuestionSection = (
        title: string,
        questions: Array<Array<Record<string, string>>>,
        inputType: 'radio' | 'text' | 'textarea'
    ) => {
        if (!questions || questions.length === 0 || questions[0].length === 0) return null

        return (
            <div className="mb-8">
                <h3 className="text-lg font-bold text-[#714B90] mb-4">{title}</h3>
                {questions[0].map((q, idx) => {
                    const qNum = Object.keys(q)[0]
                    const qText = q[qNum]

                    return (
                        <div key={idx} className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <p className="font-medium text-gray-900 mb-3">
                                Q{qNum}. {inputType === 'radio' && qText.includes('Options:') ? qText.split('Options:')[0].trim() : qText}
                            </p>

                            {inputType === 'radio' && qText.includes('Options:') ? (
                                <div className="space-y-2">
                                    {qText
                                        .split('Options:')[1]
                                        .split('\n')
                                        .filter((opt) => opt.trim())
                                        .map((option, optIdx) => (
                                            <label key={optIdx} className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="radio"
                                                    name={`q-${qNum}`}
                                                    value={option.trim()[0]}
                                                    checked={userAnswers[qNum] === option.trim()[0]}
                                                    onChange={(e) => handleAnswerChange(qNum, e.target.value)}
                                                    className="w-4 h-4 text-[#714B90] focus:ring-[#714B90]"
                                                />
                                                <span className="text-gray-700">{option.trim()}</span>
                                            </label>
                                        ))}
                                </div>
                            ) : inputType === 'textarea' ? (
                                <textarea
                                    value={userAnswers[qNum] || ''}
                                    onChange={(e) => handleAnswerChange(qNum, e.target.value)}
                                    placeholder="Enter your answer..."
                                    rows={4}
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:ring-2 focus:ring-[#714B90] focus:border-transparent outline-none"
                                />
                            ) : (
                                <input
                                    type="text"
                                    value={userAnswers[qNum] || ''}
                                    onChange={(e) => handleAnswerChange(qNum, e.target.value)}
                                    placeholder="Enter your answer..."
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:ring-2 focus:ring-[#714B90] focus:border-transparent outline-none"
                                />
                            )}
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <div className="h-[86vh] flex flex-col max-w-5xl mx-auto px-3 md:px-6 py-3">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-[#714B90]" />
                    Assessment
                </h2>
                <button onClick={onBack} className="text-[#714B90] hover:underline text-sm font-medium">
                    ← Back to Options
                </button>
            </div>

            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-xl p-4 md:p-6 bg-white mb-4">
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h3 className="font-bold text-gray-900 mb-2">General Instructions</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{assessmentData.General_Instructions}</p>
                </div>

                {renderQuestionSection('Multiple Choice Questions', assessmentData.MCQs, 'radio')}
                {renderQuestionSection('True/False Questions', assessmentData.True_False_Questions, 'radio')}
                {renderQuestionSection('Fill in the Blanks', assessmentData.Fill_in_the_Blanks, 'text')}
                {renderQuestionSection('Very Short Answers', assessmentData.Very_Short_Answers, 'text')}
                {renderQuestionSection('Short Answers', assessmentData.Short_Answers, 'textarea')}
                {renderQuestionSection('Long Answers', assessmentData.Long_Answers, 'textarea')}
                {renderQuestionSection('Very Long Answers', assessmentData.Very_Long_Answers, 'textarea')}
                {renderQuestionSection('Case Studies', assessmentData.Case_Studies, 'textarea')}
            </div>

            <button
                onClick={onSubmit}
                disabled={submitting}
                className="w-full bg-[#714B90] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#5a3a73] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
                {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Submitting...
                    </span>
                ) : (
                    'Submit Assessment'
                )}
            </button>
        </div>
    )
}

function AssessmentResultView({ result, onBack, onViewAssessment, isHistorical = false }: { result: AssessmentResult; onBack: () => void; onViewAssessment?: () => void; isHistorical?: boolean }) {
    return (
        <div className="h-[86vh] flex flex-col max-w-5xl mx-auto px-3 md:px-6 py-3">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-[#714B90]" />
                    Assessment Results
                </h2>
                <button onClick={onBack} className="text-[#714B90] hover:underline text-sm font-medium">
                    ← Back to Options
                </button>
            </div>

            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-xl p-4 md:p-5 bg-white mb-4 scrollbar-hide">
                <div className="text-center mb-6">
                    <p className="text-2xl font-bold text-gray-900">
                        {result.score_summary.score} / {result.score_summary.total}
                    </p>
                    <p className="text-gray-600 mt-2">{result.score_summary.remark}</p>
                </div>

                <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h3 className="font-bold text-green-900 mb-2">Strengths</h3>
                        <p className="text-sm text-green-800">{result.teacher_feedback.positive_note}</p>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h3 className="font-bold text-yellow-900 mb-2">Areas for Improvement</h3>
                        <p className="text-sm text-yellow-800">{result.teacher_feedback.improvement_note}</p>
                    </div>

                    {result.next_step && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="font-bold text-blue-900 mb-2">Next Steps</h3>
                            <p className="text-sm text-blue-800">{result.next_step}</p>
                        </div>
                    )}
                </div>
            </div>

            {onViewAssessment && isHistorical && (
                <button
                    onClick={onViewAssessment}
                    className="w-full bg-[#714B90] text-white px-6 py-2 rounded-lg font-medium hover:bg-[#5a3a73] transition-colors flex-shrink-0"
                >
                    View Assessment Questions & Answers
                </button>
            )}
        </div>
    )
}

function HistoricalAssessmentView({
    assessmentData,
    userAnswers,
    onBack,
}: {
    assessmentData: AssessmentData
    userAnswers: Record<string, string>
    onBack: () => void
}) {
    const renderQuestionSection = (
        title: string,
        questions: Array<Array<Record<string, string>>>
    ) => {
        if (!questions || questions.length === 0 || questions[0].length === 0) return null

        return (
            <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                    {title}
                </h3>
                <div className="space-y-4">
                    {questions[0].map((question, index) => {
                        const questionNum = Object.keys(question).find(key => !key.startsWith('answer-')) || ''
                        const questionText = question[questionNum] || ''
                        const answerKey = `answer-${questionNum}`
                        const userAnswer = userAnswers[questionNum] || question[answerKey] || ''

                        return (
                            <div key={index} className="bg-gray-50 p-4 rounded-lg">
                                <div className="mb-3">
                                    <p className="font-medium text-gray-900 mb-2">
                                        Question {questionNum}: {questionText.includes('Options:') ? questionText.split('Options:')[0].trim() : questionText}
                                    </p>
                                </div>
                                <div className="bg-white p-3 rounded border">
                                    <p className="text-sm text-gray-600 mb-1">Your Answer:</p>
                                    <p className="text-gray-900 font-medium">{userAnswer}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )
    }


    return (
        <div className="h-[86vh] flex flex-col max-w-5xl mx-auto px-3 md:px-6 py-3">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-6 h-6 text-[#714B90]" />
                    Completed Assessment
                </h2>
                <button onClick={onBack} className="text-[#714B90] hover:underline text-sm font-medium">
                    ← Back to Results
                </button>
            </div>

            <div className="flex-1 overflow-y-auto border border-gray-200 rounded-xl p-4 md:p-6 bg-white mb-4">
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h3 className="font-bold text-gray-900 mb-2">General Instructions</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{assessmentData.General_Instructions}</p>
                </div>

                {renderQuestionSection('Multiple Choice Questions', assessmentData.MCQs)}
                {renderQuestionSection('True/False Questions', assessmentData.True_False_Questions)}
                {renderQuestionSection('Fill in the Blanks', assessmentData.Fill_in_the_Blanks)}
                {renderQuestionSection('Very Short Answers', assessmentData.Very_Short_Answers)}
                {renderQuestionSection('Short Answers', assessmentData.Short_Answers)}
                {renderQuestionSection('Long Answers', assessmentData.Long_Answers)}
                {renderQuestionSection('Very Long Answers', assessmentData.Very_Long_Answers)}
                {renderQuestionSection('Case Studies', assessmentData.Case_Studies)}
            </div>
        </div>
    )
}

function DraggableVideoPreviewer({ children }: { children: React.ReactNode }) {
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const [dragging, setDragging] = useState(false)
    const [offset, setOffset] = useState({ x: 0, y: 0 })
    const previewRef = useRef<HTMLDivElement>(null)

    // Default position: above input, right side
    useEffect(() => {
        if (previewRef.current) {
            const input = document.querySelector('input[placeholder="Type your message..."]')
            if (input) {
                const inputRect = input.getBoundingClientRect()
                setPosition({
                    x: inputRect.right - 120, // moved more right (was -160)
                    y: inputRect.top - 160, // moved more upward (was -120)
                })
            } else {
                setPosition({ x: window.innerWidth - 140, y: window.innerHeight - 260 }) // fallback, more right/up
            }
        }
    }, [])

    const onMouseDown = (e: React.MouseEvent) => {
        setDragging(true)
        setOffset({
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        })
    }
    const onMouseUp = () => setDragging(false)
    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (dragging) {
                setPosition({
                    x: e.clientX - offset.x,
                    y: e.clientY - offset.y,
                })
            }
        }

        if (dragging) {
            window.addEventListener("mousemove", onMouseMove)
            window.addEventListener("mouseup", onMouseUp)
        } else {
            window.removeEventListener("mousemove", onMouseMove)
            window.removeEventListener("mouseup", onMouseUp)
        }
        return () => {
            window.removeEventListener("mousemove", onMouseMove)
            window.removeEventListener("mouseup", onMouseUp)
        }
    }, [dragging, offset])

    return (
        <div
            ref={previewRef}
            style={{
                position: "fixed",
                left: position.x,
                top: position.y,
                width: 160,
                height: 120,
                zIndex: 9999,
                cursor: dragging ? "grabbing" : "grab",
                boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
                borderRadius: 12,
                background: "#222",
                overflow: "hidden",
                userSelect: "none",
            }}
            onMouseDown={onMouseDown}
        >
            {children}
        </div>
    )
}