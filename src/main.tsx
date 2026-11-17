import { StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import PortfolioRefresh from './PortfolioRefresh'
import './index.css'
import './portfolio-refresh.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PortfolioRefresh />
  </StrictMode>,
)
