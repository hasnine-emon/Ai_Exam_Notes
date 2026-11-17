import PDFDocument from "pdfkit"
import fs from "fs"
import path from "path"
import { createRequire } from "module"

const require = createRequire(import.meta.url)

const loadFonts = () => {
    try {
        const pkgJson = require.resolve("dejavu-fonts-ttf/package.json")
        const dir = path.join(path.dirname(pkgJson), "ttf")
        const fonts = {
            regular: path.join(dir, "DejaVuSans.ttf"),
            bold: path.join(dir, "DejaVuSans-Bold.ttf"),
            mono: path.join(dir, "DejaVuSansMono.ttf"),
        }
        if (Object.values(fonts).every((f) => fs.existsSync(f))) {
            return { ...fonts, unicode: true }
        }
    } catch (e) {
        
    }
    return { regular: "Helvetica", bold: "Helvetica-Bold", mono: "Courier", unicode: false }
}

const ASCII_MAP = {
    "→": "->", "←": "<-", "↔": "<->", "⇒": "=>", "≥": ">=", "≤": "<=", "≠": "!=", "−": "-", "×": "x", "÷": "/",
    "σ": "sigma", "π": "pi", "ρ": "rho", "⋈": "JOIN", "∪": "U", "∩": "n", "∧": "AND", "∨": "OR", "¬": "NOT",
    "∈": "in", "∉": "not in", "∅": "{}", "✔": "(correct)", "✓": "(correct)", "✗": "x", "≈": "~", "∞": "infinity",
}
const toLatinSafe = (text) =>
    String(text)
        .replace(/[→←↔⇒≥≤≠−×÷σπρ⋈∪∩∧∨¬∈∉∅✔✓✗≈∞]/g, (c) => ASCII_MAP[c] ?? "?")
        .replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\u00FF\u2018\u2019\u201C\u201D\u2013\u2014\u2022\u2026]/g, "?")

const makeWriter = (doc, F) => {
    const t = (s) => (F.unicode ? String(s) : toLatinSafe(s))
    const left = () => doc.page.margins.left
    const width = () => doc.page.width - doc.page.margins.left - doc.page.margins.right
    const ensureSpace = (h) => {
        if (doc.y + h > doc.page.height - doc.page.margins.bottom) doc.addPage()
    }


    const inline = (text, opts = {}) => {
        const clean = t(text).replace(/`([^`]+)`/g, "$1")
        const parts = clean.split(/(\*\*[^*]+\*\*)/g).filter((p) => p !== "")
        if (parts.length === 0) parts.push("")
        parts.forEach((p, i) => {
            const isBold = p.startsWith("**") && p.endsWith("**") && p.length > 4
            doc.font(isBold ? F.bold : F.regular).text(isBold ? p.slice(2, -2) : p, {
                ...opts,
                continued: i < parts.length - 1,
            })
        })
        doc.font(F.regular)
    }

    const markdown = (text, size = 10.5) => {
        doc.font(F.regular).fontSize(size).fillColor("#222222")
        const lines = String(text || "").replace(/\r/g, "").split("\n")
        let inCode = false
        for (const raw of lines) {
            if (raw.trim().startsWith("```")) {
                inCode = !inCode
                if (inCode) doc.moveDown(0.2)
                continue
            }
            if (inCode) {
                const lineH = size + 3
                ensureSpace(lineH)
                const y = doc.y
                doc.save().rect(left() + 10, y - 1, width() - 10, lineH).fill("#f1f3f5").restore()
                doc.font(F.mono).fontSize(size - 1).fillColor("#111111")
                    .text(t(raw) || " ", left() + 14, y + 1, { width: width() - 18, lineBreak: false })
                doc.x = left()
                doc.y = y + lineH
                doc.font(F.regular).fontSize(size).fillColor("#222222")
                continue
            }
            const line = raw.trimEnd()
            if (!line.trim()) { doc.moveDown(0.3); continue }

            const heading = line.match(/^#{1,6}\s+(.*)$/)
            if (heading) {
                doc.moveDown(0.2)
                doc.font(F.bold).fontSize(size + 0.5).text(t(heading[1]).replace(/\*\*/g, ""), left(), doc.y, { width: width() })
                doc.font(F.regular).fontSize(size)
                continue
            }
            const bullet = line.match(/^(\s*)[-*]\s+(.*)$/)
            if (bullet) {
                const indent = 14 + Math.min(bullet[1].length, 8) * 3
                ensureSpace(size + 8)
                const y = doc.y
                doc.text("•", left() + indent - 10, y, { width: 10, lineBreak: false })
                doc.x = left() + indent
                doc.y = y
                inline(bullet[2], { width: width() - indent })
                doc.x = left()
                continue
            }
            const num = line.match(/^(\s*)(\d+)[.)]\s+(.*)$/)
            if (num) {
                const indent = 18
                ensureSpace(size + 8)
                const y = doc.y
                doc.text(`${num[2]}.`, left(), y, { width: indent - 3, lineBreak: false })
                doc.y = y
                doc.x = left() + indent
                inline(num[3], { width: width() - indent })
                doc.x = left()
                continue
            }
            doc.x = left()
            inline(line, { width: width() })
        }
        doc.x = left()
    }

    const sectionTitle = (title) => {
        ensureSpace(60)
        doc.moveDown(0.8)
        const y = doc.y
        doc.save().rect(left(), y, width(), 24).fill("#eef2ff").restore()
        doc.font(F.bold).fontSize(13).fillColor("#3730a3")
            .text(t(title), left() + 8, y + 6, { width: width() - 16, lineBreak: false })
        doc.x = left()
        doc.y = y + 32
        doc.fillColor("#222222").font(F.regular)
    }

    return { t, markdown, sectionTitle, inline, ensureSpace, left, width }
}


