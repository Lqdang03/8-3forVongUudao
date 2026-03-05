'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

const THEMES = [
    { id: '#ec4899', name: 'Hồng Kẹo' },
    { id: '#3b82f6', name: 'Xanh Biển' },
    { id: '#8b5cf6', name: 'Tím Mộng' },
    { id: '#f59e0b', name: 'Cam Nắng' },
    { id: '#10b981', name: 'Lá Xanh' },
]

const FLOWER_MAP: Record<string, string> = {
    '#ec4899': '🌸',
    '#3b82f6': '🪻',
    '#8b5cf6': '🌺',
    '#f59e0b': '🌻',
    '#10b981': '🌷',
}

const SONGS = ['/audio/moonlight.mp3', '/audio/rock.mp3'];

export default function FlowerMode() {
    const [grouped, setGrouped] = useState<Record<string, any[]>>({})
    const [selectedFlower, setSelectedFlower] = useState<any>(null)
    const [mounted, setMounted] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    const getFlower = (color: string) => FLOWER_MAP[color?.toLowerCase()] || '💐'

    const handleCloseCard = () => {
        setSelectedFlower(null)
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.currentTime = 0
        }
    }

    const handleFlowerClick = (flower: any) => {
        setSelectedFlower(flower)
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.currentTime = 0
        }
        const audio = new Audio(SONGS[Math.floor(Math.random() * SONGS.length)])
        audio.volume = 0.6
        audioRef.current = audio
        audio.play().catch(() => {})
    }

    useEffect(() => {
        setMounted(true)
        const fetchWishes = async () => {
            const { data } = await supabase.from('wishes').select('*').order('created_at', { ascending: false })
            if (data) {
                const result: Record<string, any[]> = {}
                THEMES.forEach(t => result[t.id] = data.filter(w => w.style_id === t.id))
                setGrouped(result)
            }
        }
        fetchWishes()
        return () => { if (audioRef.current) audioRef.current.pause() }
    }, [])

    if (!mounted) return null

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-rose-100 via-pink-100 to-teal-50 flex items-center justify-center overflow-hidden">
            
            <Link href="/wall" className="absolute top-6 left-6 z-50 text-pink-600 bg-white/80 border border-pink-200 px-5 py-2 rounded-full shadow-lg hover:bg-white transition-all flex items-center gap-2">
                <span>←</span> Wall
            </Link>

            {/* --- GIAO DIỆN MÁY TÍNH (GIỮ NGUYÊN 3 CỘT) --- */}
            <div className="hidden md:grid w-full max-w-6xl h-[80vh] grid-cols-3 grid-rows-3 place-items-center z-10">
                {THEMES.map((theme, idx) => {
                    const gridPos = ["col-start-1 row-start-1", "col-start-3 row-start-1", "col-start-2 row-start-2", "col-start-1 row-start-3", "col-start-3 row-start-3"][idx];
                    return (
                        <FlowerZone 
                            key={`pc-${theme.id}`}
                            flowers={grouped[theme.id]} 
                            color={theme.id} 
                            getFlower={getFlower} 
                            onSelect={handleFlowerClick} 
                            className={gridPos} 
                        />
                    )
                })}
            </div>

            {/* --- GIAO DIỆN ĐIỆN THOẠI (CUỘN DỌC) --- */}
            <div className="md:hidden w-full h-full pt-24 pb-10 overflow-y-auto px-6 z-10 flex flex-col gap-10">
                <div className="text-center">
                    <h1 className="text-2xl font-black text-pink-600 italic">Garden of Wishes</h1>
                </div>
                {THEMES.map((theme) => (
                    <div key={`mb-${theme.id}`}>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 text-center">{theme.name}</p>
                        <FlowerZone 
                            flowers={grouped[theme.id]} 
                            color={theme.id} 
                            getFlower={getFlower} 
                            onSelect={handleFlowerClick} 
                            className="flex flex-wrap justify-center" 
                        />
                    </div>
                ))}
            </div>

            {/* MODAL LỜI CHÚC (Chung cho cả 2) */}
            <AnimatePresence>
                {selectedFlower && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={handleCloseCard}
                        className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-6"
                    >
                        <motion.div 
                            initial={{ scale: 0.5, y: 100 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.5, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white rounded-[2.5rem] p-8 md:p-10 max-w-md w-full shadow-2xl text-center relative border-b-[12px]"
                            style={{ borderBottomColor: selectedFlower.style_id }}
                        >
                            <div className="text-6xl mb-6">{getFlower(selectedFlower.style_id)}</div>
                            <h3 className="text-2xl md:text-3xl font-black mb-4" style={{ color: selectedFlower.style_id }}>{selectedFlower.name}</h3>
                            <p className="text-slate-700 italic text-lg md:text-xl font-serif">"{selectedFlower.message}"</p>
                            <button onClick={handleCloseCard} className="mt-8 w-full py-4 rounded-2xl text-white font-bold shadow-lg" style={{ backgroundColor: selectedFlower.style_id }}>Đóng 💖</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="absolute bottom-4 text-slate-900/5 font-black text-[15vw] select-none leading-none pointer-events-none">8/3</div>
        </div>
    )
}

function FlowerZone({ flowers = [], color, getFlower, onSelect, className }: any) {
    return (
        <div className={className}>
            <div className="flex flex-wrap md:grid md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 justify-center">
                {flowers?.map((flower: any, index: number) => (
                    <motion.button
                        key={flower.id}
                        initial={{ scale: 0 }} animate={{ scale: 1 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.8 }}
                        onClick={() => onSelect(flower)}
                        className="text-4xl md:text-5xl drop-shadow-md"
                    >
                        {getFlower(color)}
                    </motion.button>
                ))}
            </div>
        </div>
    )
}