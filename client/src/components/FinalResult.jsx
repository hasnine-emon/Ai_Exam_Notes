import React from 'react'
import { useState } from 'react';
import ReactMarkdown from 'react-markdown'
import MermaidSetup from './MermaidSetup';
import RechartSetUp from './RechartSetUp';


const markDownComponent = {
    h1: ({ children }) => (
        <h1 className="text-2xl font-bold text-indigo-700 mt-6 mb-4 border-b pb-2">
            {children}
        </h1>
    ),
    h2: ({ children }) => (
        <h2 className="text-xl font-semibold text-indigo-600 mt-5 mb-3">
            {children}
        </h2>
    ),
    h3: ({ children }) => (
        <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-2">
            {children}
        </h3>
    ),
    p: ({ children }) => (
        <p className="text-gray-700 leading-relaxed mb-3">
            {children}
        </p>
    ),
    ul: ({ children }) => (
        <ul className="list-disc ml-6 space-y-1 text-gray-700">
            {children}
        </ul>
    ),
    li: ({ children }) => (
        <li className="marker:text-indigo-500">{children}</li>
    ),
}

function LegacyResult({result}) {
    const [quickRevision, setQuickRevision] = useState(false);



    if (
        !result ||
        !result.subTopics ||
        !result.questions ||
        !result.questions.short ||
        !result.questions.long ||
        !result.revisionPoints
    ) {
        return null;
    }




  return (
    <div className='mt-6 p-3 space-y-10 bg-white'>

       <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>

       <h2 className='text-3xl font-bold
          bg-gradient-to-r from-indigo-600 to-purple-600
          bg-clip-text text-transparent'>
                    📘 Generated Notes
                </h2>

            <div className='flex gap-3'>
                <button onClick={() => setQuickRevision(!quickRevision)} className={`
              px-4 py-2 rounded-lg text-sm font-medium transition
              ${quickRevision
                            ? "bg-green-600 text-white"
                            : "bg-green-100 text-green-700 hover:bg-green-200"}
            `}> {quickRevision ? "Exit Revision Mode" : "Quick Revision (5 min)"}</button>
                <button className='px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700'>
                        ⬇️ Download PDF
                </button>
            </div>

        </div>

        {!quickRevision && <section>

        <SectionHeader icon="⭐" title="Sub Topics" color="indigo" />

        {
            Object.entries(result.subTopics).map(([star , topics])=>(
                    <div key={star} className='mb-3
              '>

                <p className='font-medium text-indigo-600 mb-1'>
                    {star} Priority
                </p>
                <ul className='list-disc ml-6 text-gray-700'>
                    {topics.map((t,i)=>(
                        <li key={i}>{t}</li>
                    ))}
                </ul>
              </div>
                ))
        }

        </section>}



        {!quickRevision && <section>
         <SectionHeader icon="📝" title="Detailed Notes" color="purple" />
            
            <div className='bg-white border border-gray-200 rounded-xl p-6'>
               <ReactMarkdown components={markDownComponent}>

               {result.notes}
                
               </ReactMarkdown>

            </div>

        </section>}

        {quickRevision &&
            <section className='rounded-xl bg-gradient-to-r from-green-100 to-green-50 border border-green-200 p-6'>
                    <h3 className='font-bold text-green-700 mb-3 text-lg'>
                        ⚡ Exam Quick Revision Points
                    </h3>
                    <ul className='list-disc ml-6 space-y-1 text-gray-800'>
                        {result.revisionPoints.map((p, i) => (
                            <li key={i}>{p}</li>
                        ))}
                    </ul>

        </section>}



        {result.diagram?.data && <section>
                <SectionHeader icon="📊" title="Diagram" color="cyan" />

                <MermaidSetup diagram={result.diagram?.data} />
                <p className="mt-3 text-xs text-gray-500 italic">
                    ℹ️ If you need this diagram for future reference or revision,
                    you can save it by taking a screenshot.
                </p>

            </section>}


            {result.charts?.length > 0 &&
                <section>
                    <SectionHeader icon="📈" title="Visual Charts" color="indigo" />
                    <RechartSetUp charts={result.charts} />
                    <p className="mt-3 text-xs text-gray-500 italic">
                        ℹ️ If you need this Chart for future reference or revision,
                        you can save it by taking a screenshot.
                    </p>

                </section>}

            {result.charts && result.charts.length === 0 && (
                <p className="text-sm text-gray-400 italic">
                    📉 Charts are not relevant for this topic.
                </p>
            )}


        <section>
                <SectionHeader icon="❓" title="Important Questions" color="rose" />

                <p className='font-medium'>Short Questions:</p>
                <ul className='list-disc ml-6 text-gray-700'>
                    {result.questions.short.map((q, i) => (
                        <li key={i}>{q}</li>
                    ))}
                </ul>


                <p className='font-medium mt-4'>Long Questions:</p>
                <ul className='list-disc ml-6 text-gray-700'>
                    {result.questions.long.map((q, i) => (
                        <li key={i}>{q}</li>
                    ))}
                </ul>
                <p className='font-medium mt-4'>Diagram Question:</p>
                <ul className='list-disc ml-6 text-gray-700'>
                    <li>{result.questions.diagram}</li>
                </ul>

            </section>



    </div>
  )
}