const buildExamPdf = (doc, result, F) => {
    const w = makeWriter(doc, F)
    const LETTERS = ["A", "B", "C", "D"]

    doc.font(F.bold).fontSize(22).fillColor("#111111").text("ExamNotes AI", { align: "center" })
    doc.moveDown(0.3)
    doc.font(F.bold).fontSize(15).fillColor("#3730a3")
        .text(w.t(`${result.examType} Questions`), { align: "center" })
    doc.font(F.regular).fontSize(11).fillColor("#555555")
        .text(w.t(result.subject || ""), { align: "center" })
    doc.moveDown(0.6)
    doc.font(F.bold).fontSize(10).fillColor("#222222").text("Chapters:")
    doc.font(F.regular).fontSize(10)
    ;(result.chapters || []).forEach((c) => doc.text(w.t(`- ${c}`)))
    doc.moveDown(0.3)
    doc.fontSize(9).fillColor("#777777").text(`Generated on ${new Date().toLocaleDateString("en-GB")}`)
    doc.fillColor("#222222")

    const defs = result.definitions || []
    if (defs.length) {
        w.sectionTitle(`Definitions (${defs.length})`)
        defs.forEach((d, i) => {
            w.ensureSpace(50)
            doc.font(F.bold).fontSize(11).fillColor("#111111").text(w.t(`${i + 1}. ${d.term}`), { width: w.width() })
            doc.font(F.regular).fontSize(10.5).fillColor("#222222").text(w.t(d.definition), { width: w.width(), indent: 14 })
            doc.moveDown(0.5)
        })
    }

    const questionBlock = (title, items) => {
        if (!items || !items.length) return
        w.sectionTitle(`title({items.length})`)
        items.forEach((q, i) => {
            w.ensureSpace(80)
            doc.font(F.bold).fontSize(11.5).fillColor("#111111").text(w.t(`Q${i + 1}. ${q.question}`), w.left(), doc.y, { width: w.width() })
            if (q.chapter) doc.font(F.regular).fontSize(8.5).fillColor("#888888").text(w.t(q.chapter), { width: w.width() })
            doc.moveDown(0.3)
            doc.font(F.bold).fontSize(9).fillColor("#4f46e5").text("ANSWER", w.left(), doc.y)
            doc.moveDown(0.1)
            w.markdown(q.answer)
            doc.moveDown(0.9)
        })
    }
    questionBlock("5 Marks Questions", result.fiveMarkQuestions)
    questionBlock("Medium Questions", result.mediumQuestions)
    questionBlock("Hard Questions", result.hardQuestions)

    const mcqs = result.mcqs || []
    if (mcqs.length) {
        w.sectionTitle(`MCQ (${mcqs.length})`)
        mcqs.forEach((m, i) => {
            w.ensureSpace(110)
            doc.font(F.bold).fontSize(11).fillColor("#111111").text(w.t(`${i + 1}. ${m.question}`), w.left(), doc.y, { width: w.width() })
            doc.moveDown(0.2)
            m.options.forEach((o, j) => {
                const correct = j === m.answerIndex
                doc.font(correct ? F.bold : F.regular).fontSize(10.5)
                    .fillColor(correct ? "#166534" : "#222222")
                    .text(w.t(`${LETTERS[j]}. o{correct ? "   (correct)" : ""}`), w.left() + 14, doc.y, { width: w.width() - 14 })
            })
            doc.font(F.regular).fontSize(9.5).fillColor("#555555")
                .text(w.t(`Answer: ${LETTERS[m.answerIndex]}. ${m.explanation || ""}`), w.left(), doc.y + 3, { width: w.width() })
            doc.fillColor("#222222")
            doc.moveDown(0.8)
        })

       
        w.sectionTitle("Answer Key")
        doc.font(F.regular).fontSize(10.5).fillColor("#222222")
            .text(mcqs.map((m, i) => `i+1-{LETTERS[m.answerIndex]}`).join("    "), w.left(), doc.y, { width: w.width() })
    }
}


