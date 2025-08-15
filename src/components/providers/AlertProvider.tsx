'use client'

import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react'
import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'

type Severity = 'success' | 'info' | 'warning' | 'error'

type AlertOptions = {
    severity?: Severity
    message: string
    autoHideDuration?: number
    vertical?: 'top' | 'bottom'
    horizontal?: 'left' | 'center' | 'right'
}

type AlertContextValue = {
    showAlert: (opts: AlertOptions) => void
    showSuccess: (
        message: string,
        opts?: Omit<AlertOptions, 'message' | 'severity'>,
    ) => void
    showError: (
        message: string,
        opts?: Omit<AlertOptions, 'message' | 'severity'>,
    ) => void
    showInfo: (
        message: string,
        opts?: Omit<AlertOptions, 'message' | 'severity'>,
    ) => void
    showWarning: (
        message: string,
        opts?: Omit<AlertOptions, 'message' | 'severity'>,
    ) => void
    closeAlert: () => void
}

const AlertContext = createContext<AlertContextValue | null>(null)

export function AlertProvider({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(false)
    const [state, setState] = useState<Required<AlertOptions>>({
        severity: 'info',
        message: '',
        autoHideDuration: 3000,
        vertical: 'top',
        horizontal: 'center',
    })

    const closeAlert = useCallback(() => setOpen(false), [])

    const showAlert = useCallback((opts: AlertOptions) => {
        setState((prev) => ({
            severity: opts.severity ?? prev.severity,
            message: opts.message,
            autoHideDuration: opts.autoHideDuration ?? 3000,
            vertical: opts.vertical ?? 'top',
            horizontal: opts.horizontal ?? 'center',
        }))
        setOpen(true)
    }, [])

    const api = useMemo<AlertContextValue>(
        () => ({
            showAlert,
            showSuccess: (message, opts) =>
                showAlert({ message, severity: 'success', ...opts }),
            showError: (message, opts) =>
                showAlert({ message, severity: 'error', ...opts }),
            showInfo: (message, opts) =>
                showAlert({ message, severity: 'info', ...opts }),
            showWarning: (message, opts) =>
                showAlert({ message, severity: 'warning', ...opts }),
            closeAlert,
        }),
        [showAlert, closeAlert],
    )

    return (
        <AlertContext.Provider value={api}>
            {children}

            <Snackbar
                open={open}
                autoHideDuration={state.autoHideDuration}
                onClose={closeAlert}
                anchorOrigin={{
                    vertical: state.vertical,
                    horizontal: state.horizontal,
                }}
            >
                <Alert
                    onClose={closeAlert}
                    severity={state.severity}
                    sx={{ width: '100%' }}
                >
                    {state.message}
                </Alert>
            </Snackbar>
        </AlertContext.Provider>
    )
}

export function useAlert() {
    const ctx = useContext(AlertContext)
    if (!ctx) throw new Error('useAlert must be used within AlertProvider')
    return ctx
}
