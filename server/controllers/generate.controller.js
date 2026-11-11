import UserModel from "../models/user.model.js";
import { buildExamPrompt } from "../utils/promptBuilder.js";
import { generateGeminiResponse } from "../services/gemini.services.js";
import Notes from "../models/notes.model.js";
import { SUBJECT_NAME, getChaptersByIds } from "../utils/dbmsChapters.js";

const EXAM_TYPES = ["CT", "Quiz", "Mid Term", "Final"];
const CREDIT_COST = 10;          
const CHAPTERS_PER_CALL = 3;     
const QUIZ_MCQ_COUNT = 25;


const perChapterCounts = (examType, n) => {
  switch (examType) {
    case "CT":       return { definitions: 5 * n, fiveMark: 3 * n, medium: 5,     hard: 0,     mcq: 0 };
    case "Mid Term": return { definitions: 8 * n, fiveMark: 8 * n, medium: 8 * n,     hard: 8 * n, mcq: 0 };
    case "Final":    return { definitions: 12 * n, fiveMark: 12 * n, medium: 12 * n, hard: 12 * n, mcq: 0 };
    default:         return { definitions: 0,     fiveMark: 0,     medium: 0,     hard: 0,     mcq: QUIZ_MCQ_COUNT };
  }
};

const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

const buildMaterial = (chapters) =>
  chapters.map((c) => `### CHAPTER ${c.id}: ${c.name}\n${c.content}`).join("\n\n");

const str = (v) => (typeof v === "string" ? v.trim() : "");


const sanitize = (raw) => {
  const list = (v) => (Array.isArray(v) ? v : []);
  const qa = (item) => ({
    chapter: str(item?.chapter),
    question: str(item?.question),
    answer: str(item?.answer),
  });
  return {
    definitions: list(raw?.definitions)
      .map((d) => ({ chapter: str(d?.chapter), term: str(d?.term), definition: str(d?.definition) }))
      .filter((d) => d.term && d.definition),
    fiveMarkQuestions: list(raw?.fiveMarkQuestions).map(qa).filter((q) => q.question && q.answer),
    mediumQuestions: list(raw?.mediumQuestions).map(qa).filter((q) => q.question && q.answer),
    hardQuestions: list(raw?.hardQuestions).map(qa).filter((q) => q.question && q.answer),
    mcqs: list(raw?.mcqs)
      .map((m) => ({
        chapter: str(m?.chapter),
        question: str(m?.question),
        options: list(m?.options).map(str),
        answerIndex: Number.isInteger(m?.answerIndex) ? m.answerIndex : -1,
        explanation: str(m?.explanation),
      }))
      .filter(
        (m) =>
          m.question &&
          m.options.length === 4 &&
          m.options.every(Boolean) &&
          m.answerIndex >= 0 &&
          m.answerIndex <= 3
      ),
  };
};

const countsMatch = (data, counts) =>
  data.definitions.length >= counts.definitions &&
  data.fiveMarkQuestions.length >= counts.fiveMark &&
  data.mediumQuestions.length >= counts.medium &&
  data.hardQuestions.length >= counts.hard &&
  data.mcqs.length >= counts.mcq;

const total = (d) =>
  d.definitions.length + d.fiveMarkQuestions.length + d.mediumQuestions.length +
  d.hardQuestions.length + d.mcqs.length;


const generateBatch = async ({ examType, chapters, counts }) => {
  const prompt = buildExamPrompt({
    subject: SUBJECT_NAME,
    examType,
    chapterNames: chapters.map((c) => c.name),
    material: buildMaterial(chapters),
    counts,
  });

  let best = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const data = sanitize(await generateGeminiResponse(prompt));
      if (!best || total(data) > total(best)) best = data;
      if (countsMatch(data, counts)) break;
    } catch (err) {
      if (attempt === 2 && !best) throw err;
    }
  }
  if (!best || total(best) === 0) {
    throw new Error("AI did not return any questions. Please try again.");
  }
  return best;
};

export const generateNotes = async (req, res) => {
  try {
    const { chapters: chapterIds, examType } = req.body;

    if (!Array.isArray(chapterIds) || chapterIds.length === 0) {
      return res.status(400).json({ message: "Select at least one chapter" });
    }
    if (!EXAM_TYPES.includes(examType)) {
      return res.status(400).json({ message: "Select a valid exam type (CT, Quiz, Mid Term or Final)" });
    }

    const chapters = getChaptersByIds(chapterIds);
    if (chapters.length === 0) {
      return res.status(400).json({ message: "Selected chapters not found" });
    }

    const user = await UserModel.findById(req.userId);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }
    if (user.credits < CREDIT_COST) {
      user.isCreditAvailable = false;
      await user.save();
      return res.status(403).json({ message: "Insufficient credits" });
    }


    let merged = { definitions: [], fiveMarkQuestions: [], mediumQuestions: [], hardQuestions: [], mcqs: [] };

    if (examType === "Quiz") {
 
      merged = await generateBatch({
        examType,
        chapters,
        counts: perChapterCounts(examType, chapters.length),
      });
      merged.mcqs = merged.mcqs.slice(0, QUIZ_MCQ_COUNT);
    } else {

      for (const group of chunk(chapters, CHAPTERS_PER_CALL)) {
        const part = await generateBatch({
          examType,
          chapters: group,
          counts: perChapterCounts(examType, group.length),
        });
        merged.definitions.push(...part.definitions);
        merged.fiveMarkQuestions.push(...part.fiveMarkQuestions);
        merged.mediumQuestions.push(...part.mediumQuestions);
        merged.hardQuestions.push(...part.hardQuestions);
      }
    }

    const aiResponse = {
      examType,
      subject: SUBJECT_NAME,
      chapters: chapters.map((c) => `Chapter ${c.id}: ${c.name}`),
      counts: {
        definitions: merged.definitions.length,
        fiveMark: merged.fiveMarkQuestions.length,
        medium: merged.mediumQuestions.length,
        hard: merged.hardQuestions.length,
        mcq: merged.mcqs.length,
      },
      ...merged,
    };

    const notes = await Notes.create({
      user: user._id,
      topic: SUBJECT_NAME,
      classLevel: chapters.map((c) => `Chapter ${c.id}`).join(", "),
      chapters: aiResponse.chapters,
      examType,
      content: aiResponse,
    });

    user.credits -= CREDIT_COST;
    if (user.credits <= 0) {
      user.isCreditAvailable = false;
    }
    if (!Array.isArray(user.notes)) {
      user.notes = [];
    }
    user.notes.push(notes._id);
    await user.save();

    return res.status(200).json({
      data: aiResponse,
      notesId: notes._id,
      creditsLeft: user.credits,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Ai generation failed",
      message: error.message || "An error occurred while generating notes",
    });
  }
};