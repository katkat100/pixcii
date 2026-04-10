import { createContext, useContext, useReducer, ReactNode } from 'react'
import { ProjectState } from '../types'
import { ProjectAction, createInitialState, projectReducer } from './projectReducer'

// ---------------------------------------------------------------------------
// Contexts
// ---------------------------------------------------------------------------

const ProjectStateContext = createContext<ProjectState | null>(null)
const ProjectDispatchContext = createContext<React.Dispatch<ProjectAction> | null>(null)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(projectReducer, undefined, createInitialState)

  return (
    <ProjectStateContext.Provider value={state}>
      <ProjectDispatchContext.Provider value={dispatch}>
        {children}
      </ProjectDispatchContext.Provider>
    </ProjectStateContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useProjectState(): ProjectState {
  const ctx = useContext(ProjectStateContext)
  if (ctx === null) {
    throw new Error('useProjectState must be used within a ProjectProvider')
  }
  return ctx
}

export function useProjectDispatch(): React.Dispatch<ProjectAction> {
  const ctx = useContext(ProjectDispatchContext)
  if (ctx === null) {
    throw new Error('useProjectDispatch must be used within a ProjectProvider')
  }
  return ctx
}
