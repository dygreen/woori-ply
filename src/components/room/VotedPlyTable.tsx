import React from 'react'
import { Playlist } from '@/types'
import Image from 'next/image'
import { formatMs, pickAlbumImage } from '@/lib/spotify/utils'
import s from '@/app/rooms/[roomId]/room.module.scss'

interface VotedPlyTableProps {
    playlist?: Playlist[]
}

export default function VotedPlyTable({ playlist }: VotedPlyTableProps) {
    if (!playlist || playlist.length === 0)
        return <div className={s.empty_info}>아직 채택된 곡이 없어요</div>

    return (
        <table>
            <thead>
                <tr>
                    <th>TRACK</th>
                    <th>ARTIST</th>
                    <th>ALBUM</th>
                    <th>TIME</th>
                    <th>PICKER</th>
                </tr>
            </thead>
            <tbody>
                {playlist.map((it) => (
                    <tr key={it.addedAt}>
                        <td className={s.album_image_wrap}>
                            <div className="h-12 w-12 overflow-hidden rounded-md bg-gray-100">
                                <Image
                                    src={pickAlbumImage(
                                        it.track?.album.images,
                                        64,
                                    )}
                                    alt={it.track?.album.name ?? 'album image'}
                                    width={64}
                                    height={64}
                                />
                            </div>
                            <div>{it.track?.name}</div>
                        </td>
                        <td>{it.track?.artists}</td>
                        <td>{it.track?.album?.name}</td>
                        <td>{formatMs(it.track?.durationMs ?? 0)}</td>
                        <td>{it.pickerName}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}
