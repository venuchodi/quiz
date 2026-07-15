import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { Quiz, Attempt, Question, DashboardStats, Difficulty } from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase body limit for base64 file uploads (PDFs/Images)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Google GenAI on the server
// User-Agent: aistudio-build for telemetry tracking
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// In-memory data store with comprehensive preloaded mock data to populate charts immediately
const quizzes: Record<string, Quiz> = {
  "PHOTOS": {
    code: "PHOTOS",
    config: {
      title: "Photosynthesis & Cellular Energy",
      description: "A conceptual and application-based quiz on chloroplasts, light-dependent reactions, and ATP synthesis.",
      subject: "Biology",
      difficulty: "medium",
      questionCount: 8,
      timeLimit: 10,
      negativeMarking: false,
      passingScore: 50,
      shuffleQuestions: false,
      shuffleOptions: false
    },
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    questions: [
      {
        id: "q1",
        text: "Which of the following pigments is directly responsible for initiating the light-dependent reactions of photosynthesis by absorbing photons?",
        options: [
          "Chlorophyll a",
          "Chlorophyll b",
          "Beta-carotene",
          "Xanthophyll"
        ],
        correctAnswer: "Chlorophyll a",
        explanation: "Chlorophyll a is the primary photosynthetic pigment in the reaction center that absorbs blue-violet and red light, converting light energy into chemical energy during the light reactions.",
        difficulty: "easy",
        bloomTaxonomy: "Remembering",
        learningOutcome: "Identify primary and accessory photosynthetic pigments and their functions."
      },
      {
        id: "q2",
        text: "During the light-dependent reactions, water molecules are split (photolysis). What is the primary evolutionary advantage of this process?",
        options: [
          "To provide electrons to replace those lost by Photosystem II",
          "To generate molecular oxygen for aerobic cellular respiration",
          "To synthesize glucose directly in the thylakoid lumen",
          "To reduce carbon dioxide into rubisco enzyme complex"
        ],
        correctAnswer: "To provide electrons to replace those lost by Photosystem II",
        explanation: "Water photolysis splits H2O into protons, electrons, and oxygen. The generated electrons replenish the oxidized reaction center (P680) of Photosystem II, enabling continuous photosynthetic electron transport.",
        difficulty: "medium",
        bloomTaxonomy: "Understanding",
        learningOutcome: "Analyze the molecular role of water photolysis in electron transport chains."
      },
      {
        id: "q3",
        text: "An experimental herbicide blocks the flow of electrons from Plastoquinone to Cytochrome b6f. What would be the immediate consequence on chloroplast activity?",
        options: [
          "Proton gradient formation will drop, halting ATP synthesis",
          "NADPH production will double due to energy accumulation",
          "Photosystem I will absorb double the light energy",
          "Water photolysis will accelerate to bypass the blockage"
        ],
        correctAnswer: "Proton gradient formation will drop, halting ATP synthesis",
        explanation: "The Cytochrome b6f complex is responsible for pumping protons into the thylakoid lumen. Blocking electron flow to it stops proton translocation, destroying the proton-motive force needed by ATP synthase.",
        difficulty: "hard",
        bloomTaxonomy: "Analyzing",
        learningOutcome: "Evaluate the downstream effects of electron transport inhibitors on chemiosmosis."
      },
      {
        id: "q4",
        text: "Assertion (A): CAM plants open their stomata at night and close them during the day.\nReason (R): This adaptation minimizes water loss through transpiration in extremely arid environments.",
        options: [
          "Both A and R are true, and R is the correct explanation of A.",
          "Both A and R are true, but R is NOT the correct explanation of A.",
          "A is true, but R is false.",
          "A is false, but R is true."
        ],
        correctAnswer: "Both A and R are true, and R is the correct explanation of A.",
        explanation: "CAM plants fix CO2 into organic acids at night (when temperatures are cooler and relative humidity is higher) to avoid dehydrating during high-heat daytime hours.",
        difficulty: "medium",
        bloomTaxonomy: "Evaluating",
        learningOutcome: "Compare photosynthetic adaptations (C3, C4, CAM) to arid climates."
      },
      {
        id: "q5",
        text: "Which of the following best describes the regulatory role of Rubisco in the Calvin Cycle?",
        options: [
          "It catalyzes the carboxylation of Ribulose 1,5-bisphosphate (RuBP)",
          "It acts as a structural channel for ATP diffusion into the stroma",
          "It hydrolyzes water to release protons into the lumen",
          "It phosphorylates 3-phosphoglycerate (3-PGA) using ATP"
        ],
        correctAnswer: "It catalyzes the carboxylation of Ribulose 1,5-bisphosphate (RuBP)",
        explanation: "Rubisco is the key carbon-fixing enzyme, catalyzing the addition of inorganic carbon dioxide (CO2) to RuBP, initiating the light-independent Calvin cycle reactions.",
        difficulty: "medium",
        bloomTaxonomy: "Remembering",
        learningOutcome: "Demonstrate carbon fixation catalysis mechanism and Rubisco function."
      },
      {
        id: "q6",
        text: "If a plant is kept in a sealed container under green-only monochromatic light, what will most likely happen to its rate of starch accumulation?",
        options: [
          "Starch accumulation will decrease to zero because green light is reflected rather than absorbed.",
          "Starch accumulation will double because green light carries higher frequency energy.",
          "Starch accumulation will remain constant as long as water is supplied.",
          "Starch accumulation will slow but continue via carotenoid auxiliary absorption."
        ],
        correctAnswer: "Starch accumulation will decrease to zero because green light is reflected rather than absorbed.",
        explanation: "Chlorophyll pigments absorb red and blue wavelengths and reflect green light. Since green light is mostly reflected, light reactions cannot proceed, stopping Calvin Cycle starch production.",
        difficulty: "hard",
        bloomTaxonomy: "Applying",
        learningOutcome: "Apply pigment absorption spectra graphs to predict physiological outcomes."
      },
      {
        id: "q7",
        text: "What is the stoichiometric ratio of ATP and NADPH required to synthesize one single molecule of glucose (6-carbon) in the Calvin Cycle?",
        options: [
          "18 ATP : 12 NADPH",
          "12 ATP : 12 NADPH",
          "9 ATP : 6 NADPH",
          "36 ATP : 24 NADPH"
        ],
        correctAnswer: "18 ATP : 12 NADPH",
        explanation: "To fix 1 CO2, 3 ATP and 2 NADPH are consumed. Since a glucose molecule requires fixing 6 CO2 molecules, the stoichiometric requirement is 18 ATP and 12 NADPH.",
        difficulty: "medium",
        bloomTaxonomy: "Understanding",
        learningOutcome: "Calculate energetic requirements and stoichiometry of dark reactions."
      },
      {
        id: "q8",
        text: "Which of the following is a direct output of Photosystem I (PSI) electron transport?",
        options: [
          "The reduction of NADP+ to NADPH by ferredoxin-NADP+ reductase",
          "The direct synthesis of G3P sugar molecules",
          "The generation of the oxygen gas by-product",
          "The oxidation of plastocyanin to start the Q-cycle"
        ],
        correctAnswer: "The reduction of NADP+ to NADPH by ferredoxin-NADP+ reductase",
        explanation: "Electrons from Photosystem I are transferred to ferredoxin and then to NADP+ reductase, reducing NADP+ to NADPH, which is then used as reducing power in the Calvin cycle.",
        difficulty: "easy",
        bloomTaxonomy: "Remembering",
        learningOutcome: "Trace photosynthetic linear electron pathways and primary outputs."
      }
    ]
  },
  "PYTHON": {
    code: "PYTHON",
    config: {
      title: "Python Basics & Control Flow",
      description: "An introductory assessment on variables, lists, and for/while loops in Python.",
      subject: "Computer Science",
      difficulty: "easy",
      questionCount: 5,
      timeLimit: 10,
      negativeMarking: false,
      passingScore: 50,
      shuffleQuestions: false,
      shuffleOptions: false
    },
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    questions: [
      {
        id: "p1",
        text: "What is the output of the following Python code snippet?\n\n```python\nx = [1, 2, 3]\ny = x\ny.append(4)\nprint(x)\n```",
        options: [
          "[1, 2, 3, 4]",
          "[1, 2, 3]",
          "Error: y is not defined",
          "[1, 2, 3, [4]]"
        ],
        correctAnswer: "[1, 2, 3, 4]",
        explanation: "In Python, lists are mutable objects and assigning 'y = x' copies the reference to the list. Modifying 'y' also modifies 'x' because they refer to the same list in memory.",
        difficulty: "easy",
        bloomTaxonomy: "Understanding",
        learningOutcome: "Explain list reference mutability versus copying."
      },
      {
        id: "p2",
        text: "Which of the following is NOT a valid variable name in Python?",
        options: [
          "2_global_data",
          "_global_data",
          "global_data_2",
          "GLOBAL_DATA"
        ],
        correctAnswer: "2_global_data",
        explanation: "Python identifier naming rules state that variable names cannot begin with a number. They must start with a letter or an underscore.",
        difficulty: "easy",
        bloomTaxonomy: "Remembering",
        learningOutcome: "Apply standard naming conventions and syntax checks."
      },
      {
        id: "p3",
        text: "What will be the output of the following loop?\n\n```python\ni = 1\nwhile i < 5:\n    print(i, end=' ')\n    if i == 3:\n        break\n    i += 1\n```",
        options: [
          "1 2 3",
          "1 2 3 4",
          "1 2",
          "1 2 3 4 5"
        ],
        correctAnswer: "1 2 3",
        explanation: "The loop starts with i=1. It prints 1, increments to 2. Prints 2, increments to 3. Prints 3, hits the conditional 'i == 3' and triggers the 'break' statement, immediately exiting the loop.",
        difficulty: "medium",
        bloomTaxonomy: "Applying",
        learningOutcome: "Trace loop execution and interrupt conditions."
      },
      {
        id: "p4",
        text: "What does the statement `print('Hello' * 3)` output in Python?",
        options: [
          "HelloHelloHello",
          "Hello Hello Hello",
          "Error: Cannot multiply string with integer",
          "['Hello', 'Hello', 'Hello']"
        ],
        correctAnswer: "HelloHelloHello",
        explanation: "The '*' operator applied to a string and an integer performs string repetition, concatenating the string with itself the specified number of times.",
        difficulty: "easy",
        bloomTaxonomy: "Understanding",
        learningOutcome: "Demonstrate string operator behavior and repetitions."
      },
      {
        id: "p5",
        text: "Which method is used to remove and return the last item from a list in Python?",
        options: [
          "pop()",
          "remove()",
          "delete()",
          "discard()"
        ],
        correctAnswer: "pop()",
        explanation: "The 'pop()' method removes and returns the item at the given index (default is the last item: -1). 'remove()' deletes by value and does not return the value.",
        difficulty: "easy",
        bloomTaxonomy: "Remembering",
        learningOutcome: "Recall common native Python list operations."
      }
    ]
  }
};

