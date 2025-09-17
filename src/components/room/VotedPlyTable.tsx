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

export default function VotedPlyTable({
    playlist,
    // = [
    //     {
    //         trackId: '1I37Zz2g3hk9eWxaNkj031',
    //         pickerName: 'GREEN',
    //         addedAt: 1758114660083,
    //         track: {
    //             id: '1I37Zz2g3hk9eWxaNkj031',
    //             name: 'Your Idol',
    //             artists:
    //                 'Saja Boys, Andrew Choi, Neckwav, Danny Chung, KEVIN WOO, samUIL Lee, KPop Demon Hunters Cast',
    //             album: {
    //                 id: '14JkAa6IiFaOh5s0nMyMU9',
    //                 name: 'KPop Demon Hunters (Soundtrack from the Netflix Film)',
    //                 images: [
    //                     {
    //                         height: 640,
    //                         width: 640,
    //                         url: 'https://i.scdn.co/image/ab67616d0000b2734dcb6c5df15cf74596ab25a4',
    //                     },
    //                     {
    //                         height: 300,
    //                         width: 300,
    //                         url: 'https://i.scdn.co/image/ab67616d00001e024dcb6c5df15cf74596ab25a4',
    //                     },
    //                     {
    //                         height: 64,
    //                         width: 64,
    //                         url: 'https://i.scdn.co/image/ab67616d000048514dcb6c5df15cf74596ab25a4',
    //                     },
    //                 ],
    //             },
    //             durationMs: 191537,
    //             previewUrl: null,
    //         },
    //     },
    //     {
    //         trackId: '1I37Zz2g3hk9eWxaNkj031',
    //         pickerName: 'GREEN',
    //         addedAt: 1758114660083,
    //         track: {
    //             id: '1I37Zz2g3hk9eWxaNkj031',
    //             name: 'Your Idol',
    //             artists:
    //                 'Saja Boys, Andrew Choi, Neckwav, Danny Chung, KEVIN WOO, samUIL Lee, KPop Demon Hunters Cast',
    //             album: {
    //                 id: '14JkAa6IiFaOh5s0nMyMU9',
    //                 name: 'KPop Demon Hunters (Soundtrack from the Netflix Film)',
    //                 images: [
    //                     {
    //                         height: 640,
    //                         width: 640,
    //                         url: 'https://i.scdn.co/image/ab67616d0000b2734dcb6c5df15cf74596ab25a4',
    //                     },
    //                     {
    //                         height: 300,
    //                         width: 300,
    //                         url: 'https://i.scdn.co/image/ab67616d00001e024dcb6c5df15cf74596ab25a4',
    //                     },
    //                     {
    //                         height: 64,
    //                         width: 64,
    //                         url: 'https://i.scdn.co/image/ab67616d000048514dcb6c5df15cf74596ab25a4',
    //                     },
    //                 ],
    //             },
    //             durationMs: 191537,
    //             previewUrl: null,
    //         },
    //     },
    //     {
    //         trackId: '1I37Zz2g3hk9eWxaNkj031',
    //         pickerName: 'GREEN',
    //         addedAt: 1758114660083,
    //         track: {
    //             id: '1I37Zz2g3hk9eWxaNkj031',
    //             name: 'Your Idol',
    //             artists:
    //                 'Saja Boys, Andrew Choi, Neckwav, Danny Chung, KEVIN WOO, samUIL Lee, KPop Demon Hunters Cast',
    //             album: {
    //                 id: '14JkAa6IiFaOh5s0nMyMU9',
    //                 name: 'KPop Demon Hunters (Soundtrack from the Netflix Film)',
    //                 images: [
    //                     {
    //                         height: 640,
    //                         width: 640,
    //                         url: 'https://i.scdn.co/image/ab67616d0000b2734dcb6c5df15cf74596ab25a4',
    //                     },
    //                     {
    //                         height: 300,
    //                         width: 300,
    //                         url: 'https://i.scdn.co/image/ab67616d00001e024dcb6c5df15cf74596ab25a4',
    //                     },
    //                     {
    //                         height: 64,
    //                         width: 64,
    //                         url: 'https://i.scdn.co/image/ab67616d000048514dcb6c5df15cf74596ab25a4',
    //                     },
    //                 ],
    //             },
    //             durationMs: 191537,
    //             previewUrl: null,
    //         },
    //     },
    //     {
    //         trackId: '1I37Zz2g3hk9eWxaNkj031',
    //         pickerName: 'GREEN',
    //         addedAt: 1758114660083,
    //         track: {
    //             id: '1I37Zz2g3hk9eWxaNkj031',
    //             name: 'Your Idol',
    //             artists:
    //                 'Saja Boys, Andrew Choi, Neckwav, Danny Chung, KEVIN WOO, samUIL Lee, KPop Demon Hunters Cast',
    //             album: {
    //                 id: '14JkAa6IiFaOh5s0nMyMU9',
    //                 name: 'KPop Demon Hunters (Soundtrack from the Netflix Film)',
    //                 images: [
    //                     {
    //                         height: 640,
    //                         width: 640,
    //                         url: 'https://i.scdn.co/image/ab67616d0000b2734dcb6c5df15cf74596ab25a4',
    //                     },
    //                     {
    //                         height: 300,
    //                         width: 300,
    //                         url: 'https://i.scdn.co/image/ab67616d00001e024dcb6c5df15cf74596ab25a4',
    //                     },
    //                     {
    //                         height: 64,
    //                         width: 64,
    //                         url: 'https://i.scdn.co/image/ab67616d000048514dcb6c5df15cf74596ab25a4',
    //                     },
    //                 ],
    //             },
    //             durationMs: 191537,
    //             previewUrl: null,
    //         },
    //     },
    //     {
    //         trackId: '1I37Zz2g3hk9eWxaNkj031',
    //         pickerName: 'GREEN',
    //         addedAt: 1758114660083,
    //         track: {
    //             id: '1I37Zz2g3hk9eWxaNkj031',
    //             name: 'Your Idol',
    //             artists:
    //                 'Saja Boys, Andrew Choi, Neckwav, Danny Chung, KEVIN WOO, samUIL Lee, KPop Demon Hunters Cast',
    //             album: {
    //                 id: '14JkAa6IiFaOh5s0nMyMU9',
    //                 name: 'KPop Demon Hunters (Soundtrack from the Netflix Film)',
    //                 images: [
    //                     {
    //                         height: 640,
    //                         width: 640,
    //                         url: 'https://i.scdn.co/image/ab67616d0000b2734dcb6c5df15cf74596ab25a4',
    //                     },
    //                     {
    //                         height: 300,
    //                         width: 300,
    //                         url: 'https://i.scdn.co/image/ab67616d00001e024dcb6c5df15cf74596ab25a4',
    //                     },
    //                     {
    //                         height: 64,
    //                         width: 64,
    //                         url: 'https://i.scdn.co/image/ab67616d000048514dcb6c5df15cf74596ab25a4',
    //                     },
    //                 ],
    //             },
    //             durationMs: 191537,
    //             previewUrl: null,
    //         },
    //     },
    //     {
    //         trackId: '1I37Zz2g3hk9eWxaNkj031',
    //         pickerName: 'GREEN',
    //         addedAt: 1758114660083,
    //         track: {
    //             id: '1I37Zz2g3hk9eWxaNkj031',
    //             name: 'Your Idol',
    //             artists:
    //                 'Saja Boys, Andrew Choi, Neckwav, Danny Chung, KEVIN WOO, samUIL Lee, KPop Demon Hunters Cast',
    //             album: {
    //                 id: '14JkAa6IiFaOh5s0nMyMU9',
    //                 name: 'KPop Demon Hunters (Soundtrack from the Netflix Film)',
    //                 images: [
    //                     {
    //                         height: 640,
    //                         width: 640,
    //                         url: 'https://i.scdn.co/image/ab67616d0000b2734dcb6c5df15cf74596ab25a4',
    //                     },
    //                     {
    //                         height: 300,
    //                         width: 300,
    //                         url: 'https://i.scdn.co/image/ab67616d00001e024dcb6c5df15cf74596ab25a4',
    //                     },
    //                     {
    //                         height: 64,
    //                         width: 64,
    //                         url: 'https://i.scdn.co/image/ab67616d000048514dcb6c5df15cf74596ab25a4',
    //                     },
    //                 ],
    //             },
    //             durationMs: 191537,
    //             previewUrl: null,
    //         },
    //     },
    //     {
    //         trackId: '1I37Zz2g3hk9eWxaNkj031',
    //         pickerName: 'GREEN',
    //         addedAt: 1758114660083,
    //         track: {
    //             id: '1I37Zz2g3hk9eWxaNkj031',
    //             name: 'Your Idol',
    //             artists:
    //                 'Saja Boys, Andrew Choi, Neckwav, Danny Chung, KEVIN WOO, samUIL Lee, KPop Demon Hunters Cast',
    //             album: {
    //                 id: '14JkAa6IiFaOh5s0nMyMU9',
    //                 name: 'KPop Demon Hunters (Soundtrack from the Netflix Film)',
    //                 images: [
    //                     {
    //                         height: 640,
    //                         width: 640,
    //                         url: 'https://i.scdn.co/image/ab67616d0000b2734dcb6c5df15cf74596ab25a4',
    //                     },
    //                     {
    //                         height: 300,
    //                         width: 300,
    //                         url: 'https://i.scdn.co/image/ab67616d00001e024dcb6c5df15cf74596ab25a4',
    //                     },
    //                     {
    //                         height: 64,
    //                         width: 64,
    //                         url: 'https://i.scdn.co/image/ab67616d000048514dcb6c5df15cf74596ab25a4',
    //                     },
    //                 ],
    //             },
    //             durationMs: 191537,
    //             previewUrl: null,
    //         },
    //     },
    //     {
    //         trackId: '1I37Zz2g3hk9eWxaNkj031',
    //         pickerName: 'GREEN',
    //         addedAt: 1758114660083,
    //         track: {
    //             id: '1I37Zz2g3hk9eWxaNkj031',
    //             name: 'Your Idol',
    //             artists:
    //                 'Saja Boys, Andrew Choi, Neckwav, Danny Chung, KEVIN WOO, samUIL Lee, KPop Demon Hunters Cast',
    //             album: {
    //                 id: '14JkAa6IiFaOh5s0nMyMU9',
    //                 name: 'KPop Demon Hunters (Soundtrack from the Netflix Film)',
    //                 images: [
    //                     {
    //                         height: 640,
    //                         width: 640,
    //                         url: 'https://i.scdn.co/image/ab67616d0000b2734dcb6c5df15cf74596ab25a4',
    //                     },
    //                     {
    //                         height: 300,
    //                         width: 300,
    //                         url: 'https://i.scdn.co/image/ab67616d00001e024dcb6c5df15cf74596ab25a4',
    //                     },
    //                     {
    //                         height: 64,
    //                         width: 64,
    //                         url: 'https://i.scdn.co/image/ab67616d000048514dcb6c5df15cf74596ab25a4',
    //                     },
    //                 ],
    //             },
    //             durationMs: 191537,
    //             previewUrl: null,
    //         },
    //     },
    //     {
    //         trackId: '1I37Zz2g3hk9eWxaNkj031',
    //         pickerName: 'GREEN',
    //         addedAt: 1758114660083,
    //         track: {
    //             id: '1I37Zz2g3hk9eWxaNkj031',
    //             name: 'Your Idol',
    //             artists:
    //                 'Saja Boys, Andrew Choi, Neckwav, Danny Chung, KEVIN WOO, samUIL Lee, KPop Demon Hunters Cast',
    //             album: {
    //                 id: '14JkAa6IiFaOh5s0nMyMU9',
    //                 name: 'KPop Demon Hunters (Soundtrack from the Netflix Film)',
    //                 images: [
    //                     {
    //                         height: 640,
    //                         width: 640,
    //                         url: 'https://i.scdn.co/image/ab67616d0000b2734dcb6c5df15cf74596ab25a4',
    //                     },
    //                     {
    //                         height: 300,
    //                         width: 300,
    //                         url: 'https://i.scdn.co/image/ab67616d00001e024dcb6c5df15cf74596ab25a4',
    //                     },
    //                     {
    //                         height: 64,
    //                         width: 64,
    //                         url: 'https://i.scdn.co/image/ab67616d000048514dcb6c5df15cf74596ab25a4',
    //                     },
    //                 ],
    //             },
    //             durationMs: 191537,
    //             previewUrl: null,
    //         },
    //     },
    //     {
    //         trackId: '1I37Zz2g3hk9eWxaNkj031',
    //         pickerName: 'GREEN',
    //         addedAt: 1758114660083,
    //         track: {
    //             id: '1I37Zz2g3hk9eWxaNkj031',
    //             name: 'Your Idol',
    //             artists:
    //                 'Saja Boys, Andrew Choi, Neckwav, Danny Chung, KEVIN WOO, samUIL Lee, KPop Demon Hunters Cast',
    //             album: {
    //                 id: '14JkAa6IiFaOh5s0nMyMU9',
    //                 name: 'KPop Demon Hunters (Soundtrack from the Netflix Film)',
    //                 images: [
    //                     {
    //                         height: 640,
    //                         width: 640,
    //                         url: 'https://i.scdn.co/image/ab67616d0000b2734dcb6c5df15cf74596ab25a4',
    //                     },
    //                     {
    //                         height: 300,
    //                         width: 300,
    //                         url: 'https://i.scdn.co/image/ab67616d00001e024dcb6c5df15cf74596ab25a4',
    //                     },
    //                     {
    //                         height: 64,
    //                         width: 64,
    //                         url: 'https://i.scdn.co/image/ab67616d000048514dcb6c5df15cf74596ab25a4',
    //                     },
    //                 ],
    //             },
    //             durationMs: 191537,
    //             previewUrl: null,
    //         },
    //     },
    // ],
}: VotedPlyTableProps) {
    if (!playlist || playlist.length === 0)
        return <div className={s.empty_info}>아직 채택된 곡이 없어요</div>

    return (
        // <table>
        //     <thead>
        //         <tr>
        //             <th>TRACK</th>
        //             <th>ARTIST</th>
        //             <th>ALBUM</th>
        //             <th>TIME</th>
        //             <th>PICKER</th>
        //         </tr>
        //     </thead>
        //     <tbody>
        //         {playlist.map((it) => (
        //             <tr key={it.addedAt}>
        //                 <td className={s.album_image_wrap}>
        //                     <div className="h-12 w-12 overflow-hidden rounded-md bg-gray-100">
        //                         <Image
        //                             src={pickAlbumImage(
        //                                 it.track?.album.images,
        //                                 64,
        //                             )}
        //                             alt={it.track?.album.name ?? 'album image'}
        //                             width={64}
        //                             height={64}
        //                         />
        //                     </div>
        //                     <div>{it.track?.name}</div>
        //                 </td>
        //                 <td>{it.track?.artists}</td>
        //                 <td>{it.track?.album?.name}</td>
        //                 <td>{formatMs(it.track?.durationMs ?? 0)}</td>
        //                 <td>{it.pickerName}</td>
        //             </tr>
        //         ))}
        //     </tbody>
        // </table>
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
