import React from 'react'
import { Playlist } from '@/types'
import Image from 'next/image'
import { formatMs, pickAlbumImage } from '@/lib/spotify/utils'
import s from '@/app/rooms/[roomId]/room.module.scss'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'

interface VotedPlyTableProps {
    playlist?: Playlist[]
}

export default function VotedPlyTable({ playlist }: VotedPlyTableProps) {
    if (!playlist || playlist.length === 0)
        return <div className={s.empty_info}>아직 채택된 곡이 없어요</div>

    return (
        <TableContainer className={s.table_container}>
            <Table stickyHeader aria-label="sticky table">
                <TableHead>
                    <TableRow>
                        <TableCell>TRACK</TableCell>
                        <TableCell>ARTIST</TableCell>
                        <TableCell>ALBUM</TableCell>
                        <TableCell>TIME</TableCell>
                        <TableCell>PICKER</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {playlist.map((row) => (
                        <TableRow key={row.addedAt}>
                            <TableCell className={s.album_image_wrap}>
                                <div className="h-12 w-12 overflow-hidden rounded-md bg-gray-100">
                                    <Image
                                        src={pickAlbumImage(
                                            row.track?.album.images,
                                            64,
                                        )}
                                        alt={
                                            row.track?.album.name ??
                                            'album image'
                                        }
                                        width={64}
                                        height={64}
                                    />
                                </div>
                                <div>{row.track?.name}</div>
                            </TableCell>
                            <TableCell>{row.track?.artists}</TableCell>
                            <TableCell>{row.track?.album?.name}</TableCell>
                            <TableCell>
                                {formatMs(row.track?.durationMs ?? 0)}
                            </TableCell>
                            <TableCell>{row.pickerName}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    )
}