const attempts: Attempt[] = [
  // Photosynthesis attempts
  {
    id: "att1",
    quizCode: "PHOTOS",
    studentName: "Alex Mercer",
    answers: {
      "q1": "Chlorophyll a",
      "q2": "To provide electrons to replace those lost by Photosystem II",
      "q3": "Proton gradient formation will drop, halting ATP synthesis",
      "q4": "Both A and R are true, and R is the correct explanation of A.",
      "q5": "It catalyzes the carboxylation of Ribulose 1,5-bisphosphate (RuBP)",
      "q6": "Starch accumulation will decrease to zero because green light is reflected rather than absorbed.",
      "q7": "18 ATP : 12 NADPH",
      "q8": "The reduction of NADP+ to NADPH by ferredoxin-NADP+ reductase"
    },
    score: 8,
    totalQuestions: 8,
    percentage: 100,
    timeTaken: 342,
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000).toISOString(),
    questionFeedback: {}, // Filled dynamically or on load
    aiSuggestions: "Outstanding masterclass performance! You demonstrated complete conceptual mastery of pigment spectra, stoichiometric ATP ratios, carbon fixation pathways, and electron transport disruption mechanics. Continue exploration into oxidative phosphorylation comparison."
  },
  {
    id: "att2",
    quizCode: "PHOTOS",
    studentName: "Sarah Connor",
    answers: {
      "q1": "Chlorophyll a",
      "q2": "To generate molecular oxygen for aerobic cellular respiration", // incorrect
      "q3": "Proton gradient formation will drop, halting ATP synthesis",
      "q4": "Both A and R are true, and R is the correct explanation of A.",
      "q5": "It catalyzes the carboxylation of Ribulose 1,5-bisphosphate (RuBP)",
      "q6": "Starch accumulation will slow but continue via carotenoid auxiliary absorption.", // incorrect
      "q7": "18 ATP : 12 NADPH",
      "q8": "The reduction of NADP+ to NADPH by ferredoxin-NADP+ reductase"
    },
    score: 6,
    totalQuestions: 8,
    percentage: 75,
    timeTaken: 450,
    submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000).toISOString(),
    questionFeedback: {},
    aiSuggestions: "Strong performance! You show a solid grasp of reaction cycles and carbon pathways. Your main gaps are in water photolysis's true evolutionary objective (electron donor, not oxygen production for others) and how plants reflect green light. Revise pigment absorbance spectra graphs."
  },
  {
    id: "att3",
    quizCode: "PHOTOS",
    studentName: "David Lightman",
    answers: {
      "q1": "Chlorophyll b", // incorrect
      "q2": "To generate molecular oxygen for aerobic cellular respiration", // incorrect
      "q3": "Proton gradient formation will drop, halting ATP synthesis",
      "q4": "Both A and R are true, but R is NOT the correct explanation of A.", // incorrect
      "q5": "It catalyzes the carboxylation of Ribulose 1,5-bisphosphate (RuBP)",
      "q6": "Starch accumulation will decrease to zero because green light is reflected rather than absorbed.",
      "q7": "12 ATP : 12 NADPH", // incorrect
      "q8": "The oxidation of plastocyanin to start the Q-cycle" // incorrect
    },
    score: 3,
    totalQuestions: 8,
    percentage: 37.5,
    timeTaken: 580,
    submittedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    questionFeedback: {},
    aiSuggestions: "Critical learning gaps identified. You struggled with basic light-dependent cycles and Calvin-cycle energy ratios. Please review: 1) Difference between Chlorophyll a (initiator) and b (accessory), 2) Water photolysis pathways, and 3) The precise 18:12 ATP:NADPH stoichiometric ratios required for glucose synthesis."
  },
  {
    id: "att4",
    quizCode: "PHOTOS",
    studentName: "John Doe",
    answers: {
      "q1": "Chlorophyll a",
      "q2": "To provide electrons to replace those lost by Photosystem II",
      "q3": "Proton gradient formation will drop, halting ATP synthesis",
      "q4": "Both A and R are true, and R is the correct explanation of A.",
      "q5": "It catalyzes the carboxylation of Ribulose 1,5-bisphosphate (RuBP)",
      "q6": "Starch accumulation will decrease to zero because green light is reflected rather than absorbed.",
      "q7": "18 ATP : 12 NADPH",
      "q8": "The direct synthesis of G3P sugar molecules" // incorrect
    },
    score: 7,
    totalQuestions: 8,
    percentage: 87.5,
    timeTaken: 290,
    submittedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    questionFeedback: {},
    aiSuggestions: "Excellent job! You are very close to a perfect score. You missed the direct output of PSI (NADPH reduction via ferredoxin) and confusingly selected sugar synthesis (which occurs in the stroma Calvin cycle). Revise the thylakoid membrane pathway."
  },

  // Python attempts
  {
    id: "att5",
    quizCode: "PYTHON",
    studentName: "Linus Torvalds",
    answers: {
      "p1": "[1, 2, 3, 4]",
      "p2": "2_global_data",
      "p3": "1 2 3",
      "p4": "HelloHelloHello",
      "p5": "pop()"
    },
    score: 5,
    totalQuestions: 5,
    percentage: 100,
    timeTaken: 112,
    submittedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    questionFeedback: {},
    aiSuggestions: "Perfect score! Outstanding grasp of mutable list references, identifier syntax rules, looping keywords, and list operations in Python."
  },
  {
    id: "att6",
    quizCode: "PYTHON",
    studentName: "Grace Hopper",
    answers: {
      "p1": "[1, 2, 3]", // incorrect
      "p2": "2_global_data",
      "p3": "1 2 3",
      "p4": "HelloHelloHello",
      "p5": "pop()"
    },
    score: 4,
    totalQuestions: 5,
    percentage: 80,
    timeTaken: 180,
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    questionFeedback: {},
    aiSuggestions: "Great performance! You understand the logical structures very well. Just make sure to review Python's object pointer assignment: 'y = x' does not copy a list, it references the same list. Changing one affects the other."
  }
];

