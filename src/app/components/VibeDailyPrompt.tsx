import { useState, useEffect } from 'react';
import { X, Zap } from 'lucide-react';
import { supabase, projectId, publicAnonKey } from '../supabaseClient';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number; // index of correct answer
  explanation?: string;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctAnswer: 1,
    explanation: "Mars appears red due to iron oxide on its surface!"
  },
  {
    question: "What year did the first iPhone launch?",
    options: ["2005", "2007", "2009", "2010"],
    correctAnswer: 1,
    explanation: "The iPhone was announced by Steve Jobs in January 2007."
  },
  {
    question: "Who painted the Mona Lisa?",
    options: ["Michelangelo", "Leonardo da Vinci", "Raphael", "Donatello"],
    correctAnswer: 1,
    explanation: "Leonardo da Vinci painted this masterpiece in the early 1500s."
  },
  {
    question: "What is the capital of Australia?",
    options: ["Sydney", "Melbourne", "Canberra", "Brisbane"],
    correctAnswer: 2,
    explanation: "Canberra was purpose-built to be the capital in 1913."
  },
  {
    question: "How many strings does a standard guitar have?",
    options: ["4", "5", "6", "7"],
    correctAnswer: 2,
    explanation: "Most guitars have 6 strings tuned to E-A-D-G-B-E."
  },
  {
    question: "What is the smallest country in the world?",
    options: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"],
    correctAnswer: 1,
    explanation: "Vatican City is only 0.44 km² in size!"
  },
  {
    question: "Which element has the chemical symbol 'O'?",
    options: ["Osmium", "Oxygen", "Gold", "Silver"],
    correctAnswer: 1,
    explanation: "Oxygen is essential for life and makes up 21% of Earth's atmosphere."
  },
  {
    question: "In which year did World War II end?",
    options: ["1943", "1944", "1945", "1946"],
    correctAnswer: 2,
    explanation: "WWII ended in 1945 with Japan's surrender in September."
  },
  {
    question: "What is the largest ocean on Earth?",
    options: ["Atlantic", "Indian", "Arctic", "Pacific"],
    correctAnswer: 3,
    explanation: "The Pacific Ocean covers about 46% of Earth's water surface."
  },
  {
    question: "Who wrote 'Romeo and Juliet'?",
    options: ["Charles Dickens", "Jane Austen", "William Shakespeare", "Mark Twain"],
    correctAnswer: 2,
    explanation: "Shakespeare wrote this tragic love story around 1595."
  },
  {
    question: "How many continents are there?",
    options: ["5", "6", "7", "8"],
    correctAnswer: 2,
    explanation: "The seven continents are Africa, Antarctica, Asia, Australia, Europe, North America, and South America."
  },
  {
    question: "What is the speed of light?",
    options: ["300,000 km/s", "150,000 km/s", "450,000 km/s", "200,000 km/s"],
    correctAnswer: 0,
    explanation: "Light travels at approximately 299,792 km/s in a vacuum."
  },
  {
    question: "Which programming language was released in 1995?",
    options: ["Python", "Java", "JavaScript", "C++"],
    correctAnswer: 2,
    explanation: "JavaScript was created by Brendan Eich in just 10 days!"
  },
  {
    question: "What is the tallest mountain in the world?",
    options: ["K2", "Kilimanjaro", "Mount Everest", "Denali"],
    correctAnswer: 2,
    explanation: "Mount Everest stands at 8,849 meters above sea level."
  },
  {
    question: "How many bones are in the human body?",
    options: ["186", "206", "226", "246"],
    correctAnswer: 1,
    explanation: "Adults have 206 bones, babies are born with about 270!"
  },
  {
    question: "Which country invented pizza?",
    options: ["France", "Greece", "Italy", "Spain"],
    correctAnswer: 2,
    explanation: "Modern pizza originated in Naples, Italy in the 18th century."
  },
  {
    question: "What is the hardest natural substance on Earth?",
    options: ["Gold", "Iron", "Diamond", "Titanium"],
    correctAnswer: 2,
    explanation: "Diamond rates 10 on the Mohs hardness scale."
  },
  {
    question: "How many players are on a soccer team?",
    options: ["9", "10", "11", "12"],
    correctAnswer: 2,
    explanation: "Each team has 11 players on the field including the goalkeeper."
  },
  {
    question: "What is the currency of Japan?",
    options: ["Won", "Yuan", "Yen", "Ringgit"],
    correctAnswer: 2,
    explanation: "The Japanese Yen has been used since 1871."
  },
  {
    question: "Which planet is closest to the Sun?",
    options: ["Venus", "Mercury", "Earth", "Mars"],
    correctAnswer: 1,
    explanation: "Mercury orbits just 58 million km from the Sun."
  },
  {
    question: "What does HTTP stand for?",
    options: ["HyperText Transfer Protocol", "High Transfer Text Protocol", "HyperText Transport Protocol", "High Tech Transfer Protocol"],
    correctAnswer: 0,
    explanation: "HTTP is the foundation of data communication on the web."
  },
  {
    question: "How many hearts does an octopus have?",
    options: ["1", "2", "3", "4"],
    correctAnswer: 2,
    explanation: "Octopuses have three hearts: two pump blood to the gills, one to the body."
  },
  {
    question: "What is the largest mammal in the world?",
    options: ["African Elephant", "Blue Whale", "Giraffe", "Polar Bear"],
    correctAnswer: 1,
    explanation: "Blue whales can grow up to 100 feet long!"
  },
  {
    question: "In which year was Google founded?",
    options: ["1996", "1998", "2000", "2002"],
    correctAnswer: 1,
    explanation: "Larry Page and Sergey Brin founded Google in September 1998."
  },
  {
    question: "What is the freezing point of water in Celsius?",
    options: ["-10°C", "0°C", "10°C", "32°C"],
    correctAnswer: 1,
    explanation: "Water freezes at 0°C (32°F) at standard atmospheric pressure."
  },
  {
    question: "Which social media platform uses a bird as its logo?",
    options: ["Facebook", "Instagram", "Twitter/X", "Snapchat"],
    correctAnswer: 2,
    explanation: "Twitter (now X) used the iconic blue bird for many years."
  },
  {
    question: "How many days are in a leap year?",
    options: ["364", "365", "366", "367"],
    correctAnswer: 2,
    explanation: "Leap years have 366 days, occurring every 4 years."
  },
  {
    question: "What is the main ingredient in guacamole?",
    options: ["Tomato", "Avocado", "Cucumber", "Pepper"],
    correctAnswer: 1,
    explanation: "Guacamole is made primarily from mashed avocados."
  },
  {
    question: "Which organ pumps blood through the body?",
    options: ["Liver", "Lungs", "Heart", "Kidneys"],
    correctAnswer: 2,
    explanation: "The heart beats about 100,000 times per day!"
  },
  {
    question: "What does 'AI' stand for?",
    options: ["Automated Intelligence", "Artificial Intelligence", "Advanced Integration", "Automated Integration"],
    correctAnswer: 1,
    explanation: "Artificial Intelligence refers to machines simulating human intelligence."
  },
];

