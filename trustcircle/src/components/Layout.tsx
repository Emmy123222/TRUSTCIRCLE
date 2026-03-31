import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { RightSidebar } from './RightSidebar'

const pagesWithRightSidebar = ['/', '/circles']

export function Layout() {
  const location = useLocation()
  const showRight = pagesWithRightSidebar.includes(location.pathname)

  return (
    <div className="noise-overlay min-h-screen grid-bg">
      <Sidebar />
      <div className="ml-64 flex justify-center min-h-screen">
        <main className={`flex-1 min-h-screen ${showRight ? 'max-w-[calc(100%-18rem)]' : ''}`}>
          <Outlet />
        </main>
        {showRight && (
          <div className="w-72 flex-shrink-0 p-6 pt-8 hidden xl:block">
            <RightSidebar />
          </div>
        )}
      </div>
    </div>
  )
}
