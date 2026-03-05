'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
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

export default function FlowerMode() {
    const [grouped, setGrouped] = useState<Record<string, any[]>>({})
    const [mounted, setMounted] = useState(false)

    const getFlower = (color: string) =>
        FLOWER_MAP[color?.toLowerCase()] || '💐'

    useEffect(() => {
        setMounted(true)

        const fetchWishes = async () => {
            const { data } = await supabase
                .from('wishes')
                .select('*')
                .order('created_at', { ascending: false })

            if (!data) return

            const result: Record<string, any[]> = {}

            THEMES.forEach(theme => {
                result[theme.id] = data.filter(w => w.style_id === theme.id)
            })

            setGrouped(result)
        }

        fetchWishes()
    }, [])

    if (!mounted) return null

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-rose-100 via-pink-200 to-fuchsia-300 flex items-center justify-center overflow-hidden">

            <Link
                href="/wall"
                className="absolute top-6 left-6 z-50 text-pink-600 bg-white/70 px-4 py-2 rounded-full shadow-md"
            >
                ← Quay lại Wall
            </Link>

            {/* 🌸 GRID CHÍNH */}
            <div className="
        w-full max-w-6xl
        h-[80vh]
        grid
        grid-cols-3
        grid-rows-3
        place-items-center
      ">

                {/* Hồng */}
                <FlowerZone flowers={grouped['#ec4899']} color="#ec4899" getFlower={getFlower} className="col-start-1 row-start-1" />

                {/* Xanh */}
                <FlowerZone flowers={grouped['#3b82f6']} color="#3b82f6" getFlower={getFlower} className="col-start-3 row-start-1" />

                {/* Tím giữa */}
                <FlowerZone flowers={grouped['#8b5cf6']} color="#8b5cf6" getFlower={getFlower} className="col-start-2 row-start-2" />

                {/* Cam */}
                <FlowerZone flowers={grouped['#f59e0b']} color="#f59e0b" getFlower={getFlower} className="col-start-1 row-start-3" />

                {/* Lá */}
                <FlowerZone flowers={grouped['#10b981']} color="#10b981" getFlower={getFlower} className="col-start-3 row-start-3" />
            </div>

            <div className="absolute bottom-8 text-white/30 font-black text-[90px] md:text-[120px] select-none">
                8/3
            </div>

            <div className="absolute bottom-24 text-pink-800 text-lg text-center px-4">
                Chúc một nửa thế giới của ai đó luôn rạng rỡ như những đóa hoa 🌷
            </div>
        </div>
    )
}

function FlowerZone({ flowers = [], color, getFlower, className }: any) {
    return (
        <div className={`${className} flex flex-col items-center`}>
            <div
                className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 place-items-center"
            >
                {flowers?.map((flower: any, index: number) => (
                    <motion.div
                        key={flower.id}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.03 }}
                        className="group relative"
                    >
                        <div
                            className="text-3xl cursor-pointer"
                            style={{ filter: `drop-shadow(0 0 10px ${color})` }}
                        >
                            {getFlower(color)}
                        </div>

                        <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 p-3 bg-white/95 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all border border-pink-200">
                            <p className="font-semibold text-sm mb-1" style={{ color }}>
                                {flower.name}
                            </p>
                            <p className="text-gray-700 text-sm italic">
                                "{flower.message}"
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    )
}