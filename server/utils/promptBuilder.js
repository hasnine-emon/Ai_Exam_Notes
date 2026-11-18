export const buildPrompt = ({
  topic,
  classLevel,
  examType,
  revisionMode,
  includeDiagram,
  includeChart
}) => {
  return `
You are a STRICT JSON generator for an exam preparation system.
 
⚠️ VERY IMPORTANT:
- Output MUST be valid JSON
- Your response will be parsed using JSON.parse()
- INVALID JSON will cause system failure
- Use ONLY double quotes "
- NO comments, NO trailing commas
- Escape line breaks using \\n
- Do NOT use emojis inside text values
 
TASK:
Convert the given topic into exam-focused notes.
 
INPUT:
Topic: ${topic}
Class Level: ${classLevel || "Not specified"}
Exam Type: ${examType || "General"}
Revision Mode: ${revisionMode ? "ON" : "OFF"}
Include Diagram: ${includeDiagram ? "YES" : "NO"}
Include Charts: ${includeChart ? "YES" : "NO"}
 
GLOBAL CONTENT RULES:
- Use clear, simple, exam-oriented language
- Notes MUST be Markdown formatted
- Headings and bullet points only
 
REVISION MODE RULES (CRITICAL):
- If REVISION MODE is ON:
  - Notes must be VERY SHORT
  - Only bullet points
  - One-line answers only
  - Definitions, formulas, keywords
  - No paragraphs
  - No explanations
  - Content must feel like:
    - last-day revision
    - 5-minute exam cheat sheet
  - revisionPoints MUST summarize ALL important facts
 
- If REVISION MODE is OFF:
  - Notes must be DETAILED but exam-focused
  - Each topic should include:
    - definition
    - short explanation
    - examples (if applicable)
  - Paragraph length: max 2-4 lines
  - No storytelling, no extra theory
 
IMPORTANCE RULES:
- Divide sub-topics into THREE categories using :
  - ⭐ Very Important Topics
  - ⭐⭐ Important Topics
  - ⭐⭐⭐ Frequently Asked Topics
- All three categories MUST be present
- Base importance on exam frequency and weightage
 
DIAGRAM RULES:
- If INCLUDE DIAGRAM is YES:
  - diagram.data MUST be a SINGLE STRING
  - Valid Mermaid syntax only
  - Must start with: graph TD
  - Wrap EVERY node label in square brackets [ ]
  - Do NOT use special characters inside labels
- If INCLUDE DIAGRAM is NO:
  - diagram.data MUST be ""
 
CHART RULES (RECHARTS):
- If INCLUDE CHARTS is YES:
  - charts array MUST NOT be empty
  - Generate at least ONE chart
  - Choose chart type based on topic type:
    - THEORY topic → bar or pie (importance / weightage)
    - PROCESS topic → bar or line (steps / stages)
  - Use numeric values ONLY
  - Labels must be short and exam-oriented
- If INCLUDE CHARTS is NO:
  - charts MUST be []
 
CHART TYPES ALLOWED:
- bar
- line
- pie
 
CHART OBJECT FORMAT:
{
  "type": "bar | line | pie",
  "title": "string",
  "data": [
    { "name": "string", "value": 10 }
  ]
}
 
STRICT JSON FORMAT (DO NOT CHANGE ):
 
{
  "subTopics": {
    "⭐": [],
    "⭐⭐": [],
    "⭐⭐⭐": []
  },
  "importance": "⭐ | ⭐⭐ | ⭐⭐⭐",
  "notes": "string",
  "revisionPoints": [],
  "questions": {
    "short": [],
    "long": [],
    "diagram": ""
  },
  "diagram": {
    "type": "flowchart | graph | process",
    "data": ""
  },
  "charts": []
}
 
RETURN ONLY VALID JSON.
`;
};


export const buildExamPrompt = ({
  subject,
  examType,
  chapterNames,
  material,
  counts
}) => {
  const isQuiz = examType === "Quiz";

  const wanted = isQuiz
    ? `- mcqs: EXACTLY ${counts.mcq} multiple choice questions
- definitions, fiveMarkQuestions, mediumQuestions, hardQuestions MUST be []`
    : `- definitions: EXACTLY ${counts.definitions}
- fiveMarkQuestions: EXACTLY ${counts.fiveMark}
- mediumQuestions: EXACTLY ${counts.medium}
- hardQuestions: EXACTLY ${counts.hard}
- mcqs MUST be []`;

  return `
You are a STRICT JSON generator and an experienced university ${subject} teacher who sets exam questions.

VERY IMPORTANT (JSON RULES):
- Output MUST be valid JSON only. Your response is parsed with JSON.parse()
- Use ONLY double quotes. NO comments, NO trailing commas
- Inside string values write line breaks as \\n
- Triple backticks are allowed ONLY for code blocks inside answers (see rule 6)
- Do NOT use emojis
- Do NOT use markdown tables

TASK:
Prepare ${examType} exam practice material for the subject "${subject}".
Chapters covered: ${chapterNames.join(" | ")}

STUDY MATERIAL (text taken from the teacher's lecture slides):
=====
${material}
=====

CONTENT RULES:
- Base every definition, question and answer ONLY on concepts that appear in the STUDY MATERIAL above
- You may add a short standard example (like a small table, SQL query or bank/student/employee case) to explain a concept from the material
- Do NOT mention "slide", "material" or "the teacher" inside questions or answers
- Do NOT claim that a question came in any previous exam
- Questions must be different from each other and spread as evenly as possible across the chapters listed above
- Set the "chapter" field of every item to the exact chapter name it comes from
- Language: clear, simple exam English

WHAT TO GENERATE:
${wanted}

ITEM RULES:
1) definitions: each item is a term from the material with a precise exam-ready definition of 1-3 sentences.
2) fiveMarkQuestions (5 marks): each answer is 150-250 words, written the way a student would write a full 5 mark answer:
   start with a short definition or introduction, then 3-5 bullet points (use "- " bullets) or numbered points, then an example if relevant, then a one line conclusion.
3) mediumQuestions: need explanation and comparison or an example. Each answer is 250-350 words, well structured with short bold headings like **Definition**, **Explanation**, **Example**.
4) hardQuestions: analytical or application based (design, compare, solve a small case, find the error, normalize a table, check a schedule, draw and explain an ER design and so on) but solvable using only concepts from the material. Each answer is 300-450 words with clear steps.
5) mcqs: each has exactly 4 options (plain text, do NOT put A. B. C. D. inside the option text), exactly one correct option, plausible wrong options, and a one sentence explanation.
   Put the correct answer at different positions across questions. "answerIndex" is the 0-based index (0, 1, 2 or 3) of the correct option.
6) Inside answers use Markdown only for: **bold**, "- " bullet lists, "1. " numbered lists.
   For SQL or code, use a fenced code block: a line with three backticks and the word sql, then the code lines, then a line with three backticks (write each line break inside the JSON string as \\n).

STRICT JSON FORMAT (DO NOT CHANGE KEYS):

{
  "definitions": [
    { "chapter": "string", "term": "string", "definition": "string" }
  ],
  "fiveMarkQuestions": [
    { "chapter": "string", "question": "string", "answer": "string" }
  ],
  "mediumQuestions": [
    { "chapter": "string", "question": "string", "answer": "string" }
  ],
  "hardQuestions": [
    { "chapter": "string", "question": "string", "answer": "string" }
  ],
  "mcqs": [
    { "chapter": "string", "question": "string", "options": ["string", "string", "string", "string"], "answerIndex": 0, "explanation": "string" }
  ]
}

RETURN ONLY VALID JSON.
`;
};