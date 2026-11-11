const Gemini_URL ="https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent";
export const generateGeminiResponse = async (prompt) => {
 try{
   const response = await fetch(`${Gemini_URL}?key=${process.env.GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            contents : [
                {
                    parts: [
                        {
                            text: prompt
                        }
                    ]
                }
            ],
         
            generationConfig: {
                responseMimeType: "application/json"
            }
        })
    })

    if (!response.ok) {
    const err = await response.text();
    throw new Error(err);
}
    const data = await response.json();
    const Text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!Text) {
        throw new Error("No text returned from Gemini");
    }

  
    try {
        return JSON.parse(Text);
    } catch {
        const cleanText = Text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
        return JSON.parse(cleanText);
    }
 }catch (error) {
    console.error("Error generating Gemini response:", error.message);
    throw new Error("Failed to generate response from Gemini API");
 }

}