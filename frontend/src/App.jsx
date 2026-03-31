import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Login from './Components/Auth/Login'
import Register from './Components/Auth/Register'
import Home from './Components/Store/Home'
import ProductDetails from './Components/Store/ProductDetails'
import Checkout from './Components/Checkout/Checkout'
import NotFound from './Components/NotFound'
import Orders from './Components/Checkout/Orders'
import Realtime from './Components/Realtime/Realtime'
import PageTransition from './Components/UI/PageTransition'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  return null
}

function AppRoutes() {
  const location = useLocation()

  const withTransition = (element) => <PageTransition>{element}</PageTransition>

  return (
    <>
      <ScrollToTop />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={withTransition(<Home />)} />
          <Route path="/login" element={withTransition(<Login />)} />
          <Route path="/register" element={withTransition(<Register />)} />
          <Route path="/home" element={withTransition(<Home />)} />
          <Route path="/checkout" element={withTransition(<Checkout />)} />
          <Route path="/orders" element={withTransition(<Orders />)} />
          <Route path="/realtime" element={withTransition(<Realtime />)} />
          <Route path="/product/:id" element={withTransition(<ProductDetails />)} />
          <Route path="*" element={withTransition(<NotFound />)} />
        </Routes>
      </AnimatePresence>
    </>
  )
}

function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  )
}

export default App
