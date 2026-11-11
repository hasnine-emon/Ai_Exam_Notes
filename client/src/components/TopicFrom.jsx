import React, {useState, useEffect} from 'react'
import { motion } from "motion/react"
import { generateNotes } from '../services/api';
import { useDispatch } from 'react-redux';
import { updateCredits } from '../redux/userSlice';

const SUBJECT = "Database Management System";
const CHAPTERS = [
  { id: 1, name: "Introduction to Database System (DBMS)" },
  { id: 2, name: "Relational Model and Schema" },
  { id: 3, name: "ACID Properties" },
  { id: 4, name: "Integrity Constraints" },
  { id: 5, name: "Entity-Relationship (ER) Model" },
  { id: 6, name: "Generalization, Specialization and Cardinality" },
  { id: 7, name: "Entity-Relationship Model: Design and Constraints" },
  { id: 8, name: "Normalization" },
  { id: 9, name: "SQL Joins" },
  { id: 10, name: "Transaction Processing Concepts" },
  { id: 11, name: "Schedules and Serializability" },
  { id: 12, name: "Failure Classification and Recovery" },
];
const EXAM_TYPES = [
  { value: "CT", hint: "Definitions +  questions with answers" },
  { value: "Quiz", hint: "25 MCQ with answers" },
  { value: "Mid Term", hint: "Definitions + medium questions " },
  { value: "Final", hint: "Many definitions +  medium and hard questions with answers" },
];

function TopicFrom({setResult, setLoading, loading , setError}) {
    const [selectedChapters, setSelectedChapters] = useState([]);
    const [examType, setExamType] = useState("");
    const [progress, setProgress] = useState(0);
    const [progressText, setProgressText] = useState("");
    const dispatch = useDispatch()

const toggleChapter = (id) => {
  setSelectedChapters((prev) =>
    prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
  );
};

const handleSubmit = async () => {
  if (selectedChapters.length === 0) {
    setError("Select at least one chapter");
    return;
  }
  if (!examType) {
    setError("Select an exam type");
    return;
  }
  setError("");
  setLoading(true);
  setResult(null);
  try{
    const result = await generateNotes({
      chapters: selectedChapters,
      examType});
    setResult(result.data);
    setLoading(false);
    setSelectedChapters([])
    setExamType("")

    if(typeof result.creditsLeft === "number"){
      dispatch(updateCredits(result.creditsLeft));
    } 

  }catch (error) {
    console.log(error);
    setError("Failed to generate questions. Please try again.");
    setLoading(false);
  }
}
useEffect(() => {
  if (!loading) {
    setProgress(0);
    setProgressText("");
    return;
  }

  let value = 0;

  const interval = setInterval(() => {
    value += Math.random() * 4;

    if (value >= 95) {
      value = 95;
      setProgressText("Almost done...");
      clearInterval(interval);
    } else if (value > 70) {
      setProgressText("Writing answers...");
    } else if (value > 40) {
      setProgressText("Preparing questions...");
    } else {
      setProgressText("Reading chapters...");
    }

    setProgress(Math.floor(value))

  }, 700)

  return () => clearInterval(interval);


}, [loading]);

const activeHint = EXAM_TYPES.find((e) => e.value === examType)?.hint;

  return (
    <motion.div 
    initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="
        rounded-2xl
        bg-gradient-to-br from-black/90 via-black/80 to-black/90
        backdrop-blur-2xl
        border border-white/10
        shadow-[0_20px_60px_rgba(0,0,0,0.75)]
        p-8
        space-y-6 
        text-white
        ">
            {/* 1. SUBJECT (fixed) */}
            <div>
              <p className='text-sm text-gray-300 mb-2'>Subject</p>
              <input type="text" className='w-full p-3 rounded-xl
              bg-white/10 backdrop-blur-lg
              border border-white/20
              text-white cursor-not-allowed opacity-80
              focus:outline-none' 
              value={SUBJECT}
              readOnly
              />
            </div>

            {/* 2. CHAPTERS (multiple) */}
            <div>
              <div className='flex items-center justify-between mb-2'>
                <p className='text-sm text-gray-300'>
                  Chapters <span className='text-gray-500'>({selectedChapters.length} selected)</span>
                </p>
                <div className='flex gap-3 text-xs'>
                  <button type="button" disabled={loading}
                    onClick={() => setSelectedChapters(CHAPTERS.map((c) => c.id))}
                    className='text-gray-300 hover:text-white underline-offset-2 hover:underline'>
                    Select all
                  </button>
                  <button type="button" disabled={loading}
                    onClick={() => setSelectedChapters([])}
                    className='text-gray-300 hover:text-white underline-offset-2 hover:underline'>
                    Clear
                  </button>
                </div>
              </div>
              <div className='grid grid-cols-1 sm:grid-cols-2 gap-2'>
                {CHAPTERS.map((c) => {
                  const active = selectedChapters.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      disabled={loading}
                      onClick={() => toggleChapter(c.id)}
                      className={`text-left px-3 py-2 rounded-xl text-sm border transition
                      ${active
                        ? "bg-green-500/20 border-green-400/50 text-green-200"
                        : "bg-white/5 border-white/15 text-gray-300 hover:bg-white/10"}`}
                    >
                      <span className='font-semibold'>Chapter {c.id}</span>
                      <span className='block text-xs opacity-80'>{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. EXAM TYPE */}
            <div>
              <p className='text-sm text-gray-300 mb-2'>Exam Type</p>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-2'>
                {EXAM_TYPES.map((e) => (
                  <button
                    key={e.value}
                    type="button"
                    disabled={loading}
                    onClick={() => setExamType(e.value)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium border transition
                    ${examType === e.value
                      ? "bg-white text-black border-white"
                      : "bg-white/5 border-white/15 text-gray-300 hover:bg-white/10"}`}
                  >
                    {e.value}
                  </button>
                ))}
              </div>
              {activeHint && (
                <p className='mt-2 text-xs text-gray-400'>{activeHint}</p>
              )}
            </div>

      <motion.button
      onClick={handleSubmit}
      whileHover={!loading ? {scale: 1.02 } : {}}
      whileTap={!loading ? {scale: 0.95 } : {}}
      disabled={loading}
  className={`
    w-full mt-4
    py-3 rounded-xl
    font-semibold
    flex items-center justify-center gap-3
    transition
    ${
      loading
        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
        : "bg-gradient-to-br from-white to-gray-200 text-black shadow-[0_15px_35px_rgba(0,0,0,0.4)]"
    }
  `}>
    {loading ? "Generating..." : "Generate Questions"}

    </motion.button>

    {loading && (
  <div className='mt-4 space-y-2'>

    <div className='w-full h-2 rounded-full bg-white/10 overflow-hidden'>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ ease: "easeOut", duration: 0.6 }}
        className="h-full bg-gradient-to-r from-green-400 via-emerald-400 to-green-500">

        </motion.div>

    </div>

    <div className='flex justify-between text-xs text-gray-300'>
      <span>{progressText}</span>
      <span>{progress}%</span>
    </div>

    <p className="text-xs text-gray-400 text-center">
      This may take a few minutes (Final with many chapters takes longer). Please don't close or refresh the page.
    </p>
   </div>
)}

    </motion.div>
  )
}

export default TopicFrom