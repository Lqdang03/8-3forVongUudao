'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
const DECORATIONS = ['🌸', '🌷', '💖', '✨']

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
    const timeouts = useRef<Record<string, NodeJS.Timeout>>({})

    /* =========================
       1. Background Decoration
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

        return () => clearInterval(interval)
    }, [])

    /* =========================
       2. Realtime Wishes
    ========================== */
    useEffect(() => {
        const channel = supabase
            .channel('realtime-wishes')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'wishes' },
                (payload) => {
                    const raw = payload.new as {
                        id: string
                        name: string
                        message: string
                        style_id: string
                    }

                    const wishId = raw.id

                    const newWish: Wish = {
                        id: raw.id,
                        name: raw.name,
                        message: raw.message,
                        style_id: raw.style_id,
                        startX: Math.random() * 70 + 15,
                        isExpired: false,
                    }
                    setWishes(prev => [...prev.slice(-20), newWish])

                    const timeout = setTimeout(() => {
                        setWishes(prev =>
                            prev.map(w =>
                                w.id === wishId ? { ...w, isExpired: true } : w
                            )
                        )
                    }, 15000)

                    timeouts.current[wishId] = timeout
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
            Object.values(timeouts.current).forEach(clearTimeout)
        }
    }, [])

    /* =========================
       3. Animation Variants
    ========================== */
    const variants = {
        initial: (wish: Wish) => ({
            opacity: 0,
            scale: 0.9,
            x: `${wish.startX}vw`,
            y: '110vh',
        }),

        active: () => ({
            opacity: 1,
            scale: 1,
            y: '-20vh',
        }),

        expired: () => ({
            opacity: 0.6,
            scale: 0.85,
            y: ['-30vh', '120vh'],
        }),
    }

    return (
        <div className="h-screen w-full overflow-hidden relative bg-gradient-to-br from-rose-200 via-pink-300 to-fuchsia-400">

            {/* Glow nền */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.4),_transparent_60%)]"></div>

            {/* Floating decorations */}
            <AnimatePresence>
                {decoItems.map((item) => (
                    <motion.span
                        key={item.id}
                        initial={{ y: -50, opacity: 0 }}
                        animate={{ y: '110vh', opacity: [0, 0.4, 0], rotate: 360 }}
                        transition={{ duration: item.duration, ease: 'linear' }}
                        className="absolute pointer-events-none"
                        style={{ left: item.left, fontSize: item.size }}
                    >
                        {item.char}
                    </motion.span>
                ))}
            </AnimatePresence>

            {/* Wishes */}
            <div className="relative w-full h-full">
                <AnimatePresence>
                    {wishes.map((wish, index) => {
                        const isLatest =
                            index === wishes.length - 1 && !wish.isExpired

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
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute -top-6 bg-white text-pink-600 text-[11px] font-bold px-4 py-1 rounded-full shadow-md"
                                    >
                                        🌸 VỪA GỬI 🌸
                                    </motion.div>
                                )}

                                <div className="w-14 h-14 rounded-full bg-white/30 mb-4 flex items-center justify-center text-2xl">
                                    {wish.isExpired ? '📜' : '💌'}
                                </div>

                                <h3 className="font-bold mb-2 tracking-tight text-xl">
                                    {wish.name}
                                </h3>

                                <p className="italic leading-relaxed text-lg">
                                    "{wish.message}"
                                </p>
                            </motion.div>
                        )
                    })}
                </AnimatePresence>
            </div>

            {/* Tiêu đề 8/3 */}
            <div className="absolute top-10 w-full text-center text-white font-black text-4xl md:text-6xl drop-shadow-lg">
                🌷 HAPPY WOMEN'S DAY 8/3 🌷
            </div>
            <div className="absolute top-28 w-full flex justify-center">
                <Link
                    href="/tree"
                    className="bg-white text-pink-600 font-bold px-6 py-3 rounded-full shadow-lg hover:scale-105 transition-transform duration-300"
                >
                    🌳 Xem Vườn Hoa (Tree Mode)
                </Link>
            </div>
            {/* Vignette nhẹ */}
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_200px_rgba(255,0,128,0.4)]"></div>
        </div>
    )
}