function SectionHeader({ icon, title, color }) {
    const colors = {
        indigo: "from-indigo-100 to-indigo-50 text-indigo-700",
        purple: "from-purple-100 to-purple-50 text-purple-700",
        blue: "from-blue-100 to-blue-50 text-blue-700",
        green: "from-green-100 to-green-50 text-green-700",
        cyan: "from-cyan-100 to-cyan-50 text-cyan-700",
        rose: "from-rose-100 to-rose-50 text-rose-700",
    };
    return (
        <div className={`
        mb-4 px-4 py-2 rounded-lg
        bg-gradient-to-r ${colors[color]}
        font-semibold flex items-center gap-2
      `}>
            <span>{icon}</span>
            <span>{title}</span>
        </div>

    )
}

const answerMarkdown = {
    ...markDownComponent,
    p: ({ children }) => (
        <p className="text-gray-700 leading-relaxed mb-2">{children}</p>
    ),
    ol: ({ children }) => (
        <ol className="list-decimal ml-6 space-y-1 text-gray-700 mb-2">{children}</ol>
    ),
    strong: ({ children }) => (
        <strong className="font-semibold text-gray-900">{children}</strong>
    ),
    pre: ({ children }) => (
        <pre className="bg-gray-900 text-gray-100 text-sm rounded-lg p-3 my-3 overflow-x-auto">{children}</pre>
    ),
    code: ({ children }) => (
        <code className="font-mono text-[0.85em] bg-gray-100 text-pink-700 px-1 rounded">{children}</code>
    ),
}

const LETTERS = ["A", "B", "C", "D"]

