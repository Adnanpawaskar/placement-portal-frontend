import useScrollReveal from '../../hooks/useScrollReveal';
import { useState, useEffect } from 'react';
import { Brain, CheckCircle, XCircle, Trophy, ChevronRight, RotateCcw, BookOpen } from 'lucide-react';

const QUESTION_BANK = {
  HR: {
    label: 'HR Round', icon: '🤝', color: 'green',
    description: 'Behavioural & soft-skill questions asked by HR',
    rounds: [
      [
        { q: 'Which answer best describes "Tell me about yourself"?', options: ['Full life story', 'Academic + skills + why this role', 'Only hobbies', 'Only achievements'], answer: 1 },
        { q: 'Best response to "What is your weakness"?', options: ['I have no weaknesses', 'A real weakness + steps to improve', 'Refuse to answer', 'Blame someone else'], answer: 1 },
        { q: '"Where do you see yourself in 5 years?" — you should:', options: ['Say CEO of the company', 'Align with the role and show growth mindset', 'Say you don\'t know', 'Say you want to leave soon'], answer: 1 },
        { q: 'What does "Notice Period" mean?', options: ['Time to learn new skills', 'Period between resignation and last working day', 'Duration of probation', 'Time for salary negotiation'], answer: 1 },
        { q: 'Which is most important during an interview?', options: ['Expensive clothes', 'Punctuality and preparation', 'Knowing the interviewer personally', 'Talking the most'], answer: 1 },
      ],
      [
        { q: 'How should you handle a question you don\'t know the answer to?', options: ['Make something up', 'Honestly say you don\'t know but will find out', 'Stay silent', 'Change the topic'], answer: 1 },
        { q: 'What is the STAR method used for in interviews?', options: ['Asking salary', 'Structuring behavioural answers', 'Technical problem solving', 'Negotiation'], answer: 1 },
        { q: 'When asked "Why do you want to join us?" you should:', options: ['Say for money', 'Research the company and align with their mission', 'Say any company is fine', 'Mention you have no other offer'], answer: 1 },
        { q: 'What does CTC stand for?', options: ['Cost To Company', 'Certified Training Certificate', 'Company Tax Credit', 'Central Transfer Cost'], answer: 0 },
        { q: 'Best way to handle a conflict with a colleague?', options: ['Ignore it', 'Involve HR immediately', 'Address it calmly and directly', 'Complain to management'], answer: 2 },
      ],
      [
        { q: 'What should you do after the interview ends?', options: ['Leave immediately', 'Send a thank-you email within 24 hours', 'Call the interviewer repeatedly', 'Post about it on social media'], answer: 1 },
        { q: 'What does "KRA" stand for?', options: ['Key Result Area', 'Key Resource Allocation', 'Knowledge and Research Analysis', 'None of the above'], answer: 0 },
        { q: 'What body language signals confidence?', options: ['Slouching', 'Avoiding eye contact', 'Upright posture and firm handshake', 'Crossing arms'], answer: 2 },
        { q: 'How do you describe a gap in your resume?', options: ['Lie about it', 'Explain honestly what you did during the gap', 'Skip the question', 'Blame the economy'], answer: 1 },
        { q: 'What should your closing statement in an interview convey?', options: ['Eagerness to negotiate salary', 'Enthusiasm for the role and a call to action', 'Doubt about the company', 'A list of competitor offers'], answer: 1 },
      ],
    ],
  },
  Finance: {
    label: 'Finance Round', icon: '💰', color: 'blue',
    description: 'Questions for finance, accounting & banking roles',
    rounds: [
      [
        { q: 'What does P&L stand for?', options: ['Profit and Loss', 'Purchase and Liability', 'Product and Labour', 'None'], answer: 0 },
        { q: 'Which financial statement shows a company\'s assets and liabilities?', options: ['Income Statement', 'Balance Sheet', 'Cash Flow Statement', 'Ledger'], answer: 1 },
        { q: 'What is "Working Capital"?', options: ['Fixed assets minus liabilities', 'Current assets minus current liabilities', 'Revenue minus expenses', 'Cash on hand'], answer: 1 },
        { q: 'What is the time value of money?', options: ['Money loses value over time due to inflation', 'A rupee today is worth more than a rupee tomorrow', 'Money is always equal in value', 'Banks control its value'], answer: 1 },
        { q: 'What does EBITDA measure?', options: ['Net profit', 'Earnings before interest, taxes, depreciation, amortization', 'Total revenue', 'Cost of goods sold'], answer: 1 },
      ],
      [
        { q: 'What is a "Bull Market"?', options: ['Market in decline', 'A market rising consistently', 'Market with high volatility', 'A bear economy'], answer: 1 },
        { q: 'What does NPV stand for?', options: ['Net Present Value', 'Net Profit Value', 'New Project Valuation', 'Nominal Price Value'], answer: 0 },
        { q: 'Which ratio measures ability to pay short-term debts?', options: ['P/E Ratio', 'Current Ratio', 'Debt-to-Equity Ratio', 'Return on Equity'], answer: 1 },
        { q: 'What is Depreciation?', options: ['Increase in asset value', 'Allocation of asset cost over its useful life', 'Tax deduction', 'Cash expense'], answer: 1 },
        { q: 'What is the difference between revenue and profit?', options: ['They are the same', 'Revenue is total income; profit is income after expenses', 'Profit is total income; revenue is after expenses', 'None of the above'], answer: 1 },
      ],
      [
        { q: 'What does FDI stand for?', options: ['Fixed Deposit Investment', 'Foreign Direct Investment', 'Financial Debt Index', 'Federal Deposit Institution'], answer: 1 },
        { q: 'What is a "Hedge Fund"?', options: ['A government savings scheme', 'A pooled investment fund using high-risk strategies', 'A fixed deposit', 'An insurance product'], answer: 1 },
        { q: 'What does ROI stand for?', options: ['Rate of Income', 'Return on Investment', 'Risk of Inflation', 'Ratio of Interest'], answer: 1 },
        { q: 'What is a bond?', options: ['A share in a company', 'A loan made by investors to borrowers', 'A government tax', 'A mutual fund type'], answer: 1 },
        { q: 'What does CRR stand for in banking?', options: ['Credit Reserve Ratio', 'Cash Reserve Ratio', 'Central Repo Rate', 'Currency Risk Ratio'], answer: 1 },
      ],
    ],
  },
  Marketing: {
    label: 'Marketing Round', icon: '📈', color: 'orange',
    description: 'Questions for marketing, sales & branding roles',
    rounds: [
      [
        { q: 'What does the "4 Ps of Marketing" refer to?', options: ['Price, Place, People, Promotion', 'Product, Price, Place, Promotion', 'Product, People, Process, Promotion', 'None'], answer: 1 },
        { q: 'What is "Brand Equity"?', options: ['The monetary value of a brand name', 'Total sales of a brand', 'Advertising budget', 'Number of customers'], answer: 0 },
        { q: 'What is SEO?', options: ['Sales Enhancement Operations', 'Search Engine Optimization', 'Social Engagement Output', 'Systematic Email Outreach'], answer: 1 },
        { q: 'What is the difference between B2B and B2C?', options: ['B2B sells to businesses; B2C sells to consumers', 'B2B is online; B2C is offline', 'They are the same', 'B2C sells to businesses'], answer: 0 },
        { q: 'What is "CTR" in digital marketing?', options: ['Click-Through Rate', 'Customer Transaction Rate', 'Content Targeting Ratio', 'Cost-To-Revenue'], answer: 0 },
      ],
      [
        { q: 'What is a USP?', options: ['Unique Selling Proposition', 'Universal Sales Point', 'User Service Protocol', 'Uniform Standard Practice'], answer: 0 },
        { q: 'What does "CRM" stand for?', options: ['Customer Relationship Management', 'Company Revenue Model', 'Cost Reduction Method', 'Consumer Research Module'], answer: 0 },
        { q: 'What is "Market Segmentation"?', options: ['Dividing a market into distinct subgroups', 'Measuring market size', 'Setting a product price', 'Creating a brand logo'], answer: 0 },
        { q: 'What does "Bounce Rate" mean in web analytics?', options: ['Percentage of visitors who leave after one page', 'Number of website errors', 'Cost per bounce ad', 'Scroll depth metric'], answer: 0 },
        { q: 'Which marketing channel is considered "pull" marketing?', options: ['Cold calling', 'SEO and content marketing', 'Billboards', 'Newspaper ads'], answer: 1 },
      ],
      [
        { q: 'What is "Customer Lifetime Value" (CLV)?', options: ['First-time purchase value', 'Total revenue from a customer over their relationship with a business', 'Average transaction size', 'Monthly subscription fee'], answer: 1 },
        { q: 'What is an "Influencer" in marketing?', options: ['A person with large social media following who promotes products', 'A marketing executive', 'A data analyst', 'An advertiser'], answer: 0 },
        { q: 'What does "A/B Testing" mean in marketing?', options: ['Testing two versions of content to see which performs better', 'A type of email campaign', 'Comparing two companies', 'A budget comparison method'], answer: 0 },
        { q: 'What is "Inbound Marketing"?', options: ['Interrupting customers with ads', 'Attracting customers through valuable content', 'Cold calling potential customers', 'Buying ad space'], answer: 1 },
        { q: 'What is "Guerrilla Marketing"?', options: ['TV advertising', 'Unconventional, low-cost marketing tactics', 'Social media marketing', 'Email campaigns'], answer: 1 },
      ],
    ],
  },
  Technical: {
    label: 'Technical Round', icon: '💻', color: 'purple',
    description: 'CS & software engineering fundamentals',
    rounds: [
      [
        { q: 'Which data structure uses LIFO principle?', options: ['Queue', 'Stack', 'Tree', 'Graph'], answer: 1 },
        { q: 'Time complexity of Binary Search?', options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'], answer: 1 },
        { q: 'Which HTTP method is used to update a resource?', options: ['GET', 'POST', 'PUT', 'DELETE'], answer: 2 },
        { q: 'What does SQL stand for?', options: ['Simple Query Language', 'Structured Query Language', 'Sequential Query Logic', 'Standard Query Language'], answer: 1 },
        { q: 'Which is NOT a JavaScript framework?', options: ['React', 'Vue', 'Django', 'Angular'], answer: 2 },
      ],
      [
        { q: 'What does OOP stand for?', options: ['Object Oriented Programming', 'Open Online Processing', 'Ordered Output Protocol', 'None'], answer: 0 },
        { q: 'Which keyword prevents inheritance in Java?', options: ['static', 'abstract', 'final', 'private'], answer: 2 },
        { q: 'A recursive function must have:', options: ['A loop', 'A base case', 'Multiple return values', 'Global variables'], answer: 1 },
        { q: 'What is a "pointer" in C/C++?', options: ['A variable storing a value', 'A variable storing a memory address', 'A loop construct', 'A sorting algorithm'], answer: 1 },
        { q: 'Sorting with worst-case O(n log n)?', options: ['Bubble Sort', 'Insertion Sort', 'Merge Sort', 'Selection Sort'], answer: 2 },
      ],
      [
        { q: 'Difference between TCP and UDP?', options: ['TCP is faster; UDP is reliable', 'TCP is reliable; UDP is faster but unreliable', 'They are the same', 'UDP is for emails; TCP is for video'], answer: 1 },
        { q: 'What does REST stand for?', options: ['Remote Entry State Transfer', 'Representational State Transfer', 'Resource Exchange Synchronization Technology', 'None'], answer: 1 },
        { q: 'What is a "deadlock" in OS?', options: ['A process running infinitely', 'Two or more processes blocking each other indefinitely', 'A crashed program', 'Memory overflow'], answer: 1 },
        { q: 'What is "normalization" in databases?', options: ['Encrypting data', 'Organizing data to reduce redundancy', 'Backing up data', 'Indexing all columns'], answer: 1 },
        { q: 'Primary key property in DBMS?', options: ['It can be NULL', 'It is unique and not null', 'It can repeat', 'It references another table'], answer: 1 },
      ],
    ],
  },
  Aptitude: {
    label: 'Aptitude Round', icon: '🧮', color: 'rose',
    description: 'Quantitative & logical reasoning',
    rounds: [
      [
        { q: 'Train travels 60 km in 45 minutes, speed in km/h?', options: ['80', '75', '90', '70'], answer: 0 },
        { q: 'What is 15% of 240?', options: ['36', '32', '34', '38'], answer: 0 },
        { q: 'A and B complete work in 12 and 18 days. Together they take?', options: ['7.2 days', '6.5 days', '8 days', '5 days'], answer: 0 },
        { q: 'If MANGO is coded as OCPIQ, how is APPLE coded?', options: ['CRRNG', 'CRRNF', 'BQQMF', 'CQQMG'], answer: 0 },
        { q: 'Ratio A:B = 3:5 and B:C = 2:3. Find A:C', options: ['2:5', '1:3', '6:15', '3:8'], answer: 0 },
      ],
      [
        { q: 'Shopkeeper sold at 20% profit for ₹1200. Cost price?', options: ['₹1000', '₹900', '₹1100', '₹950'], answer: 0 },
        { q: 'Next: 2, 6, 12, 20, 30, ?', options: ['40', '42', '44', '36'], answer: 1 },
        { q: 'Simple interest on ₹5000 at 8% for 3 years?', options: ['₹1200', '₹1100', '₹1300', '₹1000'], answer: 0 },
        { q: '6 men do a job in 10 days. 10 men do it in?', options: ['6 days', '8 days', '4 days', '5 days'], answer: 0 },
        { q: 'Odd one out: 121, 144, 169, 196, 225, 250', options: ['196', '225', '250', '169'], answer: 2 },
      ],
      [
        { q: 'Car: A→B at 60 km/h, return at 40 km/h. Average speed?', options: ['48 km/h', '50 km/h', '52 km/h', '55 km/h'], answer: 0 },
        { q: 'If 2x + 3 = 15, then x = ?', options: ['5', '6', '4', '7'], answer: 1 },
        { q: 'Pipe fills tank in 6 hrs, other empties in 8 hrs. Fill time when both open?', options: ['24 hours', '20 hours', '18 hours', '16 hours'], answer: 0 },
        { q: 'Prime numbers between 1 and 20?', options: ['7', '8', '9', '6'], answer: 1 },
        { q: 'Sum of 5 consecutive integers is 95, the largest is?', options: ['21', '20', '19', '23'], answer: 0 },
      ],
    ],
  },
  Operations: {
    label: 'Operations Round', icon: '⚙️', color: 'slate',
    description: 'Supply chain, logistics & operations management',
    rounds: [
      [
        { q: 'What does SCM stand for?', options: ['Sales and Customer Management', 'Supply Chain Management', 'Standard Cost Method', 'System Control Module'], answer: 1 },
        { q: 'What is "Lean Manufacturing"?', options: ['Using few employees', 'Eliminating waste while maintaining productivity', 'Cheap raw materials', 'Outsourcing production'], answer: 1 },
        { q: 'What is "Just-In-Time" (JIT) production?', options: ['Producing goods in advance', 'Producing goods only when needed', 'Producing in bulk', 'Outsourcing production'], answer: 1 },
        { q: 'What is "EOQ" in inventory management?', options: ['End of Quarter', 'Economic Order Quantity', 'Estimated Output Quota', 'None'], answer: 1 },
        { q: 'What does KPI stand for?', options: ['Key Process Indicator', 'Key Performance Indicator', 'Knowledge Process Integration', 'Known Profit Index'], answer: 1 },
      ],
      [
        { q: 'What is "Six Sigma" focused on?', options: ['Speed', 'Reducing defects and variation', 'Cutting costs', 'Increasing headcount'], answer: 1 },
        { q: 'What is a "Gantt chart" used for?', options: ['Financial planning', 'Project scheduling and timelines', 'Marketing campaigns', 'Budget allocation'], answer: 1 },
        { q: 'What is "capacity planning"?', options: ['Determining factory power use', 'Determining production capacity needed to meet demand', 'HR headcount planning', 'None of the above'], answer: 1 },
        { q: 'What is the "Bullwhip Effect" in supply chain?', options: ['A pricing strategy', 'Demand variability amplification up the supply chain', 'A logistics route', 'An inventory model'], answer: 1 },
        { q: 'What does SLA stand for?', options: ['Sales Level Agreement', 'Service Level Agreement', 'Supplier Liability Act', 'Standard Logistics Audit'], answer: 1 },
      ],
    ],
  },
};

const COURSE_SUGGESTIONS = {
  'B.Tech': ['Technical', 'Aptitude', 'HR', 'Operations'],
  'MCA': ['Technical', 'Aptitude', 'HR'],
  'BCA': ['Technical', 'Aptitude', 'HR'],
  'MBA': ['HR', 'Finance', 'Marketing', 'Operations', 'Aptitude'],
  'BBA': ['HR', 'Marketing', 'Finance', 'Aptitude'],
  'B.Com': ['Finance', 'HR', 'Aptitude'],
  'M.Com': ['Finance', 'HR', 'Aptitude'],
  'B.Sc': ['Technical', 'Aptitude', 'HR'],
};

const colorMap = {
  green: { border: 'border-green-400', text: 'text-[var(--neon-green)]', badge: 'bg-green-100 text-[var(--neon-green)]', btn: 'text-[var(--neon-green)]' },
  blue: { border: 'border-blue-400', text: 'text-[var(--neon-blue)]', badge: 'bg-blue-100 text-[var(--neon-blue)]', btn: 'text-[var(--neon-blue)]' },
  orange: { border: 'border-orange-400', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700', btn: 'text-orange-600' },
  purple: { border: 'border-purple-400', text: 'text-[var(--neon-purple)]', badge: 'bg-purple-100 text-[var(--neon-purple)]', btn: 'text-[var(--neon-purple)]' },
  rose: { border: 'border-rose-400', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-700', btn: 'text-rose-600' },
  slate: { border: 'border-slate-400', text: 'text-[var(--text-primary)]', badge: 'bg-slate-100 text-[var(--text-primary)]', btn: 'text-[var(--text-secondary)]' },
};

function getAttemptCount(cat) {
  try { return parseInt(localStorage.getItem('prep_attempt_' + cat) || '0', 10); } catch { return 0; }
}
function incrementAttempt(cat) {
  try { localStorage.setItem('prep_attempt_' + cat, getAttemptCount(cat) + 1); } catch {}
}

export default function InterviewPrep() {
  const [category, setCategory] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [finished, setFinished] = useState(false);
  const [course, setCourse] = useState('');

  useEffect(() => {
    try { setCourse(localStorage.getItem('student_course') || ''); } catch {}
  }, []);

  const startQuiz = (cat) => {
    const bank = QUESTION_BANK[cat];
    if (!bank) return;
    const attempts = getAttemptCount(cat);
    const roundIndex = attempts % bank.rounds.length;
    const qs = [...bank.rounds[roundIndex]].sort(() => Math.random() - 0.5);
    setCategory(cat); setQuestions(qs); setCurrent(0); setSelected(null); setAnswers([]); setFinished(false);
  };

  const handleAnswer = (idx) => {
    if (selected !== null) return;
    setSelected(idx);
    setTimeout(() => {
      const q = questions[current];
      const newAnswers = [...answers, { selected: idx, correct: q.answer, isCorrect: idx === q.answer }];
      setAnswers(newAnswers);
      if (current + 1 >= questions.length) { setFinished(true); incrementAttempt(category); }
      else { setCurrent(c => c + 1); setSelected(null); }
    }, 1000);
  };

  const score = answers.filter(a => a.isCorrect).length;

  if (!category) {
    const suggested = COURSE_SUGGESTIONS[course] || [];
    return (
      <div className="space-y-6 animate-fadeIn">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2"><Brain className="text-indigo-600" size={24} /> Interview Prep</h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">Practice round-wise mock tests. Questions rotate every attempt!</p>
        </div>
        <div className="card flex items-center gap-3 flex-wrap">
          <BookOpen size={16} className="text-indigo-500" />
          <span className="text-sm text-[var(--text-secondary)] font-medium">Your course:</span>
          <select className="input w-auto text-sm py-1" value={course}
            onChange={e => { setCourse(e.target.value); try { localStorage.setItem('student_course', e.target.value); } catch {} }}>
            <option value="">Select course…</option>
            {Object.keys(COURSE_SUGGESTIONS).map(c => <option key={c}>{c}</option>)}
          </select>
          {course && <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">Recommended rounds highlighted ✨</span>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.keys(QUESTION_BANK).map(key => {
            const cat = QUESTION_BANK[key];
            const c = colorMap[cat.color] || colorMap.slate;
            const isRec = suggested.includes(key);
            const attempts = getAttemptCount(key);
            const nextRound = (attempts % cat.rounds.length) + 1;
            return (
              <button key={key} onClick={() => startQuiz(key)}
                className={`card text-left hover:shadow-md transition-all border-2 group relative ${isRec ? c.border : 'border-transparent hover:border-slate-300'}`}>
                {isRec && <span className={`absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full font-medium ${c.badge}`}>Recommended</span>}
                <div className="text-3xl mb-3">{cat.icon}</div>
                <h3 className="font-semibold text-[var(--text-primary)]">{cat.label}</h3>
                <p className="text-xs text-[var(--text-muted)] mt-1">{cat.description}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">5 questions · Round {nextRound} of {cat.rounds.length}</p>
                {attempts > 0 && <p className="text-xs text-[var(--text-muted)] mt-0.5">Attempts: {attempts}</p>}
                <div className={`flex items-center gap-1 text-sm mt-3 font-medium ${c.btn}`}>Start Quiz <ChevronRight size={16} /></div>
              </button>
            );
          })}
        </div>
        <div className="card">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4">📌 Interview Success Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {['Research the company before the interview','Dress professionally and arrive 10 min early','Use STAR method: Situation, Task, Action, Result','Prepare 3 questions to ask the interviewer','Follow up with a thank-you email within 24 hours','Practice common questions out loud at least 3 times'].map((tip, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]"><CheckCircle size={15} className="text-green-500 flex-shrink-0 mt-0.5" />{tip}</div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (finished) {
    const pct = Math.round((score / questions.length) * 100);
    const grade = pct >= 80 ? { label: 'Excellent!', color: 'text-[var(--neon-green)]', bg: 'bg-green-50' } : pct >= 60 ? { label: 'Good', color: 'text-[var(--neon-blue)]', bg: 'bg-blue-50' } : { label: 'Needs Practice', color: 'text-[var(--neon-pink)]', bg: 'bg-red-50' };
    const cat = QUESTION_BANK[category];
    const attempts = getAttemptCount(category);
    return (
      <div className="max-w-xl mx-auto space-y-6 animate-fadeIn">
        <div className={`card text-center ${grade.bg}`}>
          <Trophy size={48} className={`mx-auto mb-3 ${grade.color}`} />
          <h2 className={`text-2xl font-bold ${grade.color}`}>{grade.label}</h2>
          <p className="text-[var(--text-secondary)] mt-1">{cat.label} — Complete</p>
          <div className="text-5xl font-bold text-[var(--text-primary)] my-4">{score}/{questions.length}</div>
          <div className="w-full bg-[var(--border-glow)] rounded-full h-3 mb-2"><div className="h-3 rounded-full transition-all" style={{ width: `${pct}%`, background: pct >= 80 ? '#22c55e' : pct >= 60 ? '#3b82f6' : '#ef4444' }} /></div>
          <p className="text-[var(--text-muted)] text-sm">{pct}% correct</p>
          <p className="text-[var(--text-muted)] text-xs mt-2">Next attempt will have different questions! (Round {(attempts % cat.rounds.length) + 1} of {cat.rounds.length})</p>
        </div>
        <div className="space-y-3">
          {questions.map((q, i) => {
            const ans = answers[i];
            return (
              <div key={i} className={`card border-l-4 ${ans?.isCorrect ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'}`}>
                <p className="text-sm font-medium text-[var(--text-primary)] mb-2">{i + 1}. {q.q}</p>
                <p className={`text-xs ${ans?.isCorrect ? 'text-[var(--neon-green)]' : 'text-red-700'}`}>
                  {ans?.isCorrect ? '✅ Correct' : `❌ Your answer: ${q.options[ans?.selected]} | Correct: ${q.options[q.answer]}`}
                </p>
              </div>
            );
          })}
        </div>
        <div className="flex gap-3">
          <button onClick={() => startQuiz(category)} className="btn-primary flex-1 flex items-center justify-center gap-2"><RotateCcw size={16} /> New Round</button>
          <button onClick={() => setCategory(null)} className="btn-secondary flex-1">← All Rounds</button>
        </div>
      </div>
    );
  }

  const q = questions[current];
  const progress = (current / questions.length) * 100;
  const cat = QUESTION_BANK[category];

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2"><span className="text-xl">{cat.icon}</span><h2 className="font-bold text-[var(--text-primary)]">{cat.label}</h2></div>
        <span className="text-sm text-[var(--text-muted)]">Question {current + 1} / {questions.length}</span>
      </div>
      <div className="w-full bg-[var(--border-glow)] rounded-full h-2"><div className="h-2 bg-[var(--neon-blue)] rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
      <div className="card">
        <p className="text-lg font-semibold text-[var(--text-primary)] mb-6">{q.q}</p>
        <div className="space-y-3">
          {q.options.map((opt, idx) => {
            let cls = 'border-2 border-[var(--border-glow)] bg-transparent hover:border-blue-400 hover:bg-blue-50 cursor-pointer';
            if (selected !== null) {
              if (idx === q.answer) cls = 'border-2 border-green-500 bg-green-50';
              else if (idx === selected && selected !== q.answer) cls = 'border-2 border-red-400 bg-red-50';
              else cls = 'border-2 border-[var(--border-glow)] bg-[var(--bg-card)] opacity-60';
            }
            return (
              <button key={idx} onClick={() => handleAnswer(idx)} className={`w-full text-left p-4 rounded-xl transition-all flex items-center gap-3 ${cls}`}>
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${selected !== null && idx === q.answer ? 'bg-green-500 text-white' : selected === idx && idx !== q.answer ? 'bg-red-500 text-white' : 'bg-slate-100 text-[var(--text-secondary)]'}`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="text-[var(--text-primary)] text-sm">{opt}</span>
                {selected !== null && idx === q.answer && <CheckCircle size={18} className="text-green-500 ml-auto" />}
                {selected === idx && idx !== q.answer && <XCircle size={18} className="text-[var(--neon-pink)] ml-auto" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
