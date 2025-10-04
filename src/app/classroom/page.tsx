"use client"
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { withProtectedRoute } from '@/components/ProtectedRoute';
import { Room } from 'livekit-client';
import { RoomAudioRenderer, RoomContext, StartAudio, useRoomContext, useChat, VideoTrack, useLocalParticipant } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useAgentControlBar } from '@/components/livekit/agent-control-bar/hooks/use-agent-control-bar';
import useConnectionDetails from '@/hooks/useConnectionDetails';
import useChatAndTranscription from '@/hooks/useChatAndTranscription';
import { ChevronDown, Menu, X, Send, Mic, MicOff, Video, VideoOff, MonitorUp, PhoneOff } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import Logo from '@/assets/create-profile/LeoQuiIconBall.png';
import LeoCoin from '@/assets/Coin.png';
import ComputerImg from '@/assets/ComputerImg.svg';
import EnglishImg from '@/assets/EnglishImg.svg';
import HindiImg from '@/assets/HindiImg.svg';
import MathsImg from '@/assets/MathsImg.svg';
import ScienceImg from '@/assets/ScienceImg.svg';
import FrameBg from '@/assets/Frame100000.png';
import AskQuestionsImg from '@/assets/AskQuestionsImg.svg';
import HomeWorkImg from '@/assets/HomeWorkImg.svg';
import StudyNotesImg from '@/assets/StudyNotesImg.svg';
import PracticeQuestionsImg from '@/assets/PracticeQuestionsImg.svg';
import ReactMarkdown from 'react-markdown';
import { AudioNoteSummarizerLoader } from '@/components/loader';

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
    profile_completed: boolean;
}

const studyOptions = [
    {
        img: AskQuestionsImg,
        title: "Ask Questions",
        description: "Provides comprehensive solutions to all your doubts"
    },
    {
        img: HomeWorkImg,
        title: "Homework Help",
        description: "Provides comprehensive solutions to all your doubts"
    },
    {
        img: StudyNotesImg,
        title: "Study Notes",
        description: "Provides comprehensive solutions to all your doubts"
    },
    {
        img: PracticeQuestionsImg,
        title: "Practice Questions",
        description: "Provides comprehensive solutions to all your doubts"
    },
    {
        img: HomeWorkImg,
        title: "This or that",
        description: "Provides comprehensive solutions to all your doubts"
    },
    {
        img: HomeWorkImg,
        title: "Flash Cards",
        description: "Provides comprehensive solutions to all your doubts"
    }
];


// Helper to get subject image
const getSubjectImage = (rawName: string) => {
    const name = (rawName || '').toLowerCase();
    if (/(math|mathematics|arith)/.test(name)) return MathsImg;
    if (/computer|informatics|it|ict/.test(name)) return ComputerImg;
    if (/hindi/.test(name)) return HindiImg;
    if (/english|language arts/.test(name)) return EnglishImg;
    if (/science|sci/.test(name)) return ScienceImg;
    return EnglishImg;
};