// Hydrate feedback helper
function getFeedbackForAttempt(quiz: Quiz, attemptAnswers: Record<string, string>) {
  const questionFeedback: Record<string, any> = {};
  quiz.questions.forEach((q) => {
    const studentAnswer = attemptAnswers[q.id] || "No answer";
    const isCorrect = studentAnswer === q.correctAnswer;
    questionFeedback[q.id] = {
      isCorrect,
      studentAnswer,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation
    };
  });
  return questionFeedback;
}

// Hydrate the preloaded attempts
attempts.forEach((att) => {
  const quiz = quizzes[att.quizCode];
  if (quiz) {
    att.questionFeedback = getFeedbackForAttempt(quiz, att.answers);
  }
});


// API ENDPOINTS

// 1. GENERATE MCQs FROM TEXT, PDF, OR IMAGE (OCR)
app.post("/api/quizzes/generate", async (req, res) => {
  try {
    const { 
      text, 
      fileName, 
      fileMime, 
      fileBase64, 
      questionCount = 10, 
      difficulty = "medium", 
      subject = "General Education"
    } = req.body;

    if (!text && !fileBase64) {
      return res.status(400).json({ error: "Please provide either pastable text or an uploaded file/image." });
    }

    let contents: any[] = [];
    let promptText = `
      You are an expert curriculum planner and pedagogical assessment specialist.
      Generate a set of EXACTLY ${questionCount} high-quality, scientifically designed Multiple Choice Questions (MCQs) in strict JSON format based on the source material provided.

      The quiz subject is "${subject}".
      The overall target difficulty level is "${difficulty}".
      
      CRITICAL INSTRUCTIONS FOR GENERATING QUESTIONS:
      1. Competency Alignment: Questions must assess deep conceptual understanding, practical application of the concepts, and include at least some higher-order thinking (HOTS) questions, and Assertion-Reason questions when applicable. Do NOT generate purely rote-memorization or trivial questions.
      2. No Ambiguity: Each question must be grammatically correct, unambiguous, have exactly four distinct options, and only ONE correct answer that is objectively factual based on the source text.
      3. Plausible Distractors: Create distractors (incorrect options) that represent common misconceptions, logical pitfalls, or partial understandings. Do not make options obviously silly or trivial.
      4. Avoid Duplication: Ensure all questions are completely distinct.
      5. Map Pedagogy: For EACH question, you must assign a difficulty ("easy", "medium", or "hard"), mapping to Bloom's Taxonomy (e.g. "Remembering", "Understanding", "Applying", "Analyzing", "Evaluating", "Creating"), and state the explicit "learningOutcome" mapped.
      6. Provide a detailed "explanation" describing exactly why the correct answer is correct and why the distractors are incorrect.

      Return the result as a raw JSON array matching this exact schema:
      [
        {
          "text": "Question prompt text",
          "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
          "correctAnswer": "Option A text", // Must be EXACTLY identical to one of the four options strings
          "explanation": "Detailed pedagogical explanation...",
          "difficulty": "easy" | "medium" | "hard",
          "bloomTaxonomy": "Remembering" | "Understanding" | "Applying" | "Analyzing" | "Evaluating" | "Creating",
          "learningOutcome": "Describe the core learning capability..."
        }
      ]

      IMPORTANT: Do not return any extra characters, markdown code-blocks, or wrapping fields outside the JSON array itself. Output only valid parsable JSON.
    `;

    if (fileBase64 && fileMime) {
      // Vision / PDF-grounded Generation
      contents.push({
        inlineData: {
          mimeType: fileMime,
          data: fileBase64
        }
      });
      promptText += `\n\nAnalyze the attached document/image file closely. This is the source material for the quiz. Extract the text (perform OCR if it is an image) and generate the quiz questions.`;
    } else if (text) {
      // Plain text Grounded Generation
      promptText += `\n\nSOURCE MATERIAL:\n"""\n${text}\n"""`;
    }

    contents.push(promptText);

    // Call server-side Gemini API
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              options: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING } 
              },
              correctAnswer: { type: Type.STRING },
              explanation: { type: Type.STRING },
              difficulty: { type: Type.STRING },
              bloomTaxonomy: { type: Type.STRING },
              learningOutcome: { type: Type.STRING }
            },
            required: ["text", "options", "correctAnswer", "explanation", "difficulty", "bloomTaxonomy", "learningOutcome"]
          }
        }
      }
    });

    const outputText = response.text?.trim() || "[]";
    let parsedQuestions: any[] = [];
    try {
      parsedQuestions = JSON.parse(outputText);
    } catch (parseErr) {
      console.error("JSON parsing error from Gemini raw text:", outputText, parseErr);
      return res.status(500).json({ error: "Failed to parse the generated quiz. Please try again with different inputs." });
    }

    // Ensure IDs are present
    const questionsWithIds = parsedQuestions.map((q: any, idx: number) => ({
      ...q,
      id: q.id || `gq_${Date.now()}_${idx}`,
      options: Array.isArray(q.options) && q.options.length === 4 ? q.options : ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: q.correctAnswer || (q.options && q.options[0]) || "Option A",
      difficulty: q.difficulty || difficulty,
      bloomTaxonomy: q.bloomTaxonomy || "Understanding",
      learningOutcome: q.learningOutcome || "General knowledge review."
    }));

    // Estimate Completion Time: approx 1-1.5 minutes per MCQ depending on difficulty
    const estimatedMinutes = Math.max(1, Math.round(questionsWithIds.length * (difficulty === "easy" ? 1 : difficulty === "medium" ? 1.25 : 1.5)));

    res.json({
      questions: questionsWithIds,
      estimatedMinutes,
      conceptSummary: `Extracted ${questionsWithIds.length} high-quality questions spanning easy, medium, and hard difficulty, covering core concepts from your upload.`
    });

  } catch (err: any) {
    console.error("Quiz generation endpoint error:", err);
    res.status(500).json({ error: err.message || "An error occurred during AI quiz generation." });
  }
});

