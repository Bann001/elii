import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import TodoApp from './TodoApp'
import './index.css'

const isTodoApp = new URLSearchParams(window.location.search).get('app') === 'todo'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isTodoApp ? <TodoApp /> : <App />}
  </StrictMode>,
)
