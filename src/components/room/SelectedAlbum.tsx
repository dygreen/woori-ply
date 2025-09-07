import React from 'react'
import s from '@/app/rooms/[roomId]/room.module.scss'
import { Room } from '@/types'
import Image from 'next/image'
import { formatMs, pickAlbumImage } from '@/lib/spotify/utils'
import { Divider } from '@mui/material'

interface SelectedAlbumProps {
    roomDetail: Room | null
}

export default function SelectedAlbum({ roomDetail }: SelectedAlbumProps) {
    const track = roomDetail?.current?.track

    return (
        <>
            <div className={s.album_wrapper}>
                <Image
                    src={pickAlbumImage(track?.album?.images, 300)}
                    alt={track?.album?.name ?? '앨범 이미지'}
                    fill
                    style={{ objectFit: 'cover' }}
                    priority
                />
            </div>
            <div className={s.detail_wrapper}>
                <h3>{track?.name ?? 'TRACK NAME'}</h3>
                <p>{track?.album?.name ?? 'ALBUM NAME'}</p>
                <div className={s.artist_row}>
                    <span>{track?.artists ?? 'ARTIST'}</span>
                    <Divider
                        orientation="vertical"
                        flexItem
                        sx={{
                            height: '18px',
                            borderRightWidth: 2,
                            alignSelf: 'center',
                        }}
                    />
                    <span>{formatMs(track?.durationMs ?? 0)}</span>
                </div>
            </div>
        </>
    )
}
