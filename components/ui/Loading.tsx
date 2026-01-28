import RollerLoader from './RollerLoader'

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#000000' }}>
      <RollerLoader />
    </div>
  )
}