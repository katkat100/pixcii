import { useEffect, useRef, useState } from 'react'
import './App.css'
import { ProjectProvider } from './state/ProjectContext'
import { useProjectState, useProjectDispatch } from './state/ProjectContext'
import Canvas from './components/Canvas'
import Toolbar from './components/Toolbar'
import RightPanel from './components/RightPanel'
import FrameManager from './components/FrameManager'
import MenuBar from './components/MenuBar'
import StatusBar from './components/StatusBar'
import { saveToLocalStorage, checkForRecovery, clearAutosave, formatTimeAgo } from './file/autosave'

function AppInner() {
  const state = useProjectState()
  const dispatch = useProjectDispatch()
  const [recoveryBanner, setRecoveryBanner] = useState<{ autosaveTime: number } | null>(null)
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Check for recovery on mount
  useEffect(() => {
    const recovery = checkForRecovery()
    if (recovery) {
      setRecoveryBanner({ autosaveTime: recovery.autosaveTime })
    }
  }, [])

  const handleRecover = () => {
    const recovery = checkForRecovery()
    if (recovery) {
      dispatch({ type: 'LOAD_PROJECT', project: recovery.project })
    }
    setRecoveryBanner(null)
  }

  const handleDiscardRecovery = () => {
    clearAutosave()
    setRecoveryBanner(null)
  }

  // Debounced autosave on every state change (5 second delay)
  useEffect(() => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current)
    }
    autosaveTimerRef.current = setTimeout(() => {
      saveToLocalStorage(state.project)
    }, 5000)
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current)
    }
  }, [state.project])

  return (
    <div className="app">
      {recoveryBanner && (
        <div className="recovery-banner">
          <span>
            Recovered unsaved changes from {formatTimeAgo(recoveryBanner.autosaveTime)}.
          </span>
          <button className="recovery-btn accept" onClick={handleRecover}>
            Use recovered version
          </button>
          <button className="recovery-btn discard" onClick={handleDiscardRecovery}>
            Discard
          </button>
        </div>
      )}
      <MenuBar />
      <div className="main-area">
        <Toolbar />
        <div className="canvas-area">
          <Canvas />
        </div>
        <RightPanel />
      </div>
      <FrameManager />
      <StatusBar />
    </div>
  )
}

export default function App() {
  return (
    <ProjectProvider>
      <AppInner />
    </ProjectProvider>
  )
}
