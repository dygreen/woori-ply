'use client'

import { Box, Button, Modal, Paper, Typography } from '@mui/material'
import { signIn } from 'next-auth/react'
import Link from 'next/link'

interface AuthRequiredModalProps {
    open: boolean
    onClose: () => void
    callbackUrl?: string
}

export default function AuthRequiredModal({
    open,
    onClose,
    callbackUrl,
}: AuthRequiredModalProps) {
    return (
        <Modal open={open} onClose={onClose}>
            <Box
                component={Paper}
                elevation={6}
                sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 320,
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    p: 4,
                    textAlign: 'center',
                }}
            >
                <Typography variant="subtitle1" gutterBottom>
                    로그인이 필요한 서비스입니다.
                </Typography>
                <Typography
                    variant="body2"
                    sx={{ mb: 3, color: 'text.secondary' }}
                >
                    로그인 / 회원가입 후 이용해 주세요.
                </Typography>
                <div className="gap-4 flex">
                    <Button
                        variant="contained"
                        color="inherit"
                        fullWidth
                        type="button"
                        onClick={() => signIn('', { callbackUrl })}
                    >
                        로그인
                    </Button>
                    <Link href={'/register'}>
                        <Button
                            variant="outlined"
                            color="inherit"
                            type="button"
                            fullWidth
                        >
                            회원가입
                        </Button>
                    </Link>
                </div>
            </Box>
        </Modal>
    )
}