// 2. SAVE OR UPDATE A QUIZ
app.post("/api/quizzes/save", (req, res) => {
  const { quiz }: { quiz: Quiz } = req.body;
  if (!quiz || !quiz.config || !quiz.questions || quiz.questions.length === 0) {
    return res.status(400).json({ error: "Invalid quiz structure. Title and questions are required." });
  }

  // Generate or use existing code
  let code = quiz.code?.toUpperCase().trim();
  if (!code) {
    code = Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // Ensure code is unique if new
  if (!quiz.code) {
    while (quizzes[code]) {
      code = Math.random().toString(36).substring(2, 8).toUpperCase();
    }
  }

  const savedQuiz: Quiz = {
    code,
    config: {
      ...quiz.config,
      title: quiz.config.title || "Untitled Quiz",
      description: quiz.config.description || "No description provided.",
      subject: quiz.config.subject || "General Education",
      difficulty: quiz.config.difficulty || "medium",
      questionCount: quiz.questions.length,
      timeLimit: Number(quiz.config.timeLimit) || 0,
      negativeMarking: !!quiz.config.negativeMarking,
      passingScore: Number(quiz.config.passingScore) || 50,
      shuffleQuestions: !!quiz.config.shuffleQuestions,
      shuffleOptions: !!quiz.config.shuffleOptions
    },
    questions: quiz.questions.map((q, idx) => ({
      ...q,
      id: q.id || `q_${Date.now()}_${idx}`
    })),
    createdAt: quiz.createdAt || new Date().toISOString()
  };

  quizzes[code] = savedQuiz;
  res.json({ success: true, code, quiz: savedQuiz });
});

// 3. GET A QUIZ BY ACCESS CODE (Sanitized for student view - correct answers omitted unless role=teacher)
app.get("/api/quizzes/:code", (req, res) => {
  const code = req.params.code.toUpperCase().trim();
  const quiz = quizzes[code];
  if (!quiz) {
    return res.status(404).json({ error: "Quiz not found. Please double-check the 6-character access code." });
  }

  const isTeacher = req.query.role === "teacher";
  if (isTeacher) {
    return res.json(quiz); // return full quiz including correct answers & explanations
  }

  // Clone quiz and strip correct answers & explanations to prevent cheating in the browser!
  const studentQuiz = {
    code: quiz.code,
    config: quiz.config,
    createdAt: quiz.createdAt,
    questions: quiz.questions.map((q) => ({
      id: q.id,
      text: q.text,
      options: q.options,
      difficulty: q.difficulty,
      bloomTaxonomy: q.bloomTaxonomy,
      learningOutcome: q.learningOutcome
    }))
  };

  res.json(studentQuiz);
});

// 4. SUBMIT STUDENT ANSWERS & COMPUTE GRADE ON SERVER + GENERATE PERSONALIZED AI LEARNING ADVICE
app.post("/api/quizzes/:code/submit", async (req, res) => {
  try {
    const code = req.params.code.toUpperCase().trim();
    const { studentName, answers, timeTaken } = req.body; // answers is record of questionId -> chosenOptionText

    const quiz = quizzes[code];
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found." });
    }

    if (!studentName?.trim()) {
      return res.status(400).json({ error: "Student name is required." });
    }

    // Evaluate answers
    let score = 0;
    const totalQuestions = quiz.questions.length;
    const questionFeedback: Record<string, any> = {};

    quiz.questions.forEach((q) => {
      const studentAnswer = answers[q.id] || "No Answer";
      const isCorrect = studentAnswer.trim() === q.correctAnswer.trim();
      if (isCorrect) score++;

      questionFeedback[q.id] = {
        isCorrect,
        studentAnswer,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation
      };
    });

    const percentage = Math.round((score / totalQuestions) * 100);

    // AI suggestions using Gemini based on misses
    let aiSuggestions = "";
    try {
      const misses = quiz.questions
        .filter((q) => answers[q.id] !== q.correctAnswer)
        .map((q) => ({
          text: q.text,
          outcome: q.learningOutcome,
          bloom: q.bloomTaxonomy,
          difficulty: q.difficulty,
          chosen: answers[q.id] || "No Answer",
          correct: q.correctAnswer
        }));

      if (misses.length === 0) {
        aiSuggestions = "Incredible perfect score! You demonstrated flawless understanding. Consider setting the bar higher by attempting more advanced topics or crafting your own questions to teach others.";
      } else {
        const missSummary = JSON.stringify(misses);
        const adviceResponse = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: `
            As an encouraging, professional academic tutor, write a short, highly personalized 2-3 sentence learning recommendation for a student named ${studentName} who scored ${score}/${totalQuestions} (${percentage}%) on the quiz "${quiz.config.title}" (${quiz.config.subject}).
            
            They struggled with these specific concepts:
            ${missSummary}
            
            Deliver direct, actionable micro-study tips. Be supportive, friendly, and focus on mapped learning outcomes. Avoid generalities. Do not write a long letter, just 2 or 3 sentences.
          `,
        });
        aiSuggestions = adviceResponse.text?.trim() || "Review the chapters mapped to your incorrect answers and try the quiz again.";
      }
    } catch (aiErr) {
      console.error("AI feedback generation failed, defaulting to text:", aiErr);
      aiSuggestions = percentage >= quiz.config.passingScore 
        ? "Excellent job passing! Review the few questions you missed to reinforce your understanding."
        : "You are close! Go back to the original source text and focus on the incorrect topics before re-attempting.";
    }

    const newAttempt: Attempt = {
      id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      quizCode: code,
      studentName: studentName.trim(),
      answers,
      score,
      totalQuestions,
      percentage,
      timeTaken: Number(timeTaken) || 0,
      submittedAt: new Date().toISOString(),
      questionFeedback,
      aiSuggestions
    };

    attempts.push(newAttempt);

    res.json({
      success: true,
      attempt: newAttempt
    });

  } catch (err: any) {
    console.error("Submit attempt error:", err);
    res.status(500).json({ error: err.message || "Failed to submit attempt." });
  }
});

