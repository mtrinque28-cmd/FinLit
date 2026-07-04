// Curriculum data for Wealthy Owl
// The total rewards across all lessons sum to exactly $1,000,000
// so that finishing every lesson climbs the learner to the goal.

const CURRICULUM = {
  goal: 1_000_000,
  milestones: [
    { value: 1_000,    label: "First Grand",      emoji: "🌱" },
    { value: 10_000,   label: "Emergency Buffer", emoji: "🛟" },
    { value: 50_000,   label: "Getting Serious",  emoji: "💼" },
    { value: 100_000,  label: "Six Figures!",     emoji: "🚀" },
    { value: 250_000,  label: "Quarter Mil",      emoji: "🏔️" },
    { value: 500_000,  label: "Half Way There",   emoji: "🌟" },
    { value: 1_000_000, label: "Millionaire",     emoji: "👑" },
  ],
  units: [
    {
      id: "basics",
      title: "Money Mindset & Basics",
      subtitle: "Build the mental model of money",
      icon: "💡",
      color: "#58cc02",
      sections: [
        {
          title: null,
          lessons: [
            {
              id: "basics-1",
              title: "What is Money?",
              icon: "💵",
              reward: 2_500,
              questions: [
                {
                  type: "mc",
                  prompt: "What best describes the primary function of money?",
                  options: [
                    "A store of value and medium of exchange",
                    "Only a piece of paper the government prints",
                    "A limited resource that never changes value",
                    "Something backed only by gold",
                  ],
                  correct: 0,
                  explanation:
                    "Money is a store of value, a medium of exchange, and a unit of account.",
                },
                {
                  type: "tf",
                  prompt: "Inflation reduces the purchasing power of money over time.",
                  correct: true,
                  explanation:
                    "As prices rise, each dollar buys less. That's inflation eating your purchasing power.",
                },
              ],
            },
            {
              id: "basics-2",
              title: "Needs vs Wants",
              icon: "🛒",
              reward: 2_500,
              questions: [
                {
                  type: "mc",
                  prompt: "Which of the following is a need, not a want?",
                  options: ["Streaming subscription", "Rent", "New sneakers", "Dining out"],
                  correct: 1,
                  explanation:
                    "Shelter is a need. Everything else here is a lifestyle choice.",
                },
              ],
            },
            {
              id: "basics-3",
              title: "Financial Goals",
              icon: "🎯",
              reward: 2_500,
              questions: [
                {
                  type: "mc",
                  prompt: "A good financial goal is...",
                  options: [
                    "Vague and long-term",
                    "SMART: specific, measurable, achievable, relevant, time-bound",
                    "Whatever your friend is doing",
                    "Impossible to track",
                  ],
                  correct: 1,
                  explanation:
                    "SMART goals give you a clear target and deadline.",
                },
              ],
            },
            {
              id: "basics-4",
              title: "Compound Interest",
              icon: "📈",
              reward: 2_500,
              questions: [
                {
                  type: "tf",
                  prompt: "Compound interest means earning interest on your interest.",
                  correct: true,
                  explanation:
                    "That's exactly why starting early is so powerful.",
                },
              ],
            },
          ],
        },
      ],
    },

    {
      id: "budgeting",
      title: "Budgeting & Cash Flow",
      subtitle: "Master where your money goes",
      icon: "🧾",
      color: "#1cb0f6",
      sections: [
        {
          title: null,
          lessons: [
            {
              id: "budget-1",
              title: "Income vs Expenses",
              icon: "⚖️",
              reward: 6_000,
              questions: [
                {
                  type: "mc",
                  prompt: "Cash flow is positive when...",
                  options: [
                    "Expenses exceed income",
                    "Income equals expenses",
                    "Income exceeds expenses",
                    "You take on new debt",
                  ],
                  correct: 2,
                  explanation:
                    "Positive cash flow gives you money to save and invest.",
                },
              ],
            },
            {
              id: "budget-2",
              title: "The 50/30/20 Rule",
              icon: "🥧",
              reward: 6_000,
              questions: [
                {
                  type: "mc",
                  prompt: "In the 50/30/20 budget, 20% is for...",
                  options: ["Wants", "Needs", "Savings & debt payoff", "Taxes"],
                  correct: 2,
                  explanation:
                    "50% needs, 30% wants, 20% savings and debt reduction.",
                },
              ],
            },
            {
              id: "budget-3",
              title: "Tracking Spending",
              icon: "🔎",
              reward: 6_000,
              questions: [],
            },
            {
              id: "budget-4",
              title: "Emergency Fund",
              icon: "🛟",
              reward: 6_000,
              questions: [
                {
                  type: "mc",
                  prompt: "A starter emergency fund typically covers...",
                  options: [
                    "A single day of expenses",
                    "3–6 months of essential expenses",
                    "10 years of income",
                    "Only medical bills",
                  ],
                  correct: 1,
                  explanation:
                    "3–6 months of essentials is the classic target.",
                },
              ],
            },
            {
              id: "budget-5",
              title: "Sinking Funds",
              icon: "💧",
              reward: 6_000,
              questions: [],
            },
          ],
        },
      ],
    },

    {
      id: "banking",
      title: "Banking & Accounts",
      subtitle: "Checking, savings, HYSAs, and CDs",
      icon: "🏦",
      color: "#ce82ff",
      sections: [
        {
          title: null,
          lessons: [
            {
              id: "bank-1",
              title: "Checking Accounts",
              icon: "💳",
              reward: 8_000,
              questions: [
                {
                  type: "tf",
                  prompt: "Checking accounts are designed for frequent transactions.",
                  correct: true,
                  explanation:
                    "They're your daily-driver account for spending and paying bills.",
                },
              ],
            },
            {
              id: "bank-2",
              title: "Savings & HYSAs",
              icon: "🐷",
              reward: 8_000,
              questions: [
                {
                  type: "mc",
                  prompt: "A High-Yield Savings Account (HYSA) is best used for...",
                  options: [
                    "Long-term stock investing",
                    "Short-term savings and emergency funds",
                    "Buying real estate directly",
                    "Trading options",
                  ],
                  correct: 1,
                  explanation:
                    "HYSAs offer higher interest than checking with same-day liquidity.",
                },
              ],
            },
            {
              id: "bank-3",
              title: "CDs & Money Markets",
              icon: "💿",
              reward: 8_000,
              questions: [],
            },
            {
              id: "bank-4",
              title: "FDIC & NCUA Insurance",
              icon: "🛡️",
              reward: 8_000,
              questions: [
                {
                  type: "tf",
                  prompt: "FDIC insurance protects bank deposits up to $250,000 per depositor per bank.",
                  correct: true,
                  explanation:
                    "That's the standard coverage limit today.",
                },
              ],
            },
            {
              id: "bank-5",
              title: "Fees to Avoid",
              icon: "🚫",
              reward: 8_000,
              questions: [],
            },
          ],
        },
      ],
    },

    {
      id: "credit",
      title: "Credit & Debt",
      subtitle: "Build credit, crush debt",
      icon: "💳",
      color: "#ff9600",
      sections: [
        {
          title: null,
          lessons: [
            {
              id: "credit-1",
              title: "How Credit Scores Work",
              icon: "📊",
              reward: 10_000,
              questions: [
                {
                  type: "mc",
                  prompt: "The biggest factor in your FICO score is...",
                  options: [
                    "Types of credit used",
                    "Length of credit history",
                    "Payment history",
                    "Number of inquiries",
                  ],
                  correct: 2,
                  explanation:
                    "Payment history is ~35% of your FICO score.",
                },
              ],
            },
            {
              id: "credit-2",
              title: "Credit Cards 101",
              icon: "💳",
              reward: 10_000,
              questions: [
                {
                  type: "tf",
                  prompt: "Paying your credit card statement balance in full avoids interest entirely.",
                  correct: true,
                  explanation:
                    "Pay in full by the due date and you owe zero interest.",
                },
              ],
            },
            {
              id: "credit-3",
              title: "Utilization & Limits",
              icon: "📉",
              reward: 10_000,
              questions: [],
            },
            {
              id: "credit-4",
              title: "Debt Snowball vs Avalanche",
              icon: "❄️",
              reward: 10_000,
              questions: [
                {
                  type: "mc",
                  prompt: "The debt avalanche method prioritizes paying off debts with...",
                  options: [
                    "Smallest balance first",
                    "Highest interest rate first",
                    "Oldest account first",
                    "Random selection",
                  ],
                  correct: 1,
                  explanation:
                    "Avalanche = highest rate first. Mathematically optimal.",
                },
              ],
            },
            {
              id: "credit-5",
              title: "Good Debt vs Bad Debt",
              icon: "⚖️",
              reward: 10_000,
              questions: [],
            },
          ],
        },
      ],
    },

    {
      id: "investing",
      title: "Investing Fundamentals",
      subtitle: "Put your money to work",
      icon: "📈",
      color: "#2ecc71",
      sections: [
        {
          title: null,
          lessons: [
            {
              id: "invest-1",
              title: "What is a Stock?",
              icon: "🏢",
              reward: 15_000,
              questions: [
                {
                  type: "mc",
                  prompt: "Owning a share of stock means you own...",
                  options: [
                    "A loan to the company",
                    "A tiny piece of the company",
                    "Nothing legal or financial",
                    "The company's building",
                  ],
                  correct: 1,
                  explanation:
                    "Stocks are equity — fractional ownership.",
                },
              ],
            },
            {
              id: "invest-2",
              title: "Bonds Explained",
              icon: "📜",
              reward: 15_000,
              questions: [
                {
                  type: "tf",
                  prompt: "A bond is essentially a loan you make to a government or company.",
                  correct: true,
                  explanation:
                    "You lend, they pay interest, and return principal at maturity.",
                },
              ],
            },
            {
              id: "invest-3",
              title: "Index Funds & ETFs",
              icon: "🧺",
              reward: 15_000,
              questions: [
                {
                  type: "mc",
                  prompt: "An index fund is best described as...",
                  options: [
                    "A hand-picked portfolio managed by an expert",
                    "A fund that tracks a market index like the S&P 500",
                    "A guaranteed-return account",
                    "A short-term savings tool",
                  ],
                  correct: 1,
                  explanation:
                    "Index funds passively track a benchmark, keeping fees low.",
                },
              ],
            },
            {
              id: "invest-4",
              title: "Risk vs Return",
              icon: "🎢",
              reward: 15_000,
              questions: [],
            },
            {
              id: "invest-5",
              title: "Diversification",
              icon: "🌐",
              reward: 15_000,
              questions: [],
            },
            {
              id: "invest-6",
              title: "Dollar-Cost Averaging",
              icon: "📆",
              reward: 15_000,
              questions: [
                {
                  type: "tf",
                  prompt: "Dollar-cost averaging means investing a fixed amount on a regular schedule.",
                  correct: true,
                  explanation:
                    "It smooths out market timing risk over time.",
                },
              ],
            },
          ],
        },
      ],
    },

    {
      id: "retirement",
      title: "Retirement Planning",
      subtitle: "Tax-advantaged accounts + long-term strategy",
      icon: "🌴",
      color: "#ff4b4b",
      sections: [
        {
          title: "401(k) Deep Dive",
          lessons: [
            {
              id: "ret-401k-1",
              title: "What is a 401(k)?",
              icon: "🏦",
              reward: 15_000,
              questions: [
                {
                  type: "mc",
                  prompt: "A 401(k) is offered by...",
                  options: [
                    "The federal government directly",
                    "Your employer",
                    "Any brokerage",
                    "Your bank",
                  ],
                  correct: 1,
                  explanation:
                    "It's an employer-sponsored plan.",
                },
              ],
            },
            {
              id: "ret-401k-2",
              title: "Employer Match",
              icon: "🤝",
              reward: 15_000,
              questions: [
                {
                  type: "tf",
                  prompt: "An employer match is essentially free money you should try to capture.",
                  correct: true,
                  explanation:
                    "Not contributing enough to get the full match leaves guaranteed money on the table.",
                },
              ],
            },
            {
              id: "ret-401k-3",
              title: "Traditional vs Roth 401(k)",
              icon: "🔀",
              reward: 15_000,
              questions: [
                {
                  type: "mc",
                  prompt: "A Roth 401(k) is funded with...",
                  options: [
                    "Pre-tax dollars",
                    "After-tax dollars",
                    "Only employer contributions",
                    "Tax-free income only",
                  ],
                  correct: 1,
                  explanation:
                    "Roth = after-tax now, tax-free withdrawals later.",
                },
              ],
            },
            {
              id: "ret-401k-4",
              title: "Contribution Limits",
              icon: "📏",
              reward: 15_000,
              questions: [],
            },
          ],
        },
        {
          title: "IRAs & Roth IRAs",
          lessons: [
            {
              id: "ret-ira-1",
              title: "Traditional IRA",
              icon: "🏛️",
              reward: 12_500,
              questions: [
                {
                  type: "tf",
                  prompt: "Traditional IRA contributions may be tax-deductible today.",
                  correct: true,
                  explanation:
                    "Deductibility depends on income and workplace plan coverage.",
                },
              ],
            },
            {
              id: "ret-ira-2",
              title: "Roth IRA",
              icon: "🌹",
              reward: 12_500,
              questions: [
                {
                  type: "mc",
                  prompt: "Qualified Roth IRA withdrawals in retirement are...",
                  options: [
                    "Fully taxable",
                    "Taxed at capital gains rates",
                    "Tax-free",
                    "Taxed as ordinary income",
                  ],
                  correct: 2,
                  explanation:
                    "That's the whole magic of the Roth.",
                },
              ],
            },
            {
              id: "ret-ira-3",
              title: "Contribution Limits",
              icon: "📏",
              reward: 12_500,
              questions: [],
            },
            {
              id: "ret-ira-4",
              title: "Backdoor Roth",
              icon: "🚪",
              reward: 12_500,
              questions: [],
            },
          ],
        },
        {
          title: "HSA — The Triple Tax Advantage",
          lessons: [
            {
              id: "ret-hsa-1",
              title: "What is an HSA?",
              icon: "🩺",
              reward: 10_000,
              questions: [
                {
                  type: "mc",
                  prompt: "To contribute to an HSA you must be enrolled in...",
                  options: [
                    "Any health insurance plan",
                    "A high-deductible health plan (HDHP)",
                    "Medicare Part A",
                    "No plan at all",
                  ],
                  correct: 1,
                  explanation:
                    "HSAs are paired with HDHPs.",
                },
              ],
            },
            {
              id: "ret-hsa-2",
              title: "Triple Tax Advantage",
              icon: "🌟",
              reward: 10_000,
              questions: [
                {
                  type: "tf",
                  prompt: "HSAs offer tax-free contributions, tax-free growth, and tax-free qualified withdrawals.",
                  correct: true,
                  explanation:
                    "No other account has all three.",
                },
              ],
            },
            {
              id: "ret-hsa-3",
              title: "HSA as a Retirement Tool",
              icon: "🌴",
              reward: 10_000,
              questions: [],
            },
          ],
        },
        {
          title: "Pensions & Social Security",
          lessons: [
            {
              id: "ret-ss-1",
              title: "How Social Security Works",
              icon: "🇺🇸",
              reward: 10_000,
              questions: [],
            },
            {
              id: "ret-ss-2",
              title: "When to Claim",
              icon: "⏰",
              reward: 10_000,
              questions: [],
            },
            {
              id: "ret-ss-3",
              title: "Pensions Today",
              icon: "📜",
              reward: 10_000,
              questions: [],
            },
          ],
        },
        {
          title: "Retirement Strategy",
          lessons: [
            {
              id: "ret-strat-1",
              title: "The 4% Rule",
              icon: "📐",
              reward: 20_000,
              questions: [
                {
                  type: "mc",
                  prompt: "The 4% rule suggests you can withdraw about 4% of your portfolio...",
                  options: [
                    "Per month",
                    "Per week",
                    "Per year, adjusted for inflation",
                    "Just once ever",
                  ],
                  correct: 2,
                  explanation:
                    "It's an annual withdrawal guideline in retirement.",
                },
              ],
            },
            {
              id: "ret-strat-2",
              title: "Sequence of Returns Risk",
              icon: "🎲",
              reward: 20_000,
              questions: [],
            },
            {
              id: "ret-strat-3",
              title: "Asset Location",
              icon: "🗺️",
              reward: 20_000,
              questions: [],
            },
          ],
        },
      ],
    },

    {
      id: "taxes",
      title: "Taxes",
      subtitle: "Brackets, deductions, and planning",
      icon: "🧮",
      color: "#f0b90b",
      sections: [
        {
          title: null,
          lessons: [
            {
              id: "tax-1",
              title: "Marginal Tax Brackets",
              icon: "📶",
              reward: 16_000,
              questions: [
                {
                  type: "tf",
                  prompt: "Moving into a higher tax bracket only taxes the income above that bracket's threshold at the higher rate.",
                  correct: true,
                  explanation:
                    "US taxes are marginal — only the top slice pays the higher rate.",
                },
              ],
            },
            {
              id: "tax-2",
              title: "Standard vs Itemized",
              icon: "📄",
              reward: 16_000,
              questions: [],
            },
            {
              id: "tax-3",
              title: "Tax-Advantaged Accounts",
              icon: "🛡️",
              reward: 16_000,
              questions: [],
            },
            {
              id: "tax-4",
              title: "Capital Gains",
              icon: "📈",
              reward: 16_000,
              questions: [
                {
                  type: "mc",
                  prompt: "Long-term capital gains apply to assets held for...",
                  options: [
                    "Any length of time",
                    "Less than a year",
                    "More than one year",
                    "More than 10 years",
                  ],
                  correct: 2,
                  explanation:
                    "Hold >1 year for the lower long-term rate.",
                },
              ],
            },
            {
              id: "tax-5",
              title: "Filing Basics",
              icon: "🗂️",
              reward: 16_000,
              questions: [],
            },
          ],
        },
      ],
    },

    {
      id: "insurance",
      title: "Insurance",
      subtitle: "Protect what you've built",
      icon: "🛡️",
      color: "#8e44ad",
      sections: [
        {
          title: null,
          lessons: [
            {
              id: "ins-1",
              title: "Health Insurance",
              icon: "🩺",
              reward: 12_000,
              questions: [
                {
                  type: "mc",
                  prompt: "A deductible is...",
                  options: [
                    "What you pay monthly to keep the plan",
                    "What you pay out-of-pocket before insurance starts covering costs",
                    "The maximum the insurer will ever pay",
                    "A tax on your policy",
                  ],
                  correct: 1,
                  explanation:
                    "Premium = monthly. Deductible = your share before coverage kicks in.",
                },
              ],
            },
            {
              id: "ins-2",
              title: "Auto Insurance",
              icon: "🚗",
              reward: 12_000,
              questions: [],
            },
            {
              id: "ins-3",
              title: "Renters & Homeowners",
              icon: "🏠",
              reward: 12_000,
              questions: [],
            },
            {
              id: "ins-4",
              title: "Life Insurance",
              icon: "❤️",
              reward: 12_000,
              questions: [
                {
                  type: "tf",
                  prompt: "Term life insurance is generally cheaper than whole life for the same coverage amount.",
                  correct: true,
                  explanation:
                    "Term is pure insurance for a fixed period; whole life bundles savings and lasts your lifetime.",
                },
              ],
            },
            {
              id: "ins-5",
              title: "Disability & Umbrella",
              icon: "☔",
              reward: 12_000,
              questions: [],
            },
          ],
        },
      ],
    },

    {
      id: "realestate",
      title: "Real Estate & Housing",
      subtitle: "Rent, buy, mortgages, and beyond",
      icon: "🏡",
      color: "#3498db",
      sections: [
        {
          title: null,
          lessons: [
            {
              id: "re-1",
              title: "Renting vs Buying",
              icon: "🔑",
              reward: 20_000,
              questions: [
                {
                  type: "tf",
                  prompt: "Buying a home is always a better financial move than renting.",
                  correct: false,
                  explanation:
                    "It depends on how long you'll stay, local prices, rates, and opportunity cost.",
                },
              ],
            },
            {
              id: "re-2",
              title: "Mortgage Basics",
              icon: "🏦",
              reward: 20_000,
              questions: [
                {
                  type: "mc",
                  prompt: "In a fixed-rate mortgage, the interest rate...",
                  options: [
                    "Changes every month",
                    "Stays the same for the life of the loan",
                    "Only applies for the first year",
                    "Depends on the stock market",
                  ],
                  correct: 1,
                  explanation:
                    "Fixed means locked. Predictable payments for the term.",
                },
              ],
            },
            {
              id: "re-3",
              title: "Down Payments & PMI",
              icon: "💰",
              reward: 20_000,
              questions: [],
            },
            {
              id: "re-4",
              title: "True Cost of Ownership",
              icon: "🧰",
              reward: 20_000,
              questions: [],
            },
            {
              id: "re-5",
              title: "Real Estate as an Investment",
              icon: "🏗️",
              reward: 20_000,
              questions: [],
            },
          ],
        },
      ],
    },

    {
      id: "advanced",
      title: "Advanced Wealth Building",
      subtitle: "Optimize, protect, and pass it on",
      icon: "👑",
      color: "#e67e22",
      sections: [
        {
          title: null,
          lessons: [
            {
              id: "adv-1",
              title: "Asset Allocation",
              icon: "🥧",
              reward: 60_000,
              questions: [
                {
                  type: "mc",
                  prompt: "Asset allocation is primarily about...",
                  options: [
                    "Picking individual winning stocks",
                    "Choosing the split between stocks, bonds, and other asset classes",
                    "Timing the market perfectly",
                    "Only investing in tech",
                  ],
                  correct: 1,
                  explanation:
                    "Allocation across asset classes drives most long-term return variance.",
                },
              ],
            },
            {
              id: "adv-2",
              title: "Tax-Loss Harvesting",
              icon: "🍂",
              reward: 60_000,
              questions: [],
            },
            {
              id: "adv-3",
              title: "FIRE Movement",
              icon: "🔥",
              reward: 60_000,
              questions: [
                {
                  type: "tf",
                  prompt: "FIRE stands for Financial Independence, Retire Early.",
                  correct: true,
                  explanation:
                    "The idea: save aggressively, invest, and hit a portfolio big enough to live off.",
                },
              ],
            },
            {
              id: "adv-4",
              title: "Estate Planning",
              icon: "📜",
              reward: 60_000,
              questions: [],
            },
            {
              id: "adv-5",
              title: "Generational Wealth",
              icon: "👑",
              reward: 70_000,
              questions: [],
            },
          ],
        },
      ],
    },
  ],
};

// Sanity check helper (available in console)
function _sumRewards() {
  let sum = 0;
  for (const u of CURRICULUM.units)
    for (const s of u.sections)
      for (const l of s.lessons) sum += l.reward;
  return sum;
}
