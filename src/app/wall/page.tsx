'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'
import Link from 'next/link'
import { Volume2, VolumeX, Music, ChevronUp } from 'lucide-react'

const DECORATIONS = ['🌸', '🌷', '💖', '✨']

const PLAYLIST = [
    { name: 'Moonlight Piano', url: '/audio/moonlight.mp3' },
    { name: 'Chill Lofi', url: '/audio/her.mp3' },
    { name: 'Romantic Garden', url: '/audio/rock.mp3' },
]

type Wish = {
    id: string
    name: string
    message: string
    style_id: string
    startX: number
    isExpired: boolean
}

export default function WallMode() {
    const [wishes, setWishes] = useState<Wish[]>([])
    const [decoItems, setDecoItems] = useState<any[]>([])
    
    // Logic Nhạc
    const [isMuted, setIsMuted] = useState(false)
    const [currentSongIndex, setCurrentSongIndex] = useState(0)
    const [showPlaylist, setShowPlaylist] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const timeouts = useRef<Record<string, NodeJS.Timeout>>({})

    // --- LOGIC PARALLAX (Chuột di chuyển) ---
    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)

    // Tạo độ nhún lò xo để chuyển động chuột mượt mà, không bị giật
    const springConfig = { damping: 50, stiffness: 300 }
    const smoothX = useSpring(mouseX, springConfig)
    const smoothY = useSpring(mouseY, springConfig)

    // Lớp nền di chuyển ít (-20px đến 20px)
    const bgMoveX = useTransform(smoothX, [0, 2000], [20, -20])
    const bgMoveY = useTransform(smoothY, [0, 1000], [20, -20])
    
    // Lớp hoa/thẻ di chuyển nhiều hơn (-45px đến 45px) để tạo chiều sâu
    const midMoveX = useTransform(smoothX, [0, 2000], [45, -45])
    const midMoveY = useTransform(smoothY, [0, 1000], [45, -45])

    const handleMouseMove = (e: React.MouseEvent) => {
        mouseX.set(e.clientX)
        mouseY.set(e.clientY)
    }

    /* =========================
       1. Music Logic
    ========================== */
    useEffect(() => {
        const audio = new Audio(PLAYLIST[currentSongIndex].url)
        audio.loop = true
        audio.volume = 0.4
        audioRef.current = audio

        const playAudio = () => {
            audio.play().catch(() => {})
        }
        window.addEventListener('click', playAudio, { once: true })

        return () => {
            audio.pause()
            window.removeEventListener('click', playAudio)
        }
    }, [currentSongIndex])

    const changeSong = (index: number) => {
        if (audioRef.current) {
            audioRef.current.pause()
            setCurrentSongIndex(index)
            setShowPlaylist(false)
        }
    }

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (audioRef.current) {
            audioRef.current.muted = !isMuted
            setIsMuted(!isMuted)
        }
    }

    /* =========================
       2. Realtime & Decorations
    ========================== */
    useEffect(() => {
        const interval = setInterval(() => {
            const newItem = {
                id: Math.random(),
                char: DECORATIONS[Math.floor(Math.random() * DECORATIONS.length)],
                left: `${Math.random() * 100}%`,
                size: Math.random() * 15 + 15,
                duration: Math.random() * 25 + 20,
            }
            setDecoItems(prev => [...prev.slice(-15), newItem])
        }, 2500)

        const channel = supabase
            .channel('realtime-wishes')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'wishes' }, (payload) => {
                const raw = payload.new as any
                const newWish: Wish = { ...raw, startX: Math.random() * 70 + 15, isExpired: false }
                setWishes(prev => [...prev.slice(-20), newWish])
                const timeout = setTimeout(() => {
                    setWishes(prev => prev.map(w => w.id === raw.id ? { ...w, isExpired: true } : w))
                }, 15000)
                timeouts.current[raw.id] = timeout
            })
            .subscribe()

        return () => {
            clearInterval(interval)
            supabase.removeChannel(channel)
            Object.values(timeouts.current).forEach(clearTimeout)
        }
    }, [])

    const variants = {
        initial: (wish: Wish) => ({ opacity: 0, scale: 0.9, x: `${wish.startX}vw`, y: '110vh' }),
        active: () => ({ opacity: 1, scale: 1, y: '-20vh' }),
        expired: () => ({ opacity: 0.6, scale: 0.85, y: ['-30vh', '120vh'] }),
    }

    return (
        <div 
            onMouseMove={handleMouseMove}
            className="h-screen w-full overflow-hidden relative bg-gradient-to-br from-rose-200 via-pink-300 to-fuchsia-400"
            style={{ perspective: '1200px' }} // Quan trọng để hiệu ứng 3D đẹp hơn
        >
            {/* Lớp 1: Glow nền Parallax */}
            <motion.div 
                style={{ x: bgMoveX, y: bgMoveY }}
                className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.4),_transparent_60%)] pointer-events-none"
            />

            {/* Music Controls */}
            <div className="fixed bottom-6 right-6 z-[110] flex flex-col items-end gap-2">
                <AnimatePresence>
                    {showPlaylist && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                            className="bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-xl mb-2 min-w-[160px] border border-pink-100"
                        >
                            {PLAYLIST.map((song, index) => (
                                <button
                                    key={index}
                                    onClick={() => changeSong(index)}
                                    className={`w-full text-left px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                                        currentSongIndex === index ? 'bg-pink-500 text-white' : 'text-pink-600 hover:bg-pink-50'
                                    }`}
                                >
                                    {currentSongIndex === index && "• "} {song.name}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex gap-2">
                    <button onClick={() => setShowPlaylist(!showPlaylist)} className="bg-white/80 p-3 rounded-full shadow-lg text-pink-600 hover:scale-110 transition-transform flex items-center gap-2">
                        <Music size={20} />
                        <ChevronUp size={16} className={showPlaylist ? 'rotate-180' : ''} />
                    </button>
                    <button onClick={toggleMute} className="bg-white/80 p-3 rounded-full shadow-lg text-pink-600 hover:scale-110 transition-transform">
                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                </div>
            </div>

            {/* Lớp 2: Hoa rơi Parallax */}
            <AnimatePresence>
                {decoItems.map((item) => (
                    <motion.span
                        key={item.id}
                        style={{ x: midMoveX, y: midMoveY }} // Chuyển động theo chuột
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: '110vh', opacity: [0, 0.4, 0], rotate: 360 }}
                        transition={{ duration: item.duration, ease: 'linear' }}
                        className="absolute pointer-events-none z-10"
                    >
                        <span style={{ marginLeft: item.left, fontSize: item.size }}>{item.char}</span>
                    </motion.span>
                ))}
            </AnimatePresence>

            {/* Lớp 3: Wishes Parallax */}
            <motion.div 
                style={{ x: useTransform(smoothX, [0, 2000], [10, -10]), y: useTransform(smoothY, [0, 1000], [10, -10]) }}
                className="relative w-full h-full z-20"
            >
                <AnimatePresence>
                    {wishes.map((wish, index) => {
                        const isLatest = index === wishes.length - 1 && !wish.isExpired
                        return (
                            <motion.div
                                key={wish.id}
                                custom={wish}
                                variants={variants}
                                initial="initial"
                                animate={wish.isExpired ? 'expired' : 'active'}
                                transition={{
                                    y: { duration: 18, ease: 'linear' },
                                    scale: { type: 'spring', stiffness: 60, damping: 18 },
                                    opacity: { duration: 1 },
                                }}
                                style={{
                                    backgroundColor: `${wish.style_id}${wish.isExpired ? '66' : 'ee'}`,
                                    zIndex: wish.isExpired ? 1 : index + 100,
                                    position: 'absolute',
                                }}
                                className="p-8 rounded-[3.5rem] shadow-[0_0_40px_rgba(255,255,255,0.5)] text-white min-w-[300px] max-w-[420px] backdrop-blur-md flex flex-col items-center text-center border border-white/30"
                            >
                                {isLatest && (
                                    <div className="absolute -top-6 bg-white text-pink-600 text-[11px] font-bold px-4 py-1 rounded-full shadow-md animate-bounce">
                                        🌸 VỪA GỬI 🌸
                                    </div>
                                )}
                                <div className="w-14 h-14 rounded-full bg-white/30 mb-4 flex items-center justify-center text-2xl">
                                    {wish.isExpired ? '📜' : '💌'}
                                </div>
                                <h3 className="font-bold mb-2 tracking-tight text-xl">{wish.name}</h3>
                                <p className="italic leading-relaxed text-lg">"{wish.message}"</p>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </motion.div>

            {/* Lớp cố định: Text & Navigation */}
            <div className="absolute top-10 w-full text-center text-white font-black text-4xl md:text-6xl drop-shadow-lg pointer-events-none z-30 px-4">
                🌷 HAPPY WOMEN'S DAY 8/3 🌷
            </div>
            
            <div className="absolute top-28 w-full flex justify-center z-50">
                <Link href="/tree" className="bg-white/90 backdrop-blur-sm text-pink-600 font-bold px-8 py-4 rounded-full shadow-xl hover:scale-105 transition-all">
                    🌳 Khám phá Vườn hoa
                </Link>
            </div>

            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_250px_rgba(255,0,128,0.4)] z-40"></div>
        </div>
    )
}