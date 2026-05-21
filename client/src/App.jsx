import React from "react"
import { Routes, Route } from "react-router-dom"
import Home from "./pages/Home"
import Auth from "./pages/Auth"
import { useEffect } from "react"
import { getCurrentUser } from "./services/api"
import { useDispatch } from "react-redux"
export const serverUrl = "http://localhost:8000"

const App = () => {
  const dispatch = useDispatch()
  useEffect(() =>{
    
    getCurrentUser(dispatch)
  },[dispatch])


  return (
    <>
      <Routes>

       <Route path='/' element={<Home />} />
      
      <Route path='/auth' element={<Auth />} />

      </Routes>
    </>
  )
}

export default App