// 5. GET TEACHER ANALYTICS FOR A QUIZ
app.get("/api/quizzes/:code/analytics", (req, res) => {
  const code = req.params.code.toUpperCase().trim();
  const quiz = quizzes[code];
  if (!quiz) {
    return res.status(404).json({ error: "Quiz not found." });
  }

  // Filter attempts for this quiz
  const quizAttempts = attempts.filter((att) => att.quizCode === code);

  if (quizAttempts.length === 0) {
    // Return empty stats if no attempts yet
    return res.json({
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      totalAttempts: 0,
      passingRate: 0,
      questionStats: quiz.questions.map((q) => ({
        questionId: q.id,
        text: q.text,
        correctCount: 0,
        incorrectCount: 0,
        correctPercentage: 0
      })),
      studentAttempts: []
    });
  }

  const scores = quizAttempts.map((att) => att.score);
  const totalQuestions = quiz.questions.length;
  const averageScore = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
  const highestScore = Math.max(...scores);
  const lowestScore = Math.min(...scores);
  const totalAttempts = quizAttempts.length;

  const passedCount = quizAttempts.filter((att) => att.percentage >= quiz.config.passingScore).length;
  const passingRate = Math.round((passedCount / totalAttempts) * 100);

  // Question-wise stats
  const questionStats = quiz.questions.map((q) => {
    let correctCount = 0;
    let incorrectCount = 0;

    quizAttempts.forEach((att) => {
      const studentAns = att.answers[q.id];
      if (studentAns && studentAns.trim() === q.correctAnswer.trim()) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    });

    const correctPercentage = Math.round((correctCount / totalAttempts) * 100);

    return {
      questionId: q.id,
      text: q.text,
      correctCount,
      incorrectCount,
      correctPercentage
    };
  });

  // Sort student attempts descending by submission date
  const sortedAttempts = [...quizAttempts].sort((a, b) => 
    new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
  );

  const stats: DashboardStats = {
    averageScore,
    highestScore,
    lowestScore,
    totalAttempts,
    passingRate,
    questionStats,
    studentAttempts: sortedAttempts
  };

  res.json(stats);
});

// 6. GENERAL SYSTEM LIST OF ALL QUIZZES (with metrics)
app.get("/api/quizzes", (req, res) => {
  const quizList = Object.values(quizzes).map((q) => {
    const quizAttempts = attempts.filter((att) => att.quizCode === q.code);
    return {
      code: q.code,
      config: q.config,
      createdAt: q.createdAt,
      questionCount: q.questions.length,
      attemptsCount: quizAttempts.length,
      averageScore: quizAttempts.length > 0 
        ? Math.round((quizAttempts.reduce((sum, att) => sum + att.score, 0) / quizAttempts.length) * 10) / 10
        : null
    };
  });

  // Sort by created descending
  quizList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(quizList);
});

// Setup dev server or static file serving
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EduQuiz AI server listening on port ${PORT}`);
  });
};

startServer().catch((err) => {
  console.error("Failed to start full-stack server:", err);
});
