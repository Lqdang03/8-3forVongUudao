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
    const [allWishesPool, setAllWishesPool] = useState<any[]>([])
    const [decoItems, setDecoItems] = useState<any[]>([])
    const [showWelcome, setShowWelcome] = useState(true)

    const [isMuted, setIsMuted] = useState(false)
    const [currentSongIndex, setCurrentSongIndex] = useState(0)
    const [showPlaylist, setShowPlaylist] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    // store timeouts keyed by wish.id (browser setTimeout returns number)
    const timeouts = useRef<Record<string, number>>({})

    // Ref để tuần tự dùng pool (chống trùng nội dung)
    const poolIndexRef = useRef(0)

    // Tunable params
    const MAX_VISIBLE = 6               // số card hiển thị tối đa cùng lúc (tune)
    const CARD_MIN_PX = 320             // ước lượng width tối thiểu card để tính khoảng cách
    const CARD_LIFETIME_MS = 20000      // thời gian bay trước khi expired
    const SPAWN_INTERVAL_MS = 4500      // interval spawn replay
    const DECOR_INTERVAL_MS = 2500

    // --- PARALLAX ---
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

    // utility: shuffle array (immutable)
    const shuffleArray = (array: any[]) => {
        const newArr = [...array]
        for (let i = newArr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1))
            ;[newArr[i], newArr[j]] = [newArr[j], newArr[i]]
        }
        return newArr
    }

    // getSafeX: compute a safe startX (vw) that avoids collisions with existing visible cards
    const getSafeX = (existing: Wish[], cardMinPx = CARD_MIN_PX) => {
        // if window not available (shouldn't happen in 'use client'), fallback
        if (typeof window === 'undefined') {
            return Math.random() * (78 - 8) + 8
        }

        // convert px -> vw
        const pxToVw = (px: number) => (px / window.innerWidth) * 100
        const cardWidthVW = pxToVw(cardMinPx)
        const BUFFER_VW = 6 // tweak: extra safe buffer beyond card width
        const MIN_DISTANCE_VW = Math.max(8, cardWidthVW + BUFFER_VW)

        const SAFE_START = 8
        const SAFE_END = 78
        let tries = 0
        const MAX_TRIES = 50

        while (tries < MAX_TRIES) {
            const x = Math.random() * (SAFE_END - SAFE_START) + SAFE_START
            const collide = existing.some(w => !w.isExpired && Math.abs(w.startX - x) < MIN_DISTANCE_VW)
            if (!collide) return x
            tries++
        }

        // fallback if can't find non-colliding spot
        return Math.random() * (SAFE_END - SAFE_START) + SAFE_START
    }

    const createFlyingWish = (rawWish: any, existing: Wish[]) => {
        return {
            ...rawWish,
            id: `${rawWish.id ?? 'w'}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
            startX: getSafeX(existing),
            isExpired: false,
        } as Wish
    }

    /* =========================
       1. Audio setup & fetch initial wishes
       - audio recreated when currentSongIndex or isMuted changes
    ========================== */
    useEffect(() => {
        // cleanup existing audio
        if (audioRef.current) {
            try { audioRef.current.pause() } catch { }
            audioRef.current = null
        }

        const audio = new Audio(PLAYLIST[currentSongIndex].url)
        audio.loop = true
        audio.volume = 0.4
        audioRef.current = audio

        // play on first user interaction if not muted
        const playAudio = () => { if (!isMuted) audio.play().catch(() => { }) }
        window.addEventListener('click', playAudio, { once: true })

        // try auto-play when switching song and not muted
        if (!isMuted) {
            audio.play().catch(() => { })
        } else {
            audio.muted = true
        }

        // fetch initial wishes once
        const fetchInitial = async () => {
            try {
                const { data } = await supabase.from('wishes').select('*').order('created_at', { ascending: false }).limit(200)
                if (data && data.length > 0) {
                    setAllWishesPool(shuffleArray(data))
                }
            } catch (err) {
                console.error('fetch wishes error', err)
            }
        }
        fetchInitial()

        return () => {
            window.removeEventListener('click', playAudio)
            try { audio.pause() } catch { }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentSongIndex, isMuted])

    /* =========================
       2. Loop (spawn) & realtime subscription
       - Use prev state inside setWishes to avoid stale closures
       - One timeout per created wish, stored and cleaned up
    ========================== */
    useEffect(() => {
        // decorative falling items
        const decoInterval = setInterval(() => {
            const newItem = {
                id: Math.random().toString(36).slice(2, 9),
                char: DECORATIONS[Math.floor(Math.random() * DECORATIONS.length)],
                left: `${Math.random() * 100}%`,
                size: Math.random() * 15 + 15,
                duration: Math.random() * 25 + 20,
            }
            setDecoItems(prev => [...prev.slice(-15), newItem])
        }, DECOR_INTERVAL_MS)

        // spawn interval: create one flying wish (uses prev inside setWishes)
        const spawnInterval = setInterval(() => {
            if (allWishesPool.length === 0) return

            const wishData = allWishesPool[poolIndexRef.current]

            setWishes(prev => {
                // create based on the latest prev so getSafeX sees current positions
                const flying = createFlyingWish(wishData, prev)

                // push and keep only last MAX_VISIBLE
                const updated = [...prev, flying].slice(-MAX_VISIBLE)

                // set single timeout to mark expired
                const t = window.setTimeout(() => {
                    setWishes(p => p.map(w => (w.id === flying.id ? { ...w, isExpired: true } : w)))
                    delete timeouts.current[flying.id]
                }, CARD_LIFETIME_MS)

                timeouts.current[flying.id] = t

                return updated
            })

            poolIndexRef.current = (poolIndexRef.current + 1) % allWishesPool.length
        }, SPAWN_INTERVAL_MS)

        // realtime: listen to new inserts from supabase
        const channel = supabase
            .channel('realtime-wishes')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'wishes' }, (payload) => {
                const raw = payload.new as any
                // push to pool
                setAllWishesPool(prev => [raw, ...prev])

                // create a flying wish using prev snapshot
                setWishes(prev => {
                    const newWish = createFlyingWish(raw, prev)
                    const updated = [...prev, newWish].slice(-MAX_VISIBLE)
                    // single timeout
                    const t = window.setTimeout(() => {
                        setWishes(p => p.map(w => (w.id === newWish.id ? { ...w, isExpired: true } : w)))
                        delete timeouts.current[newWish.id]
                    }, CARD_LIFETIME_MS)
                    timeouts.current[newWish.id] = t
                    return updated
                })
            })
            .subscribe()

        return () => {
            clearInterval(decoInterval)
            clearInterval(spawnInterval)
            try { supabase.removeChannel(channel) } catch { /* ignore */ }
            // clear any remaining timeouts
            Object.values(timeouts.current).forEach(t => window.clearTimeout(t))
            timeouts.current = {}
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allWishesPool.length]) // re-run if pool length changes significantly

    // helpers for audio controls
    const changeSong = (index: number) => {
        if (index === currentSongIndex) return
        setCurrentSongIndex(index)
        setShowPlaylist(false)
    }

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation()
        if (audioRef.current) {
            audioRef.current.muted = !audioRef.current.muted
        }
        setIsMuted(prev => !prev)
    }

    // animation variants
    const variants = {
        initial: (wish: Wish) => ({
            opacity: 0, scale: 0.8,
            x: `${wish.startX}vw`,
            y: '110vh',
            rotate: Math.random() * 12 - 6
        }),
        active: () => ({
            opacity: 1, scale: 1,
            y: '-40vh',
            rotate: 0
        }),
        expired: () => ({
            opacity: 0, scale: 0.5,
            y: '-120vh',
            transition: { duration: 3 }
        }),
    }

    return (
        <div
            onMouseMove={handleMouseMove}
            className="h-screen w-full overflow-hidden relative bg-gradient-to-br from-rose-200 via-pink-300 to-fuchsia-400 font-sans"
            style={{ perspective: '1200px' }}
        >
            <motion.div style={{ x: bgMoveX, y: bgMoveY }} className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.4),_transparent_60%)] pointer-events-none" />

            {/* WELCOME POPUP */}
            <AnimatePresence>
                {showWelcome && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white/90 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center relative border border-white">
                            <button onClick={() => setShowWelcome(false)} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-pink-500 transition-colors"><X size={20} /></button>
                            <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6"><Sparkles className="text-pink-500 animate-pulse" size={40} /></div>
                            <h2 className="text-xl font-black text-slate-800 mb-4 tracking-tight uppercase leading-tight">Chào tất cả ae trong Vong Ưu Đảo và lãng khách đến thăm ✨</h2>
                            <p className="text-slate-600 leading-relaxed mb-8 text-sm">
                                Lời đầu tiên mình cảm ơn mn đã dành thời gian ghé qua trang web <span className="font-bold text-pink-500 italic"> Lỏ </span> này của bọn mình. Mong mn có một ngày thật nhiều niềm vui sau khi xem lời chúc nhé! 🌸
                            </p>
                            <button onClick={() => setShowWelcome(false)} className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-black rounded-2xl shadow-lg active:scale-95 transition-all">OKIIIII LUÔN ❤️</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MUSIC CONTROLS */}
            <div className="fixed bottom-6 right-6 z-[110] flex flex-col items-end gap-2">
                <AnimatePresence>
                    {showPlaylist && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="bg-white/90 backdrop-blur-md p-2 rounded-2xl shadow-xl mb-2 min-w-[160px] border border-pink-100 overflow-hidden">
                            {PLAYLIST.map((song, index) => (
                                <button key={index} onClick={() => changeSong(index)} className={`w-full text-left px-4 py-2 rounded-xl text-xs font-bold transition-colors ${currentSongIndex === index ? 'bg-pink-500 text-white' : 'text-pink-600 hover:bg-pink-50'}`}>{currentSongIndex === index && "• "} {song.name}</button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
                <div className="flex gap-2">
                    <button onClick={() => setShowPlaylist(!showPlaylist)} className="bg-white/80 p-3 rounded-full shadow-lg text-pink-600 flex items-center gap-2 hover:scale-110 transition-transform"><Music size={20} /><ChevronUp size={16} className={showPlaylist ? 'rotate-180' : ''} /></button>
                    <button onClick={toggleMute} className="bg-white/80 p-3 rounded-full shadow-lg text-pink-600 hover:scale-110 transition-transform">{isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}</button>
                </div>
            </div>

            {/* DECOR FALLING */}
            <AnimatePresence>
                {decoItems.map((item) => (
                    <motion.span key={item.id} style={{ x: midMoveX, y: midMoveY }} initial={{ y: -50, opacity: 0 }} animate={{ y: '110vh', opacity: [0, 0.4, 0], rotate: 360 }} transition={{ duration: item.duration, ease: 'linear' }} className="absolute pointer-events-none z-10">
                        <span style={{ marginLeft: item.left, fontSize: item.size }}>{item.char}</span>
                    </motion.span>
                ))}
            </AnimatePresence>

            {/* WISHES LAYER */}
            <motion.div style={{ x: useTransform(smoothX, [0, 2000], [10, -10]), y: useTransform(smoothY, [0, 1000], [10, -10]) }} className="relative w-full h-full z-20">
                <AnimatePresence>
                    {wishes.map((wish, index) => {
                        const isSpecific = wish.recipient_name && wish.recipient_name.trim() !== ''
                        return (
                            <motion.div
                                key={wish.id}
                                custom={wish}
                                variants={variants}
                                initial="initial"
                                animate={wish.isExpired ? 'expired' : 'active'}
                                transition={{
                                    y: { duration: 25, ease: 'linear' },
                                    scale: { type: 'spring', stiffness: 40, damping: 20 },
                                    opacity: { duration: 1.5 }
                                }}
                                style={{
                                    backgroundColor: `${wish.style_id}${wish.isExpired ? '44' : 'dd'}`,
                                    zIndex: wish.isExpired ? 1 : index + 10,
                                    position: 'absolute'
                                }}
                                className={`px-6 py-8 rounded-[2.5rem] shadow-2xl text-white min-w-[280px] max-w-[420px] backdrop-blur-xl flex flex-col border border-white/40 ${isSpecific && !wish.isExpired ? 'ring-4 ring-white/30 shadow-[0_0_50px_rgba(255,255,255,0.2)]' : ''}`}
                            >
                                <div className="w-full flex flex-col items-center mb-4">
                                    <div className="w-14 h-14 rounded-full bg-white/20 mb-3 flex items-center justify-center text-3xl shadow-inner">
                                        {isSpecific ? '💝' : '💌'}
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-2xl font-black drop-shadow-sm uppercase leading-tight tracking-tight">{wish.name}</h3>
                                        <div className="flex items-center justify-center gap-2 mt-1 opacity-80 text-[10px] font-bold uppercase tracking-widest italic"><Send size={10} /> gửi tới</div>
                                        <div className="mt-2 bg-white/10 px-4 py-1.5 rounded-full border border-white/20 inline-flex items-center gap-2">
                                            <span className="text-lg font-black text-white">{isSpecific ? wish.recipient_name : 'Tất cả mọi người 🌸'}</span>
                                            {isSpecific && wish.gift_icon && <span className="text-xl animate-bounce drop-shadow-md">{wish.gift_icon}</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="w-16 h-0.5 bg-white/30 mx-auto mb-4 rounded-full"></div>
                                <p className="italic leading-snug font-serif text-center text-lg drop-shadow-sm px-2">"{wish.message}"</p>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </motion.div>

            {/* TITLE & NAVIGATION */}
            <div className="absolute top-8 w-full text-center text-white font-black text-3xl md:text-5xl drop-shadow-2xl z-30 select-none pointer-events-none tracking-tighter">🌷 HAPPY WOMEN'S DAY 8/3 🌷</div>
            <div className="absolute top-24 w-full flex justify-center z-50">
                <Link href="/tree" className="bg-white/80 backdrop-blur-md text-pink-600 font-black px-8 py-3 rounded-full shadow-2xl hover:scale-110 hover:bg-white transition-all text-sm uppercase tracking-widest border border-white/50">🌳 Khám phá Vườn hoa</Link>
            </div>
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_200px_rgba(255,0,128,0.3)] z-40"></div>
        </div>
    )
}