const Classroom = () => {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [subjects, setSubjects] = useState<string[]>([]);
    const [subjectsLoading, setSubjectsLoading] = useState(false);
    const [subjectsError, setSubjectsError] = useState<string | null>(null);
    const [selectedSubject, setSelectedSubject] = useState<string>('');
    const [chapters, setChapters] = useState<{ number: string, title: string }[]>([]);
    const [chaptersLoading, setChaptersLoading] = useState(false);
    const [chaptersError, setChaptersError] = useState<string | null>(null);
    const [selectedChapter, setSelectedChapter] = useState<{ number: string, title: string } | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [callOpen, setCallOpen] = useState(false);
    const room = useMemo(() => new Room(), []);
    const [connecting, setConnecting] = useState(false);
    const appConfig = {
        board: profile?.board || 'CBSE',
        grade: profile?.grade || '',
        subject: selectedSubject || '',
        chapter: selectedChapter?.number || '', // pass chapter number only
        participantIdentity: profile?.profile_id || 'string',
        thread: 'string',
    };
    const { fetchConnectionDetailsWithConfig } = useConnectionDetails(appConfig);
    const [loading, setLoading] = useState(true);
    const [sidebarWidth, setSidebarWidth] = useState(288);
    const sidebarRef = useRef(null);
    const isDragging = useRef(false);
    const [firstMessageArrived, setFirstMessageArrived] = useState(false);

    // Remove static activityHistory and add state for threads
    const [threads, setThreads] = useState<any[]>([]);
    const [threadsLoading, setThreadsLoading] = useState(false);
    const [threadsError, setThreadsError] = useState<string | null>(null);

    const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
    const [threadHistory, setThreadHistory] = useState<any[]>([]);
    const [loadingThread, setLoadingThread] = useState(false);
    const [showContinueButton, setShowContinueButton] = useState(false);

    const searchParams = useSearchParams();

    // Fetch profile
    useEffect(() => {
        const userData = searchParams?.get('userData');
        async function fetchProfile() {
            try {
                const res = await fetch('/api/get-user-profile');
                if (!res.ok) throw new Error('Failed to fetch profile');
                const data = await res.json();
                if (data?.data?.profile) {
                    setProfile(data.data.profile);
                } else {
                    // setError('Profile not found.'); // Removed
                }
            } catch {
                // setError('Error loading profile.'); // Removed
            } finally {
                setLoading(false);
            }
        }
        if (userData) {
            try {
                const parsedProfile = JSON.parse(decodeURIComponent(userData));
                setProfile(parsedProfile);
                setLoading(false);
            } catch {
                // setError('Error parsing user data.'); // Removed
                setLoading(false);
            }
        } else {
            fetchProfile();
        }
    }, [searchParams]);

    // Fetch subjects when profile is loaded
    useEffect(() => {
        if (!profile) return;
        setSubjectsLoading(true);
        setSubjectsError(null);
        setSubjects([]);
        setSelectedSubject('');
        fetch(`/api/dropdown-values?board=${encodeURIComponent(profile.board)}&grade=${encodeURIComponent(profile.grade)}`)
            .then(res => res.json())
            .then(data => {
                const list = data?.data?.data || data?.data || [];
                if (Array.isArray(list) && list.length > 0) {
                    setSubjects(list);
                    const urlSubjectRaw = searchParams?.get('subject') || '';
                    if (urlSubjectRaw) {
                        const target = decodeURIComponent(urlSubjectRaw).trim().toLowerCase();
                        const exactMatch = list.find((s: string) => (s || '').trim().toLowerCase() === target);
                        const partialMatch = exactMatch || list.find((s: string) => (s || '').trim().toLowerCase().includes(target));
                        setSelectedSubject(partialMatch || list[0]);
                    } else {
                        setSelectedSubject(list[0]);
                    }
                } else {
                    setSubjectsError('No subjects found.');
                }
            })
            .catch(() => setSubjectsError('Failed to load subjects.'))
            .finally(() => setSubjectsLoading(false));
    }, [profile, searchParams]);

    // Fetch chapters when subject changes
    useEffect(() => {
        if (!profile || !selectedSubject) {
            setChapters([]);
            return;
        }
        setChaptersLoading(true);
        setChaptersError(null);
        setChapters([]);
        setSelectedChapter(null);
        fetch(`/api/dropdown-values?board=${encodeURIComponent(profile.board)}&grade=${encodeURIComponent(profile.grade)}&subject=${encodeURIComponent(selectedSubject)}`)
            .then(res => res.json())
            .then(data => {
                const list = data?.data?.data || data?.data || [];
                if (Array.isArray(list) && list.length > 0) {
                    const parsedChapters = list.map((chapter: [string, string]) => ({
                        number: chapter[0],
                        title: chapter[1]
                    }));
                    setChapters(parsedChapters);
                    setSelectedChapter(parsedChapters[0]);
                } else {
                    setChaptersError('No chapters found.');
                }
            })
            .catch(() => setChaptersError('Failed to load chapters.'))
            .finally(() => setChaptersLoading(false));
    }, [profile, selectedSubject]);

    // Fetch threads when profile and selectedSubject are available
    useEffect(() => {
        if (!profile || !selectedSubject || !selectedChapter) return;
        setThreadsLoading(true);
        setThreadsError(null);
        setThreads([]);
        fetch(`/api/livekit/get-all-threads?board=${encodeURIComponent(profile.board)}&subject=${encodeURIComponent(selectedSubject)}&grade=${encodeURIComponent(profile.grade)}&chapter=${encodeURIComponent(selectedChapter.number)}`)
            .then(res => res.json())
            .then(data => {
                if (data?.status && Array.isArray(data.data)) {
                    setThreads(data.data);
                } else {
                    setThreadsError('No history found.');
                }
            })
            .catch(() => setThreadsError('Failed to load history.'))
            .finally(() => setThreadsLoading(false));
    }, [profile, selectedSubject, selectedChapter]);

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (!isDragging.current) return;
            const min = 180, max = 400;
            setSidebarWidth(Math.min(max, Math.max(min, e.clientX - (sidebarRef.current as unknown as HTMLElement)?.getBoundingClientRect().left)));
        };

        const handleMouseUp = () => { isDragging.current = false; };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const fetchThreadById = async (threadId: string) => {
        setLoadingThread(true);
        try {
            const res = await fetch(`/api/livekit/get-thread-by-id?threadId=${threadId}`);
            const data = await res.json();
            if (data.status && data.data) {
                setSelectedThreadId(threadId);
                setThreadHistory(data.data.thread_data || []);
                setShowContinueButton(true);
                setCallOpen(true); // Open the call screen
            }
        } catch (error) {
            console.error('Error fetching thread:', error);
        } finally {
            setLoadingThread(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FFFBF2]">
                <div className="text-center">
                    <div className="w-8 h-8 border-4 border-[#714B90] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading classroom...</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return null;
    }

    const userInitials = `${profile.first_name?.[0] || ''}${profile.last_name?.[0] || ''}`.toUpperCase() || 'U';

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-xs w-full">
                <div className="flex items-center justify-between mx-auto">
                    <div className="flex items-center gap-4">
                        <Link href='/dashboard'>
                            <div className="flex items-center gap-1">
                                <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-white">
                                    <Image
                                        src={Logo}
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
                                src={LeoCoin}
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
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="sm:hidden p-2"
                    >
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
                                    src={LeoCoin}
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
                            <span>{profile.board} › Class {profile.grade}th</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Content Row */}
            <div className="flex flex-1">
                {/* Subjects Sidebar */}
                <div className="w-24 bg-gradient-to-b from-[#f5f3ff] to-[#f8fafc] border-r border-gray-200 flex flex-col items-center py-6 gap-2">
                    {subjectsLoading ? (
                        <div className="text-gray-500 text-xs">Loading...</div>
                    ) : subjectsError ? (
                        <div className="text-[#714B90] text-xs">{subjectsError}</div>
                    ) : (
                        subjects.map((subject) => (
                            <button
                                key={subject}
                                onClick={() => setSelectedSubject(subject)}
                                className='flex flex-col items-center w-20 h-20 my-1 rounded-2xl transition-all'
                            >
                                <div className={`mb-1 flex items-center justify-center w-12 h-12 rounded-full transition-all ${subject === selectedSubject
                                    ? 'bg-white border-2 border-[#714B90] shadow text-[#714B90]'
                                    : 'bg-transparent border-2 border-transparent text-gray-500 hover:bg-[#ede9fe]'
                                    }`}>
                                    <Image
                                        src={getSubjectImage(subject)}
                                        alt={subject}
                                        width={48}
                                        height={48}
                                        className="w-12 h-12 object-contain"
                                    />
                                </div>
                                <span className="text-xs font-medium text-gray-900 w-full mt-1 text-center min-h-[3rem] whitespace-normal break-words">{subject}</span>
                            </button>
                        ))
                    )}
                </div>

                {/* Chapters Sidebar */}
                <div ref={sidebarRef} style={{ width: sidebarWidth, minWidth: 180, maxWidth: 400 }} className="bg-gray-50 min-h-full border-r border-gray-200 p-4 transition-all duration-75 ease-linear relative">
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-3">Chapters</h3>
                        <div className="space-y-1">
                            {chaptersLoading ? (
                                <>
                                    {[...Array(8)].map((_, i) => (
                                        <div key={i} className="w-full flex items-center p-2 rounded-lg animate-pulse">
                                            <div className="min-w-[1.8rem] h-6 bg-gray-200 rounded mr-2"></div>
                                            <div className="flex-1 h-4 bg-gray-200 rounded" style={{ width: `${60 + Math.random() * 30}%` }}></div>
                                        </div>
                                    ))}
                                </>
                            ) : chaptersError ? (
                                <div className="text-[#714B90] text-sm p-2">{chaptersError}</div>
                            ) : (
                                chapters.map((chapter: { number: string, title: string }) => (
                                    <button
                                        key={`${chapter.number}-${chapter.title}`}
                                        onClick={() => setSelectedChapter(chapter)}
                                        className={`w-full flex items-center text-left p-2 rounded-lg text-sm transition-colors ${chapter === selectedChapter
                                            ? 'bg-[#f4f5fc] text-[#714b90]'
                                            : 'text-gray-700 hover:bg-gray-100'
                                            }`}
                                    >
                                        <span className={`inline-block min-w-[1.8rem] text-center px-2 py-0.5 rounded font-semibold mr-2 transition-all ${chapter === selectedChapter
                                            ? 'bg-[#f4f5fc] text-[#714b90]'
                                            : 'bg-white text-gray-700'
                                            }`}>
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
                            src={FrameBg}
                            alt="Background"
                            fill
                            style={{ objectFit: 'cover' }}
                            className="pointer-events-none select-none"
                            priority
                            sizes="100vw"
                        />
                    </div>
                    <div className={`${callOpen ? 'max-w-3xl' : 'max-w-xl'} relative z-10 ${callOpen ? '' : 'bg-[#F5F6FA] rounded-2xl shadow-lg p-6'} ml-0 md:ml-8`}>
                        {!callOpen && (
                            <>
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">How can I help you,</h1>
                                <p className="text-gray-600 mb-4">
                                    I am Clara, your study assistant. Please select any option to start your preparation for this chapter
                                </p>
                                <div className="mb-5">
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (!selectedSubject) {
                                                alert('Please select a subject before starting the call.');
                                                return;
                                            }
                                            if (!selectedChapter) {
                                                alert('Please select a chapter before starting the call.');
                                                return;
                                            }
                                            setCallOpen(true);
                                            if (room.state === 'disconnected') {
                                                try {
                                                    setConnecting(true);
                                                    // Always force a new session and call the backend
                                                    const details = await fetchConnectionDetailsWithConfig({
                                                        username: profile.first_name,
                                                        board: profile.board,
                                                        grade: profile.grade,
                                                        subject: selectedSubject,
                                                        chapter: selectedChapter?.number ?? '',
                                                        participantIdentity: profile.profile_id,                                                    });
                                                    await room.connect(details.serverUrl, details.participantToken);
                                                    await room.localParticipant.setMicrophoneEnabled(true, undefined, { preConnectBuffer: true });
                                                } catch (e) {
                                                    console.error('connect error', e);
                                                } finally {
                                                    setConnecting(false);
                                                }
                                            }
                                            setSelectedThreadId(null);
                                            setThreadHistory([]);
                                            setShowContinueButton(false);
                                            setCallOpen(true);
                                        }}
                                        className="bg-[#714B90] hover:bg-[#5a3a73] text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors shadow-md hover:shadow-lg"
                                    >
                                        {connecting ? 'Connecting…' : 'Start Call'}
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {studyOptions.map((option, index) => (
                                        <div key={index} className="bg-white rounded-xl p-2 cursor-pointer hover:shadow-md transition-shadow flex flex-col items-center justify-between h-full">
                                            <div className="mb-2 flex items-center justify-center w-full">
                                                <Image src={option.img} alt={option.title + ' image'} width={80} height={80} className="w-20 h-20 object-contain" />
                                            </div>
                                            <h3 className="font-semibold text-gray-700 mb-1 text-sm">
                                                {option.title}
                                            </h3>
                                            <p className="text-gray-500 text-xs line-clamp-3">
                                                {option.description}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {callOpen && (
                            <RoomContext.Provider value={room}>
                                <div className="mb-2 flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-semibold text-[#714B90]">Ask Questions</div>
                                        <div className="text-xs text-gray-500">
                                            {showContinueButton ? 'Review your previous conversation' : 'Start by asking questions for this chapter'}
                                        </div>
                                    </div>
                                </div>
                                <div className="relative overflow-hidden pb-3">
                                    <RoomAudioRenderer />
                                    <StartAudio label="" />
                                    <div className="relative max-w-3xl pr-2 ml-0 md:ml-8">
                                        <ClassroomMessages
                                            loading={(!firstMessageArrived) && (loading || connecting)}
                                            onFirstMessage={() => setFirstMessageArrived(true)}
                                            historyMessages={threadHistory} // Always pass, even when showContinueButton is false
                                        />
                                    </div>
                                </div>
                                <div className="ml-0 md:ml-8 max-w-3xl">
                                    {showContinueButton ? (
                                        <button
                                            onClick={async () => {
                                                setShowContinueButton(false);
                                                // threadHistory remains in state, so history stays visible
                                                if (room.state === 'disconnected') {
                                                    try {
                                                        setConnecting(true);
                                                        const config: any = {
                                                            username: profile.first_name,
                                                            board: profile.board,
                                                            grade: profile.grade,
                                                            subject: selectedSubject,
                                                            chapter: selectedChapter?.number ?? '',
                                                            participantIdentity: profile.profile_id,
                                                            thread: selectedThreadId,
                                                        };
                                                        const details = await fetchConnectionDetailsWithConfig(config);
                                                        await room.connect(details.serverUrl, details.participantToken);
                                                        await room.localParticipant.setMicrophoneEnabled(true, undefined, { preConnectBuffer: true });
                                                    } catch (e) {
                                                        console.error('connect error', e);
                                                    } finally {
                                                        setConnecting(false);
                                                    }
                                                }
                                            }}
                                            disabled={connecting}
                                            className="w-full bg-[#714B90] hover:bg-[#5a3a73] text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors shadow-md hover:shadow-lg disabled:opacity-50"
                                        >
                                            {connecting ? 'Connecting...' : 'Continue Conversation'}
                                        </button>
                                    ) : (
                                        <ClassroomControlBar setCallOpen={setCallOpen} />
                                    )}
                                </div>
                            </RoomContext.Provider>
                        )}
                    </div>
                </div>

                {/* Activity History Sidebar */}
                <div className="w-72 bg-gray-50 min-h-full border-r border-l border-gray-300 p-4">
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-2">Activity History</h3>
                        <button className="bg-[#714B90] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#5a3a73] transition-colors mb-4">
                            + New Conversation
                        </button>
                        <div className="space-y-4 h-[calc(100vh-180px)] overflow-y-auto pr-2">
                            {threadsLoading ? (
                                <div className="text-gray-500 text-xs">Loading...</div>
                            ) : threadsError ? (
                                <div className="text-[#714B90] text-xs">{threadsError}</div>
                            ) : threads.length === 0 ? (
                                <div className="text-gray-500 text-xs">No history found.</div>
                            ) : (
                                threads.map((threadId, index) => {
                                    return (
                                        <button
                                            key={threadId || index}
                                            onClick={() => fetchThreadById(threadId)}
                                            disabled={loadingThread}
                                            className="w-full pb-3 border-b border-gray-100 last:border-b-0 text-left hover:bg-gray-100 px-2 py-2 rounded transition-colors"
                                        >
                                            <h4 className="text-sm font-medium text-gray-900 mb-1 truncate">
                                                Thread: {threadId}
                                            </h4>
                                            <span className="text-xs text-[#714B90]">Click to view</span>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default withProtectedRoute(Classroom);

function ClassroomMessages({ onFirstMessage, historyMessages = [] }: {
    loading?: boolean,
    onFirstMessage?: () => void,
    historyMessages?: any[]
}) {
    const { messages } = useChatAndTranscription();
    const room = useRoomContext();
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const firstMessageShown = React.useRef(false);

    // Combine history messages with live messages
    const allMessages = React.useMemo(() => {
        const historyConverted = historyMessages.map((msg, idx) => ({
            id: `history-${idx}`,
            from: { isLocal: msg.role === 'user' },
            timestamp: new Date(msg.timestamp).getTime(),
            message: msg.message
        }));
        return [...historyConverted, ...messages];
    }, [historyMessages, messages]);

    React.useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        el.scrollTop = el.scrollHeight;
    }, [allMessages]);

    useEffect(() => {
        if (!firstMessageShown.current && messages.length > 0) {
            firstMessageShown.current = true;
            onFirstMessage?.();
        }
    }, [messages, onFirstMessage]);

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
        );
    }

    return (
        <div ref={containerRef} className="space-y-3 h-[65vh] overflow-y-auto pr-2">
            {allMessages.map((m) => {
                // Fix: Only check identity if it exists on both sides
                let isLocal = false;
                if (m.from) {
                    if (m.from.isLocal === true) {
                        isLocal = true;
                    } else if (
                        'identity' in m.from &&
                        room.localParticipant &&
                        'identity' in room.localParticipant &&
                        m.from.identity === room.localParticipant.identity
                    ) {
                        isLocal = true;
                    }
                }
                const ts = new Date(m.timestamp || Date.now());
                const timeStr = ts.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                return (
                    <div key={m.id} className={`flex ${isLocal ? 'justify-end' : 'justify-start'}`}>
                        <div className={`${isLocal ? 'bg-[#714B90] text-white rounded-tr-sm' : 'bg-white text-gray-800 rounded-tl-sm shadow'} rounded-2xl px-4 py-2 max-w-[80%] text-[13px] leading-relaxed`}>
                            <div className="whitespace-pre-wrap break-words"><ReactMarkdown>{m.message}</ReactMarkdown></div>
                            <div className={`${isLocal ? 'text-white/70' : 'text-gray-500'} text-[10px] mt-1 text-right`}>{timeStr}</div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function ClassroomControlBar({ setCallOpen }: { setCallOpen: (open: boolean) => void }) {
    // Force all controls to be visible
    const visibleControls = {
        microphone: true,
        camera: true,
        screenShare: true,
        chat: true,
        leave: true,
    };
    const {
        cameraToggle,
        microphoneToggle,
        screenShareToggle,
        handleDisconnect,
    } = useAgentControlBar({});

    const [message, setMessage] = React.useState('');
    const room = React.useContext(RoomContext) as Room;
    const chat = useChat();
    const { localParticipant } = useLocalParticipant();
    const canSend = room?.state === 'connected';

    // Track video state
    const cameraTrack = localParticipant?.getTrackPublication(Track.Source.Camera);
    const isCameraEnabled = cameraTrack?.track && !cameraTrack?.isMuted;

    async function sendMessage() {
        if (!canSend || !message.trim()) return;
        try {
            await chat.send(message);
            setMessage('');
        } catch (e) {
            console.error('send message error', e);
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
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage();
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
                                            ? 'bg-[#714B90] text-white hover:bg-[#5a3a73]'
                                            : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                                            } ${microphoneToggle.pending ? 'opacity-60 cursor-wait' : ''}`}
                                    >
                                        {microphoneToggle.pending ? (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : microphoneToggle.enabled ? (
                                            <Mic className="w-4 h-4" />
                                        ) : (
                                            <MicOff className="w-4 h-4" />
                                        )}
                                        <span className="hidden sm:inline">
                                            {microphoneToggle.enabled ? 'Mic On' : 'Mic Off'}
                                        </span>
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
                                            ? 'bg-[#714B90] text-white hover:bg-[#5a3a73]'
                                            : 'bg-gray-600 text-white hover:bg-gray-700'
                                            } ${cameraToggle.pending ? 'opacity-60 cursor-wait' : ''}`}
                                    >
                                        {cameraToggle.pending ? (
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : cameraToggle.enabled ? (
                                            <Video className="w-4 h-4" />
                                        ) : (
                                            <VideoOff className="w-4 h-4" />
                                        )}
                                        <span className="hidden sm:inline">
                                            {cameraToggle.enabled ? 'Video On' : 'Video Off'}
                                        </span>
                                    </button>
                                </div>
                            )}
                            {/* Screen Share Control */}
                            {visibleControls.screenShare && (
                                <button
                                    onClick={() => screenShareToggle.toggle()}
                                    disabled={screenShareToggle.pending}
                                    className={`relative inline-flex items-center justify-center gap-1 rounded-xl px-3 py-2 text-sm font-medium transition-all shadow-md hover:shadow-lg active:scale-95 ${screenShareToggle.enabled
                                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        } ${screenShareToggle.pending ? 'opacity-60 cursor-wait' : ''}`}
                                >
                                    {screenShareToggle.pending ? (
                                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <MonitorUp className="w-4 h-4" />
                                    )}
                                    <span className="hidden sm:inline">
                                        {screenShareToggle.enabled ? 'Stop Share' : 'Share Screen'}
                                    </span>
                                </button>
                            )}
                        </div>
                        {/* Right Side Controls */}
                        <div className="flex items-center gap-1">
                            {/* End Call */}
                            {visibleControls.leave && (
                                <button
                                    onClick={() => { handleDisconnect(); setCallOpen(false); }}
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
    );
}

function DraggableVideoPreviewer({ children }: { children: React.ReactNode }) {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const previewRef = useRef<HTMLDivElement>(null);

    // Prevent page scroll when open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = '';
        };
    }, []);

    // Default position: above input, right side
    useEffect(() => {
        if (previewRef.current) {
            const input = document.querySelector('input[placeholder="Type your message..."]');
            if (input) {
                const inputRect = input.getBoundingClientRect();
                setPosition({
                    x: inputRect.right - 120, // moved more right (was -160)
                    y: inputRect.top - 160,   // moved more upward (was -120)
                });
            } else {
                setPosition({ x: window.innerWidth - 140, y: window.innerHeight - 260 }); // fallback, more right/up
            }
        }
    }, []);

    const onMouseDown = (e: React.MouseEvent) => {
        setDragging(true);
        setOffset({
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        });
    };
    const onMouseUp = () => setDragging(false);
    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (dragging) {
                setPosition({
                    x: e.clientX - offset.x,
                    y: e.clientY - offset.y,
                });
            }
        };

        if (dragging) {
            window.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onMouseUp);
        } else {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [dragging, offset]);

    return (
        <div
            ref={previewRef}
            style={{
                position: 'fixed',
                left: position.x,
                top: position.y,
                width: 160,
                height: 120,
                zIndex: 9999,
                cursor: dragging ? 'grabbing' : 'grab',
                boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                borderRadius: 12,
                background: '#222',
                overflow: 'hidden',
                userSelect: 'none',
            }}
            onMouseDown={onMouseDown}
        >
            {children}
        </div>
    );
}