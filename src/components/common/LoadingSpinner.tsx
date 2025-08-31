export default function LoadingSpinner({ size = 48 }: { size?: number }) {
    return (
        <div className="loading-container">
            <div
                className="animate-spin rounded-full border-4 border-lime-300 border-t-lime-600"
                style={{ width: size, height: size }}
            />
        </div>
    )
}
