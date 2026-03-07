'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'
import Link from 'next/link'
import { Volume2, VolumeX, Music, ChevronUp, Sparkles, Send, X } from 'lucide-react'

const DECORATIONS = ['🌸', '🌷', '💖', '✨']

const PLAYLIST = [
    { name: 'Moonlight Piano', url: '/audio/moonlight.mp3' },
    { name: 'Chill Lofi', url: '/audio/her.mp3' },
    { name: 'Romantic Garden', url: '/audio/rock.mp3' },
    { name: 'Monoooooo', url: '/audio/chamhoa.mp3' },
]

type Wish = {
    id: string
    name: string
    message: string
    style_id: string
    recipient_name: string | null 
    gift_icon: string | null 
    startX: number
    isExpired: boolean
}

export default function WallMode() {
    const [wishes, setWishes] = useState<Wish[]>([])
    const [decoItems, setDecoItems] = useState<any[]>([])
    // State cho Pop-up chào mừng
    const [showWelcome, setShowWelcome] = useState(true)
    
    const [isMuted, setIsMuted] = useState(false)
    const [currentSongIndex, setCurrentSongIndex] = useState(0)
    const [showPlaylist, setShowPlaylist] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const timeouts = useRef<Record<string, NodeJS.Timeout>>({})

    const mouseX = useMotionValue(0)
    const mouseY = useMotionValue(0)
    const smoothX = useSpring(mouseX, { damping: 50, stiffness: 300 })
    const smoothY = useSpring(mouseY, { damping: 50, stiffness: 300 })

    const bgMoveX = useTransform(smoothX, [0, 2000], [20, -20])
    const bgMoveY = useTransform(smoothY, [0, 1000], [20, -20])
    const midMoveX = useTransform(smoothX, [0, 2000], [45, -45])
    const midMoveY = useTransform(smoothY, [0, 1000], [45, -45])

    const handleMouseMove = (e: React.MouseEvent) => {
        mouseX.set(e.clientX)
        mouseY.set(e.clientY)
    }

    useEffect(() => {
        const audio = new Audio(PLAYLIST[currentSongIndex].url)
        audio.loop = true
        audio.volume = 0.4
        audioRef.current = audio

        const playAudio = () => { audio.play().catch(() => {}) }
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
                const newWish: Wish = { 
                    ...raw, 
                    gift_icon: raw.gift_icon,
                    startX: Math.random() * 70 + 15, 
                    isExpired: false 
                }
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
            className="h-screen w-full overflow-hidden relative bg-gradient-to-br from-rose-200 via-pink-300 to-fuchsia-400 font-sans"
            style={{ perspective: '1200px' }} 
        >
            <motion.div style={{ x: bgMoveX, y: bgMoveY }} className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.4),_transparent_60%)] pointer-events-none" />

            {/* POP-UP CHÀO MỪNG */}
            <AnimatePresence>
                {showWelcome && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white/90 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center relative border border-white"
                        >
                            <button 
                                onClick={() => setShowWelcome(false)}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-pink-500 transition-colors"
                            >
                                <X size={20} />
                            </button>
                            
                            <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Sparkles className="text-pink-500 animate-pulse" size={40} />
                            </div>
                            
                            <h2 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">Chào tất cả con dân của Vong ưu đảo và lãng khách tới chơi ✨</h2>
                            
                            <p className="text-slate-600 leading-relaxed mb-8">
                                Lời đầu tiên mình cảm ơn mn đã dành thời gian ghé qua trang web 
                                <span className="font-bold text-pink-500 italic"> Lỏ </span> 
                                này của chúng tôi. Mong mn có một ngày thật là nhiều niềm vui sau khi xem lời chúc đến từ chúng tôi nhé! 🌸
                            </p>
                            
                            <button 
                                onClick={() => setShowWelcome(false)}
                                className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black rounded-2xl shadow-lg hover:shadow-pink-500/30 transition-all active:scale-95"
                            >
                                OKIIIII LUÔN ❤️
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Music Controls */}
            <div className="fixed bottom-6 right-6 z-[110] flex flex-col items-end gap-2">
                <AnimatePresence>
                    {showPlaylist && (
                        <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-xl mb-2 min-w-[160px] border border-pink-100"
                        >
                            {PLAYLIST.map((song, index) => (
                                <button key={index} onClick={() => changeSong(index)}
                                    className={`w-full text-left px-4 py-2 rounded-xl text-xs font-bold transition-colors ${currentSongIndex === index ? 'bg-pink-500 text-white' : 'text-pink-600 hover:bg-pink-50'}`}
                                >
                                    {currentSongIndex === index && "• "} {song.name}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex gap-2">
                    <button onClick={() => setShowPlaylist(!showPlaylist)} className="bg-white/80 p-3 rounded-full shadow-lg text-pink-600 hover:scale-110 transition-transform flex items-center gap-2">
                        <Music size={20} /> <ChevronUp size={16} className={showPlaylist ? 'rotate-180' : ''} />
                    </button>
                    <button onClick={toggleMute} className="bg-white/80 p-3 rounded-full shadow-lg text-pink-600 hover:scale-110 transition-transform">
                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>
                </div>
            </div>

            {/* Lớp 2: Hoa rơi Parallax */}
            <AnimatePresence>
                {decoItems.map((item) => (
                    <motion.span key={item.id} style={{ x: midMoveX, y: midMoveY }} initial={{ y: -50, opacity: 0 }} animate={{ y: '110vh', opacity: [0, 0.4, 0], rotate: 360 }} transition={{ duration: item.duration, ease: 'linear' }} className="absolute pointer-events-none z-10">
                        <span style={{ marginLeft: item.left, fontSize: item.size }}>{item.char}</span>
                    </motion.span>
                ))}
            </AnimatePresence>

            {/* Lớp 3: Wishes Parallax */}
            <motion.div style={{ x: useTransform(smoothX, [0, 2000], [10, -10]), y: useTransform(smoothY, [0, 1000], [10, -10]) }} className="relative w-full h-full z-20">
                <AnimatePresence>
                    {wishes.map((wish, index) => {
                        const isLatest = index === wishes.length - 1 && !wish.isExpired
                        const isSpecificWish = wish.recipient_name != null && wish.recipient_name.trim() !== ''

                        return (
                            <motion.div
                                key={wish.id} custom={wish} variants={variants} initial="initial" animate={wish.isExpired ? 'expired' : 'active'}
                                transition={{ y: { duration: 18, ease: 'linear' }, scale: { type: 'spring', stiffness: 60, damping: 18 }, opacity: { duration: 1 } }}
                                style={{ backgroundColor: `${wish.style_id}${wish.isExpired ? '66' : 'ee'}`, zIndex: wish.isExpired ? 1 : index + 100, position: 'absolute' }}
                                className={`px-8 pt-8 pb-10 rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.1)] text-white min-w-[340px] max-w-[480px] backdrop-blur-xl flex flex-col border border-white/40 ${
                                    isSpecificWish && !wish.isExpired ? 'ring-[6px] ring-white/50 shadow-[0_0_100px_rgba(255,255,255,0.6)] scale-105' : ''
                                }`}
                            >
                                {isLatest && (
                                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[11px] font-black px-6 py-2 rounded-full shadow-xl flex items-center gap-2 animate-bounce border-2 border-white/50">
                                        <Sparkles size={14}/> MỚI NHẤT
                                    </div>
                                )}
                                
                                <div className="w-16 h-16 rounded-full bg-white/20 mb-3 flex items-center justify-center text-3xl shadow-inner backdrop-blur-md">
                                    {wish.isExpired ? '📜' : (isSpecificWish ? '💝' : '💌')}
                                </div>
                                
                                <div className="text-center">
                                    <h3 className="text-3xl font-black tracking-tight drop-shadow-sm uppercase">
                                        {wish.name}
                                    </h3>
                                    <div className="flex items-center justify-center gap-2 mt-2 opacity-90">
                                        <Send size={14} className={isSpecificWish ? 'text-yellow-200' : 'text-white/70'} />
                                        <span className="text-sm font-medium uppercase tracking-widest italic">
                                            gửi lời chúc tới
                                        </span>
                                    </div>
                                    
                                    <div className="mt-2 bg-white/20 px-6 py-2 rounded-full border border-white/30 inline-flex items-center gap-3 shadow-lg">
                                        <span className="text-2xl font-black text-white drop-shadow-md">
                                            {isSpecificWish ? wish.recipient_name : 'Tất cả chị em phụ nữ 🌸'}
                                        </span>
                                        {isSpecificWish && wish.gift_icon && (
                                            <span className="text-3xl animate-bounce drop-shadow-md">
                                                {wish.gift_icon}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="w-24 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto mb-6 mt-4"></div>

                                <p className={`italic leading-relaxed font-serif text-center ${isSpecificWish ? 'text-2xl' : 'text-xl'}`}>
                                    "{wish.message}"
                                </p>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </motion.div>

            {/* Tiêu đề 8/3 */}
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