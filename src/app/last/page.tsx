'use client'
import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Sparkles, Music, Volume2 } from 'lucide-react'
import confetti from 'canvas-confetti'

export default function LastPage() {
    const [mounted, setMounted] = useState(false)
    const [isPlaying, setIsPlaying] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    useEffect(() => {
        setMounted(true)
        // Hiệu ứng pháo giấy lung tung xèo ngay khi vào trang
        const duration = 15 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

        const interval: any = setInterval(function() {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) return clearInterval(interval);

            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        // Khởi tạo âm nhạc
        const audio = new Audio('/audio/vudieucongchieng.mp3');
        audio.loop = true;
        audioRef.current = audio;

        return () => {
            clearInterval(interval);
            audio.pause();
        }
    }, [])

    const toggleMusic = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    }

    if (!mounted) return null;

    return (
        <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden p-6 text-center">
            
            {/* Nền động mờ ảo */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-pink-900/20 via-slate-950 to-slate-950"></div>

            {/* Nút Nhạc (Đã xóa nút Home) */}
            <div className="absolute top-6 right-6 z-50">
                <button 
                    onClick={toggleMusic}
                    className={`p-4 rounded-full shadow-2xl transition-all ${isPlaying ? 'bg-pink-500 text-white animate-spin-slow' : 'bg-white/10 text-white'}`}
                >
                    {isPlaying ? <Music size={24} /> : <Volume2 size={24} />}
                </button>
            </div>

            {/* Nội dung chính */}
            <div className="z-10 max-w-4xl space-y-12">
                
                <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 10 }}
                >
                    <div className="relative inline-block">
                        <Heart className="text-pink-500 fill-pink-500 w-32 h-32 md:w-48 md:h-48 animate-pulse" />
                        <Sparkles className="absolute top-0 right-0 text-yellow-400 w-12 h-12 animate-bounce" />
                    </div>
                </motion.div>

                <div className="space-y-6">
                    <motion.h1 
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="text-4xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-yellow-200 leading-tight"
                    >
                        Chúc các chị em mừng 8/3 <br className="hidden md:block" />
                        <span className="text-white drop-shadow-[0_0_20px_rgba(236,72,153,0.8)] uppercase">
                            hayanmaulon lonxinhnhuhoa
                        </span>
                    </motion.h1>

                    <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.5 }}
                        className="text-xl md:text-3xl text-pink-200 font-medium italic tracking-widest"
                    >
                        ~ Hãy enjoy moment này! ~
                    </motion.p>
                </div>

                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.5 }}
                    className="flex flex-wrap justify-center gap-4 pt-8"
                >
                    {['🌸', '👑', '💄', '💎', '🍬', '🎁', '🔥'].map((emoji, i) => (
                        <motion.span 
                            key={i}
                            animate={{ y: [0, -20, 0] }}
                            transition={{ repeat: Infinity, duration: 2, delay: i * 0.2 }}
                            className="text-4xl md:text-6xl"
                        >
                            {emoji}
                        </motion.span>
                    ))}
                </motion.div>

                {!isPlaying && (
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={toggleMusic}
                        className="mt-12 px-8 py-4 bg-white text-black font-black rounded-full shadow-[0_0_30px_rgba(255,255,255,0.4)] hover:scale-110 transition-all flex items-center gap-3 mx-auto"
                    >
                        BẤM ĐỂ BẬT NHẠC QUẨY 🔊
                    </motion.button>
                )}
            </div>

            {/* Decor nền */}
            <div className="absolute bottom-10 left-10 opacity-20 pointer-events-none">
                <div className="text-pink-500 font-bold text-9xl select-none">8/3</div>
            </div>
        </main>
    )
}