const buildLegacyPdf = (doc, result) => {
    doc.fontSize(20).text("ExamNotes AI", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`Importance: ${result.importance}`);
    doc.moveDown();

    doc.fontSize(16).text("Sub Topics");
    doc.moveDown(0.5);
    Object.entries(result.subTopics || {}).forEach(([star, topics]) => {
        doc.moveDown(0.5);
        doc.fontSize(13).text(`${star} Topics:`);
        topics.forEach((t) => {
            doc.fontSize(12).text(`• ${t}`);
        });
    });
    doc.moveDown();

    doc.fontSize(16).text("Notes");
    doc.moveDown(0.5);
    doc.fontSize(12).text(String(result.notes || "").replace(/[#*]/g, ""));
    doc.moveDown();

    doc.fontSize(16).text("Revision Points");
    doc.moveDown(0.5);
    ;(result.revisionPoints || []).forEach((p) => {
        doc.fontSize(12).text(`• ${p}`);
    });
    doc.moveDown();

    doc.fontSize(16).text("Important Questions");
    doc.moveDown(0.5);
    doc.fontSize(13).text("Short Questions:");
    ;(result.questions?.short || []).forEach((q) => {
        doc.fontSize(12).text(`• ${q}`);
    });
    doc.moveDown(0.5);
    doc.fontSize(13).text("Long Questions:");
    ;(result.questions?.long || []).forEach((q) => {
        doc.fontSize(12).text(`• ${q}`);
    });
    doc.moveDown(0.5);
    doc.fontSize(13).text("Diagram Questions:");
    doc.fontSize(12).text(result.questions?.diagram || "");
}

export const pdfDownload = async (req, res) => {
    try {
        const { result } = req.body;

        if (!result) {
            return res.status(400).json({ error: "No content provided" });
        }
        const isExam = Boolean(result.examType)
        if (!isExam && !result.subTopics) {
            return res.status(400).json({ error: "Unsupported content" });
        }

        const doc = new PDFDocument({ margin: 50, bufferPages: true })

        res.setHeader("Content-Type", "application/pdf")
        res.setHeader("Content-Disposition",
            'attachment; filename="ExamNotesAI.pdf"')

        doc.pipe(res)

        if (isExam) {
            const F = loadFonts()
            buildExamPdf(doc, result, F)

    
            const range = doc.bufferedPageRange()
            for (let i = range.start; i < range.start + range.count; i++) {
                doc.switchToPage(i)
                const oldBottom = doc.page.margins.bottom
                doc.page.margins.bottom = 0   
                doc.font(F.regular).fontSize(8).fillColor("#888888")
                    .text(`ExamNotes AI  |  Page ${i - range.start + 1} of ${range.count}`,
                        0, doc.page.height - 30, { width: doc.page.width, align: "center", lineBreak: false })
                doc.page.margins.bottom = oldBottom
            }
        } else {
            buildLegacyPdf(doc, result)
        }

        doc.end();
    } catch (error) {
        console.error("PDF error:", error)
        if (!res.headersSent) {
            return res.status(500).json({ error: "PDF generation failed" })
        }
        res.end()
    }
}
