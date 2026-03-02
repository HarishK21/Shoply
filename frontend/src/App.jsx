import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './Components/Auth/Login'
import Register from './Components/Auth/Register'
import Home from './Components/Store/Home'
import ProductDetails from './Components/Store/ProductDetails'
import Checkout from './Components/Checkout/Checkout'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/product/:id" element={<ProductDetails />} />
      </Routes>
    </Router>
  )
}

export default App