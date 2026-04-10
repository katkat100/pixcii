import './App.css'
import { ProjectProvider } from './state/ProjectContext'
import Canvas from './components/Canvas'
import Toolbar from './components/Toolbar'
import RightPanel from './components/RightPanel'
import FrameManager from './components/FrameManager'
import MenuBar from './components/MenuBar'
import StatusBar from './components/StatusBar'

export default function App() {
  return (
    <ProjectProvider>
    <div className="app">
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
    </ProjectProvider>
  )
}
