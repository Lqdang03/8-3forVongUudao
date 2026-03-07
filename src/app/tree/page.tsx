'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Sparkles, Volume2, VolumeX, ArrowRight } from 'lucide-react'

const THEMES = [
    { id: '#ec4899', name: 'Hồng Kẹo' },
    { id: '#3b82f6', name: 'Xanh Biển' },
    { id: '#8b5cf6', name: 'Tím Mộng' },
    { id: '#f59e0b', name: 'Cam Nắng' },
    { id: '#10b981', name: 'Lá Xanh' },
]

const FLOWER_MAP: Record<string, string> = {
    '#ec4899': '🌸', '#3b82f6': '🪻', '#8b5cf6': '🌺', '#f59e0b': '🌻', '#10b981': '🌷',
}

const SONGS = [
    '/audio/moonlight.mp3',
    '/audio/rock.mp3',
    '/audio/her.mp3',
    '/audio/Camon.mp3',
    '/audio/vudieucongchieng.mp3',
    '/audio/nguoidautien.mp3'
];

export default function FlowerMode() {
    const [grouped, setGrouped] = useState<Record<string, any[]>>({})
    const [selectedFlower, setSelectedFlower] = useState<any>(null)
    const [mounted, setMounted] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    const [isSpeaking, setIsSpeaking] = useState(false)
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])

    const getFlower = (color: string) => FLOWER_MAP[color?.toLowerCase()] || '💐'

    // --- LOGIC GIỌNG NÓI ---
    useEffect(() => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            const loadVoices = () => {
                const availableVoices = window.speechSynthesis.getVoices();
                if (availableVoices.length > 0) {
                    setVoices(availableVoices);
                }
            };
            loadVoices();
            window.speechSynthesis.onvoiceschanged = loadVoices;
            return () => { window.speechSynthesis.onvoiceschanged = null; }
        }
    }, []);

    const handleSpeak = (text: string) => {
        if (!('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);

        const viVoice = voices.find(v => 
            v.lang === 'vi-VN' || v.lang === 'vi_VN' || v.lang.toLowerCase().includes('vi-vn') || v.name.toLowerCase().includes('vietnamese')
        );

        if (viVoice) utterance.voice = viVoice;
        utterance.lang = 'vi-VN';
        utterance.rate = 0.9;
        utterance.pitch = 1;

        utterance.onstart = () => { setIsSpeaking(true); if (audioRef.current) audioRef.current.volume = 0.15; };
        utterance.onend = () => { setIsSpeaking(false); if (audioRef.current) audioRef.current.volume = 0.6; };
        utterance.onerror = () => { setIsSpeaking(false); if (audioRef.current) audioRef.current.volume = 0.6; }

        window.speechSynthesis.speak(utterance);
    }

    // --- XỬ LÝ CLICK ---
    const handleCloseCard = () => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
        }
        setSelectedFlower(null)
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.currentTime = 0
            audioRef.current.volume = 0.6 
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
        audio.play().catch(() => { })
    }

    // --- FETCH DATA ---
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

        return () => {
            if (audioRef.current) audioRef.current.pause();
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        }
    }, [])

    if (!mounted) return null

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-rose-100 via-pink-100 to-teal-50 flex items-center justify-center overflow-hidden">
            
            {/* Nút quay lại Wall */}
            <Link href="/wall" className="absolute top-6 left-6 z-50 text-pink-600 bg-white/80 border border-pink-200 px-5 py-2 rounded-full shadow-lg hover:bg-white transition-all flex items-center gap-2 font-bold">
                <span>←</span> Wall
            </Link>

            {/* NÚT NHẢY SANG TRANG MỚI (LAST PAGE) */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute top-6 right-6 z-50"
            >
                <Link href="/last" className="group relative flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2.5 rounded-full shadow-[0_0_20px_rgba(219,39,119,0.4)] hover:shadow-[0_0_30px_rgba(219,39,119,0.6)] transition-all font-bold">
                    <Sparkles size={18} className="animate-pulse" />
                    <span>Lời cuối</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    
                    {/* Hiệu ứng viền sáng chạy quanh nút */}
                    <span className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping pointer-events-none"></span>
                </Link>
            </motion.div>

            {/* --- GIAO DIỆN MÁY TÍNH --- */}
            <div className="hidden md:grid w-full max-w-6xl h-[80vh] grid-cols-3 grid-rows-3 place-items-center z-10">
                {THEMES.map((theme, idx) => {
                    const gridPos = ["col-start-1 row-start-1", "col-start-3 row-start-1", "col-start-2 row-start-2", "col-start-1 row-start-3", "col-start-3 row-start-3"][idx];
                    return <FlowerZone key={`pc-${theme.id}`} flowers={grouped[theme.id]} color={theme.id} getFlower={getFlower} onSelect={handleFlowerClick} className={gridPos} />
                })}
            </div>

            {/* --- GIAO DIỆN ĐIỆN THOẠI --- */}
            <div className="md:hidden w-full h-full pt-24 pb-10 overflow-y-auto px-6 z-10 flex flex-col gap-10">
                <div className="text-center">
                    <h1 className="text-2xl font-black text-pink-600 italic tracking-widest">Garden of Wishes</h1>
                </div>
                {THEMES.map((theme) => (
                    <div key={`mb-${theme.id}`}>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-4 text-center">{theme.name}</p>
                        <FlowerZone flowers={grouped[theme.id]} color={theme.id} getFlower={getFlower} onSelect={handleFlowerClick} className="flex flex-wrap justify-center" />
                    </div>
                ))}
            </div>

            {/* MODAL LỜI CHÚC */}
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
                            className="bg-white rounded-[2.5rem] p-0 pb-8 md:pb-10 max-w-md w-full shadow-2xl text-center relative border-b-[12px] flex flex-col items-center overflow-hidden"
                            style={{ borderBottomColor: selectedFlower.style_id }}
                        >
                            <button
                                onClick={() => isSpeaking ? window.speechSynthesis.cancel() : handleSpeak(`Lời chúc gửi đến ${selectedFlower.recipient_name ? selectedFlower.recipient_name : 'bạn'}. Từ ${selectedFlower.name}. ${selectedFlower.message}`)}
                                className={`absolute top-6 right-6 p-3 rounded-full transition-all shadow-md z-10 ${isSpeaking ? 'bg-pink-500 text-white animate-pulse' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                            >
                                {isSpeaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
                            </button>

                            <div className="text-6xl mt-12 mb-4">{getFlower(selectedFlower.style_id)}</div>

                            {selectedFlower.recipient_name && selectedFlower.recipient_name.trim() !== '' && (
                                <div className="w-full bg-gradient-to-r from-transparent via-pink-50 to-transparent py-4 mb-4 border-y border-pink-100/50">
                                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-pink-400/80 mb-1">Gửi trọn yêu thương đến</p>
                                    <div className="flex justify-center items-center gap-3">
                                        <Sparkles size={24} className="text-pink-400 animate-pulse" />
                                        <div className="flex items-center gap-2">
                                            <span className="text-3xl md:text-4xl font-black text-pink-600 drop-shadow-sm">
                                                {selectedFlower.recipient_name}
                                            </span>
                                            {selectedFlower.gift_icon && (
                                                <span className="text-4xl animate-bounce drop-shadow-md">
                                                    {selectedFlower.gift_icon}
                                                </span>
                                            )}
                                        </div>
                                        <Sparkles size={24} className="text-pink-400 animate-pulse" />
                                    </div>
                                </div>
                            )}

                            <div className="px-8 md:px-10 w-full flex flex-col items-center">
                                <h3 className="text-xl md:text-2xl font-bold mb-4 opacity-70" style={{ color: selectedFlower.style_id }}>
                                    Từ: {selectedFlower.name}
                                </h3>
                                <div className="w-12 h-1 bg-slate-100 mx-auto mb-4 rounded-full"></div>
                                <p className="text-slate-700 italic text-lg md:text-xl font-serif leading-relaxed">
                                    "{selectedFlower.message}"
                                </p>
                                <button onClick={handleCloseCard} className="mt-8 w-full py-4 rounded-2xl text-white font-bold shadow-lg transition-transform active:scale-95" style={{ backgroundColor: selectedFlower.style_id }}>
                                    Tuyệt vời 💖
                                </button>
                            </div>
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
                {flowers?.map((flower: any, index: number) => {
                    const isSpecial = flower.recipient_name && flower.recipient_name.trim() !== '';
                    return (
                        <motion.button
                            key={flower.id}
                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.8 }}
                            onClick={() => onSelect(flower)}
                            className={`text-4xl md:text-5xl drop-shadow-md relative transition-all duration-300 ${isSpecial ? 'hover:drop-shadow-[0_0_15px_rgba(255,215,0,0.8)]' : ''}`}
                        >
                            {isSpecial && (
                                <span className="absolute -top-1 -right-1 flex h-4 w-4 z-10">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-yellow-500 border-2 border-white shadow-sm"></span>
                                </span>
                            )}
                            <div className={isSpecial ? "animate-[bounce_3s_infinite]" : ""}>
                                {getFlower(color)}
                            </div>
                        </motion.button>
                    )
                })}
            </div>
        </div>
    )
}