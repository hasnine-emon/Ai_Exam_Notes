import axios from 'axios'
import React, { useState } from 'react'
import { serverUrl } from '../App'

function History() {
  const [topics , setTopics] = useState([])

  const myNotes = async () => {
    try{
      const res = await axios.get(serverUrl + "/api/notes/getnotes" , {withCredentials:true})
      console.log(res.data)
      setTopics(Array.isArray(res.data)? res.data: [])
    } catch (error) {
      console.log(error)
    }
  }
  myNotes()
},[]
  return (
    <div>
        
    </div>
  )
}

export default History