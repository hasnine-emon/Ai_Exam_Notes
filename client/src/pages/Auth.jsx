import React from 'react'

const Auth = () => {
  return (
    // 'big-white' কে পরিবর্তন করে 'bg-slate-50' বা 'bg-white' করা হয়েছে
    <div className='min-h-screen overflow-hidden bg-white text-black px-8'>
      
      {/* 'big-black/80' কে পরিবর্তন করে 'bg-black/80' করা হয়েছে এবং ভেতরের টেক্সট সাদা (text-white) করা হয়েছে */}
      <header className="max-w-7xl mx-auto mt-8
        rounded-2xl
        bg-black/80 backdrop-blur-xl
        border border-white/10
        px-8 py-6
        shadow-[0_20px_45px_rgba(0,0,0,0.6)]
        text-white" 
      >
        {/* এখানে আপনার হেডারের কনটেন্ট লিখুন */}
        <h1 className="text-xl font-bold">Auth Header</h1>
      </header>
      
    </div>
  )
}

export default Auth



