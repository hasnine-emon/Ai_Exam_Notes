import React from 'react'

function LegacySidebar({result}) {

     if(!result ||
    !result.subTopics ||
    !result.questions ||
    !result.questions.short ||
    !result.questions.long){
        return null;
    }
  
  
  
    return (
    <div className='bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-6'>
        <div className='flex items-center gap-2'>

            <span className='text-xl'>📌</span>
            <h3 className='text-lg font-semibold text-indigo-600'>
                Quick Exam View
            </h3>
        </div>

        <section>
            <p className='text-sm font-semibold text-gray-700 mb-3'>
                ⭐ Sub Topics (Priority Wise)
            </p>
            {
                Object.entries(result.subTopics).map(([star , topics])=>(
                    <div key={star} className='mb-3
              rounded-lg
              bg-gray-50
              border border-gray-200
              p-3'>

                <p className='text-sm font-semibold text-yellow-600 mb-1'>
                    {star} Priority
                </p>
                <ul className='list-disc ml-4 text-sm text-gray-700 space-y-1'>
                    {topics.map((t,i)=>(
                        <li key={i}>{t}</li>
                    ))}
                </ul>
              </div>
                ))
            }

        </section>

        <section className='rounded-lg
        bg-yellow-50
        border border-yellow-200
        p-3'>


        <p className='text-sm font-semibold text-gray-700 mb-1'>
                🔥 Exam Importance
            </p>
            <span className='text-yellow-700 font-bold text-sm'>
                {result.importance}
            </span>
       
            <p className='text-sm mt-2 font-semibold text-gray-700 mb-3'>
             ❓ Important Questions
            </p>

            <div className='mb-4
          rounded-lg
          bg-indigo-50
          border border-indigo-200
          p-3'>
            <p className='text-sm font-medium text-indigo-700 mb-2'>
                   Short Questions
                </p>
                <ul className='list-disc ml-4 text-sm text-gray-700 space-y-1'>
                    {result.questions.short.map((t,i)=>(
                        <li key={i}>{t}</li>
                    ))}
                </ul>


          </div>


          <div className='mb-4
          rounded-lg
          bg-purple-50
          border border-purple-200
          p-3'>
            <p className='text-sm font-medium text-purple-700 mb-2'>
                   Long Questions
                </p>
                <ul className='list-disc ml-4 text-sm text-gray-700 space-y-1'>
                    {result.questions.long.map((t,i)=>(
                        <li key={i}>{t}</li>
                    ))}
                </ul>


          </div>


           <div className='mb-4
          rounded-lg
          bg-blue-50
          border border-blue-200
          p-3'>
            <p className='text-sm font-medium text-blue-700 mb-2'>
                   Diagram Question
                </p>
                <ul className='list-disc ml-4 text-sm text-gray-700 space-y-1'>
                    <li>{result.questions.diagram}</li>
                    
                </ul>


          </div>



        </section>



    </div>
  )
}
// NOTUN: CT / Quiz / Mid Term / Final result er sidebar
function ExamSidebar({result}) {
    const c = result.counts || {}
    const rows = [
        ["Definitions", c.definitions],
        ["5 Marks Questions", c.fiveMark],
        ["Medium Questions", c.medium],
        ["Hard Questions", c.hard],
        ["MCQ", c.mcq],
    ].filter(([, n]) => n > 0)

    return (
        <div className='bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-6'>
            <div className='flex items-center gap-2'>
                <span className='text-xl'>📌</span>
                <h3 className='text-lg font-semibold text-indigo-600'>Exam Overview</h3>
            </div>

            <section className='rounded-lg bg-yellow-50 border border-yellow-200 p-3'>
                <p className='text-sm font-semibold text-gray-700 mb-1'>Exam Type</p>
                <span className='text-yellow-700 font-bold text-sm'>{result.examType}</span>
                <p className='text-xs text-gray-500 mt-1'>{result.subject}</p>
            </section>

            <section className='rounded-lg bg-gray-50 border border-gray-200 p-3'>
                <p className='text-sm font-semibold text-gray-700 mb-2'>Chapters</p>
                <ul className='list-disc ml-4 text-sm text-gray-700 space-y-1'>
                    {(result.chapters || []).map((ch, i) => (
                        <li key={i}>{ch}</li>
                    ))}
                </ul>
            </section>

            <section className='rounded-lg bg-indigo-50 border border-indigo-200 p-3'>
                <p className='text-sm font-semibold text-indigo-700 mb-2'>What you got</p>
                <ul className='text-sm text-gray-700 space-y-1'>
                    {rows.map(([label, n]) => (
                        <li key={label} className='flex justify-between'>
                            <span>{label}</span>
                            <span className='font-semibold'>{n}</span>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    )
}


function Sidebar({result}) {
    if (result?.examType) {
        return <ExamSidebar result={result} />
    }
    return <LegacySidebar result={result} />
}


export default Sidebar