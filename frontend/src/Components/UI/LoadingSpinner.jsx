/**
 * Loading Spinner Component
 * Provides visual feedback during loading states for better UX
 */

const LoadingSpinner = ({ size = 'md', color = 'blue', fullScreen = false }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4'
  }

  const colorClasses = {
    blue: 'border-blue-500 border-t-transparent',
    green: 'border-green-500 border-t-transparent',
    red: 'border-red-500 border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-500 border-t-transparent'
  }

  const spinnerClass = `${sizeClasses[size] || sizeClasses.md} ${colorClasses[color] || colorClasses.blue} rounded-full animate-spin`

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-50">
        <div className={spinnerClass}></div>
      </div>
    )
  }

  return <div className={spinnerClass}></div>
}

export default LoadingSpinner