// Get today's date string (YYYY-MM-DD)
function getTodayString() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// Get day index for quiz rotation (cycles through all questions)
function getDayIndex() {
  const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
  return daysSinceEpoch % QUIZ_QUESTIONS.length;
}

interface VibeDailyPromptProps {
  onNavigateToCreate?: (dailyPrompt: string) => void;
}

export function VibeDailyPrompt({ onNavigateToCreate }: VibeDailyPromptProps) {
  const [dismissed, setDismissed] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showingQuiz, setShowingQuiz] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Check if user has answered today
  useEffect(() => {
    checkIfAnsweredToday();
  }, []);

  const checkIfAnsweredToday = async () => {
    const today = getTodayString();
    const localStorageKey = `vibe_daily_quiz_${today}`;
    
    // Check local storage first
    const localAnswer = localStorage.getItem(localStorageKey);
    if (localAnswer === 'true') {
      setAnswered(true);
      setLoading(false);
      return;
    }

    // Check backend if user is logged in
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-78efa14d/daily-prompt/check/${session.user.id}/${today}`,
          {
            headers: { Authorization: `Bearer ${session.access_token}` }
          }
        );
        
        if (response.ok) {
          const { answered: backendAnswered } = await response.json();
          if (backendAnswered) {
            setAnswered(true);
            localStorage.setItem(localStorageKey, 'true');
          }
        }
      }
    } catch (error) {
      console.warn('Could not check backend for daily quiz answer:', error);
    }
    
    setLoading(false);
  };

  const handleStartQuiz = () => {
    setShowingQuiz(true);
  };

  const handleSelectAnswer = async (answerIndex: number) => {
    const dayIndex = getDayIndex();
    const question = QUIZ_QUESTIONS[dayIndex];
    const correct = answerIndex === question.correctAnswer;
    
    setSelectedAnswer(answerIndex);
    setIsCorrect(correct);
    
    const today = getTodayString();
    const localStorageKey = `vibe_daily_quiz_${today}`;
    
    // Mark as answered locally
    setAnswered(true);
    localStorage.setItem(localStorageKey, 'true');
    
    // Save to backend if logged in
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-78efa14d/daily-prompt/answer`,
          {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}` 
            },
            body: JSON.stringify({
              userId: session.user.id,
              date: today,
              promptIndex: dayIndex,
              prompt: question.question,
              userAnswer: answerIndex,
              correct: correct
            })
          }
        );
      }
    } catch (error) {
      console.warn('Could not save daily quiz answer to backend:', error);
    }
  };

  // If already answered (from previous session or page reload), hide immediately
  if (dismissed || loading) return null;
  if (answered && selectedAnswer === null) return null;

  const dayIndex = getDayIndex();
  const question = QUIZ_QUESTIONS[dayIndex];

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setFadingOut(true);
  };

  return (
    <div
      className={`mx-2 mb-4 relative border-4 border-foreground bg-foreground overflow-hidden shadow-[6px_6px_0px_0px_var(--background)] transition-all duration-300 ${fadingOut ? 'opacity-0 scale-95 pointer-events-none max-h-0 !mb-0 !border-0 !shadow-none' : ''}`}
      style={{ animation: fadingOut ? undefined : 'fadeSlideUp 0.4s cubic-bezier(.22,.68,0,1.2) both' }}
      onTransitionEnd={() => {
        if (fadingOut) setDismissed(true);
      }}
    >
      {/* Dismiss */}
      <button
        onClick={handleDismiss}
        onTouchEnd={(e) => {
          e.stopPropagation();
        }}
        className="absolute top-2 right-2 w-6 h-6 border-2 border-white/40 text-white/60 flex items-center justify-center hover:border-white hover:text-white transition-colors z-10"
      >
        <X size={12} strokeWidth={3} />
      </button>

      <div className="p-4">
        {/* ── Unanswered state ── */}
        {!answered && (
          <>
            <div className="mb-3">
              <span className="text-xs font-bold text-background uppercase">Daily Quiz</span>
            </div>

            <p className="text-white font-bold text-lg leading-relaxed mb-6">{question.question}</p>

            {!showingQuiz && (
              <button
                onClick={handleStartQuiz}
                className="w-full py-3 bg-background text-foreground font-bold text-sm transition-opacity hover:opacity-90"
              >
                Take Quiz
              </button>
            )}

            {showingQuiz && (
              <div className="space-y-2">
                {question.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectAnswer(index)}
                    className="w-full py-3 px-4 bg-white/10 text-white font-bold text-sm text-left border-2 border-white/20 hover:border-background hover:bg-white/20 transition-all"
                  >
                    {String.fromCharCode(65 + index)}. {option}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Just answered: show result ── */}
        {answered && selectedAnswer !== null && (
          <div className="space-y-3">
            <div className="mb-2">
              <span className="text-xs font-bold text-background uppercase">Daily Quiz</span>
            </div>
            <p className="text-white/70 text-sm leading-relaxed mb-1">{question.question}</p>

            {/* Show all options with correct/wrong highlighting */}
            <div className="space-y-2">
              {question.options.map((option, index) => {
                const isSelected = index === selectedAnswer;
                const isCorrectAnswer = index === question.correctAnswer;
                let borderColor = 'border-white/10 bg-white/5';
                let label = '';
                if (isCorrectAnswer) {
                  borderColor = 'border-green-500 bg-green-500/20';
                  label = ' ✓';
                } else if (isSelected && !isCorrect) {
                  borderColor = 'border-red-500 bg-red-500/20';
                  label = ' ✗';
                }
                return (
                  <div
                    key={index}
                    className={`py-3 px-4 text-sm font-bold text-white border-2 ${borderColor}`}
                  >
                    {String.fromCharCode(65 + index)}. {option}{label}
                  </div>
                );
              })}
            </div>

            <div className={`py-3 px-4 text-center border-2 ${isCorrect ? 'border-green-500 bg-green-500/20' : 'border-red-500 bg-red-500/20'}`}>
              <span className="text-sm font-bold text-white">
                {isCorrect ? '✓ Correct!' : '✗ Wrong — see the correct answer above'}
              </span>
            </div>
            {question.explanation && (
              <p className="text-white/60 text-xs leading-relaxed">
                {question.explanation}
              </p>
            )}
          </div>
        )}

        {/* ── Already answered (page reload): show completed badge ── */}
        {answered && selectedAnswer === null && (
          <div className="py-3 text-center">
            <span className="text-sm font-bold text-background">✓ Completed today</span>
          </div>
        )}
      </div>
    </div>
  );
}