function ExamResult({ result }) {
    const [showAnswers, setShowAnswers] = useState(true);
    const definitions = result.definitions || []
    const fiveMark = result.fiveMarkQuestions || []
    const medium = result.mediumQuestions || []
    const hard = result.hardQuestions || []
    const mcqs = result.mcqs || []
    const nothing = !definitions.length && !fiveMark.length && !medium.length && !hard.length && !mcqs.length

    return (
        <div className='mt-6 p-3 space-y-10 bg-white'>

            <div className='flex flex-col md:flex-row md:items-start md:justify-between gap-4'>
                <div>
                    <h2 className='text-3xl font-bold
                    bg-gradient-to-r from-indigo-600 to-purple-600
                    bg-clip-text text-transparent'>
                        📘 {result.examType} Questions
                    </h2>
                    <p className='text-sm text-gray-500 mt-1'>{result.subject}</p>
                    <div className='flex flex-wrap gap-2 mt-3'>
                        {(result.chapters || []).map((c, i) => (
                            <span key={i} className='text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100'>
                                {c}
                            </span>
                        ))}
                    </div>
                </div>
                <button
                    onClick={() => setShowAnswers(!showAnswers)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition shrink-0
                    ${showAnswers
                        ? "bg-green-600 text-white"
                        : "bg-green-100 text-green-700 hover:bg-green-200"}`}
                >
                    {showAnswers ? "Hide Answers" : "Show Answers"}
                </button>
            </div>

            {nothing && (
                <p className='text-gray-500'>No questions were generated. Please try again.</p>
            )}

            {definitions.length > 0 && (
                <section>
                    <SectionHeader icon="📖" title={`Definitions (${definitions.length})`} color="blue" />
                    <ol className='space-y-3'>
                        {definitions.map((d, i) => (
                            <li key={i} className='rounded-xl border border-gray-200 p-4'>
                                <p className='font-semibold text-gray-900'>{i + 1}. {d.term}</p>
                                {d.chapter && <p className='text-xs text-gray-400 mb-1'>{d.chapter}</p>}
                                {showAnswers && <p className='text-gray-700 leading-relaxed'>{d.definition}</p>}
                            </li>
                        ))}
                    </ol>
                </section>
            )}

            <QuestionSection icon="📝" title="5 Marks Questions" color="purple" items={fiveMark} showAnswers={showAnswers} />
            <QuestionSection icon="📚" title="Medium Questions" color="green" items={medium} showAnswers={showAnswers} />
            <QuestionSection icon="🔥" title="Hard Questions" color="rose" items={hard} showAnswers={showAnswers} />

            {mcqs.length > 0 && (
                <section>
                    <SectionHeader icon="✅" title={`MCQ (${mcqs.length})`} color="cyan" />
                    <ol className='space-y-4'>
                        {mcqs.map((m, i) => (
                            <li key={i} className='rounded-xl border border-gray-200 p-4'>
                                <p className='font-semibold text-gray-900'>{i + 1}. {m.question}</p>
                                <ul className='mt-3 space-y-2'>
                                    {m.options.map((o, j) => {
                                        const correct = showAnswers && j === m.answerIndex
                                        return (
                                            <li key={j} className={`px-3 py-2 rounded-lg text-sm border
                                            ${correct
                                                ? "bg-green-50 border-green-300 text-green-800 font-medium"
                                                : "bg-gray-50 border-gray-200 text-gray-700"}`}>
                                                <span className='font-semibold mr-2'>{LETTERS[j]}.</span>{o}
                                                {correct && <span className='ml-2'>✔</span>}
                                            </li>
                                        )
                                    })}
                                </ul>
                                {showAnswers && (
                                    <p className='mt-3 text-sm text-gray-600'>
                                        <span className='font-semibold text-green-700'>Answer: {LETTERS[m.answerIndex]}.</span>{" "}
                                        {m.explanation}
                                    </p>
                                )}
                            </li>
                        ))}
                    </ol>
                </section>
            )}

        </div>
    )
}

function QuestionSection({ icon, title, color, items, showAnswers }) {
    if (!items || items.length === 0) return null
    return (
        <section>
            <SectionHeader icon={icon} title={`${title} (${items.length})`} color={color} />
            <ol className='space-y-5'>
                {items.map((q, i) => (
                    <li key={i} className='rounded-xl border border-gray-200 p-4'>
                        <p className='font-semibold text-gray-900'>{i + 1}. {q.question}</p>
                        {q.chapter && <p className='text-xs text-gray-400 mt-1'>{q.chapter}</p>}
                        {showAnswers && (
                            <div className='mt-3 rounded-lg bg-gray-50 border border-gray-100 p-4'>
                                <p className='text-xs font-semibold text-indigo-600 mb-2'>ANSWER</p>
                                <ReactMarkdown components={answerMarkdown}>{q.answer}</ReactMarkdown>
                            </div>
                        )}
                    </li>
                ))}
            </ol>
        </section>
    )
}

// Notun shape (examType ache) hole ExamResult, na hole purono LegacyResult
function FinalResult({result}) {
    if (result?.examType) {
        return <ExamResult result={result} />
    }
    return <LegacyResult result={result} />
}


export default FinalResult