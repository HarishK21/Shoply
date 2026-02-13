import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './Components/Auth/Login'
import Register from './Components/Auth/Register'
import Home from './Home'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Home />} />
        <Route path="/checkout" element={<div style={{ padding: 24, color: "white" }}>Checkout page (WIP)</div>} />
        <Route path="/product/:id" element={<div style={{ padding: 24, color: "white" }}>Product detail (WIP)</div>} />
      </Routes>
    </Router>
  )
}

export default App