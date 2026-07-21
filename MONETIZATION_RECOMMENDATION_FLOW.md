# MonetizeMate: Questionnaire to Recommendation Technical Flow

## Overview
This document explains the complete technical flow of how user answers from the Strategy Advisor questionnaire are processed to generate personalized monetization recommendations.

---

## 1. HIGH-LEVEL FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│ USER STARTS STRATEGY ADVISOR                                │
│ - Select Industry                                           │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│ QUESTIONNAIRE PAGE (/strategy-adviser/questionnaire)        │
│ - User answers 10 targeted questions                        │
│ - Industry-specific assessment                             │
│ - Answers stored in component state                        │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│ LOADING SCREENS (3-5 seconds)                              │
│ 1. "Processing Your Responses"                             │
│ 2. "Generating Strategy Recommendations"                   │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│ RECOMMENDATION PAGE (/dashboard/recommendation)             │
│ - Display calculated recommendations                        │
│ - Sorted by relevance score (highest first)                │
│ - Show implementation guides                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. STEP 1: QUESTIONNAIRE COLLECTION

### Frontend: `/app/dashboard/strategy-adviser/questionnaire/page.tsx`

**Flow:**
1. User selects industry (e.g., "SaaS", "B2B", "B2C")
2. Navigates to questionnaire page with industry as query parameter
3. Answers 10 targeted questions from `QUESTIONNAIRE_QUESTIONS` constant
4. Questions are industry-specific based on selected industry

**Data Structure:**
```typescript
// QuestionnaireAnswers type contains:
{
  businessType: number,          // 0-2 scale
  userBase: number,              // Size of user base
  currentRevenue: number,        // Current revenue level
  primaryGoal: number,           // Monetization goal
  customerWillingness: number,   // Willingness to pay
  competition: number,           // Competition level
  apiComplexity: number,         // API complexity
  targetMarket: number,          // Target market size
  timeToMarket: number,          // Time constraints
  resourceLevel: number,         // Available resources
  ... (other business metrics)
}
```

**User Actions:**
- Click "Next" to proceed through questions
- Each question displayed one at a time
- All answers tracked in component state

---

## 3. STEP 2: ANSWER SUBMISSION TRIGGER

### Frontend: `questionnaire/page.tsx` - `handleNext()` function

**What Happens:**
```typescript
// When user answers last question and clicks Next:
1. setFlowType('analyzing')        // Show loading screen
   └─ Wait 3 seconds
   └─ setFlowType('generating')    // Show recommendation generation screen
   └─ Wait 2 seconds
   └─ Navigate to recommendation page
```

**Query Parameters Passed:**
```
/dashboard/recommendation?
  answers={JSON.stringify(answers)}
  &analysisSource=manual
  &selectedIndustry=SaaS
```

---

## 4. STEP 3: RECOMMENDATION CALCULATION (Frontend)

### Frontend: `/app/constants/strategy-helpers.ts` - `calculateRecommendations()`

**Algorithm Overview:**
The function analyzes questionnaire answers and scores 5 monetization models.

**5 Base Monetization Models:**

| Model | Description | Use Case |
|-------|-------------|----------|
| **Freemium** | Free tier + paid features | Large user base, viral growth |
| **Subscription** | Recurring monthly/annual | Predictable revenue |
| **Usage-Based** | Pay per API call/usage | Variable, scales with usage |
| **Hybrid** | Combination of models | Maximum revenue flexibility |
| **Value-Based** | Price by customer value | High-margin, enterprise focus |

**Scoring Logic:**
```
1. Start with base score of 0 for each model
2. Loop through user answers
3. Match answers to business factors
4. Add points to relevant models

Examples:
- Large user base → +2 points to Subscription & Hybrid
- High current revenue → +2 points to Value-Based
- High competition → +2 points to Freemium
- Quick implementation needed → +2 points to Subscription
- Strong tech team → +2 points to Hybrid
- Premium pricing tolerance → +2 points to Value-Based

5. Sort by total score (highest first)
6. Return top recommendations with reasoning
```

**Output Data Structure:**
```typescript
{
  id: "subscription",
  name: "Subscription Model",
  description: "Recurring monthly or annual payments",
  score: 85,                    // Percentage match (0-100)
  pros: ["Predictable revenue", "Strong customer relationships"],
  cons: ["Subscription fatigue", "Churn management"],
  implementation: "Set up billing system and tier structure",
  timeframe: "1-2 months",
  expectedRevenue: "Predictable, recurring",
  reasoning: "Large user base supports recurring/hybrid models. Strong tech team can implement hybrid."
}
```

---

## 5. STEP 4: DISPLAY RECOMMENDATIONS

### Frontend: `/app/dashboard/recommendation/page.tsx`

**Process:**
1. Retrieves calculated recommendations from query parameters
2. Displays models ranked by score (highest first)
3. Top recommendation highlighted with ring border
4. Shows:
   - Model name and icon
   - Match percentage (score)
   - Description
   - Pros and cons
   - Implementation guidance
   - Timeline and expected revenue
   - Reasoning for recommendation

**User Actions:**
- View all recommendations
- Click "Start Implementation" to see implementation guide
- "Start Over" to restart questionnaire
- "Back to AI Chat" if came from AI mode

---

## 6. BACKEND FLOW (ALTERNATIVE)

### Backend: `/app/api/monetization_recommendation_endpoints.py`

The backend provides an alternative API-based calculation if needed:

**Endpoint:** `POST /monetization/recommend`
```
Request:
{
  "answers": {
    1: "Agree",
    2: "Strongly Agree",
    3: "Neutral",
    ...
  }
}

Response:
[
  {
    "id": "subscription",
    "name": "Subscription Model",
    "score": 85,
    "description": "...",
    "pros": [...],
    "cons": [...],
    "implementation": "...",
    "timeframe": "1-2 months",
    "expectedRevenue": "...",
    "reasoning": "..."
  },
  ...
]
```

**Backend Processing:**
1. Receives questionnaire answers
2. Fetches question details from database
3. Calls `score_models()` function to calculate scores
4. Returns sorted list of recommendations

**Scoring on Backend:**
```python
def score_models(answers, questions):
    models = [base models]
    
    for question_id, answer in answers.items():
        question = questions[question_id]
        
        # Match business factors to score models
        if "user base" in question and answer == "Agree":
            subscription_model += 2
            hybrid_model += 2
        
        if "revenue" in question and answer == "Agree":
            value_based_model += 2
        
        # ... more matching rules
    
    return sorted(models, by score, descending)
```

---

## 7. DATA FLOW SUMMARY

```
Questionnaire Answers
    │
    ├─ Frontend: strategy-helpers.calculateRecommendations()
    │  └─ Scores each model based on answers
    │  └─ Returns sorted recommendations
    │
    └─ Backend: /monetization/recommend (optional)
       └─ Database query for questions
       └─ Score models function
       └─ Returns JSON recommendations
```

---

## 8. KEY FILES & LOCATIONS

| Component | File | Purpose |
|-----------|------|---------|
| **Questionnaire UI** | `/app/dashboard/strategy-adviser/questionnaire/page.tsx` | User input collection |
| **Recommendation UI** | `/app/dashboard/recommendation/page.tsx` | Display results |
| **Scoring Logic** | `/app/constants/strategy-helpers.ts` | Calculate scores |
| **Backend API** | `/app/api/monetization_recommendation_endpoints.py` | Alternative backend calculation |
| **Questions DB** | Database Questionnaire table | Store questions |
| **Business Constants** | `/app/constants/strategy-constants.ts` | Question definitions |

---

## 9. RECOMMENDATION SCORING FACTORS

### Factors That Increase Each Model Score:

**Subscription Model:**
- Large user base
- Stable revenue goal
- Quick time-to-market
- Predictable customer base
- Resource constraints

**Freemium Model:**
- High competition
- Need for quick user adoption
- Market education needed
- Growth-focused business
- Tech-savvy users

**Usage-Based Model:**
- Highly variable customer usage
- Fair pricing priority
- Technical monitoring capability
- Transparent billing preference
- High-volume low-margin customers

**Hybrid Model:**
- Strong technical capabilities
- Complex business requirements
- Large and diverse customer base
- Revenue optimization focus
- Multi-segment market

**Value-Based Model:**
- High current revenue
- Premium pricing tolerance
- Enterprise customer focus
- Outcome-focused business
- Complex integrations

---

## 10. TECHNICAL CONSIDERATIONS

### Performance
- Calculation is instant (client-side)
- No API calls during questionnaire phase
- Recommendations shown within 5 seconds

### Accuracy
- Based on pattern matching business factors
- Simple rule-based scoring (not ML)
- Can be improved with more sophisticated algorithms

### Extensibility
- Easy to add more factors
- New models can be added to MONETIZATION_MODELS
- Scoring rules can be enhanced

### Future Improvements
- Machine learning-based scoring
- Integration with actual API usage data
- Historical success rate tracking
- A/B testing different recommendation algorithms

---

## 11. EXAMPLE SCENARIO

**User Journey:**

1. **Selection:** User selects "SaaS" industry
2. **Questionnaire:** Answers 10 questions
   - Large user base (500K+) → Agree
   - Current revenue (>$100K) → Agree
   - Quick monetization needed → Agree
   - Strong technical team → Strongly Agree
   - Premium pricing acceptance → Neutral

3. **Backend Scoring:**
   - Subscription: 4 points (large base, quick, revenue)
   - Hybrid: 3 points (large base, strong tech)
   - Value-Based: 2 points (current revenue, premium)
   - Freemium: 1 point (large base)
   - Usage-Based: 0 points

4. **Results Display:**
   - Subscription Model (65% match) - TOP RECOMMENDATION
   - Hybrid Model (50% match)
   - Value-Based Model (30% match)
   - Freemium Model (20% match)
   - Usage-Based Model (0% match)

5. **Recommendation Reasoning:**
   > "Large user base supports recurring models. Quick implementation favors subscription. Strong tech team can implement hybrid. Current revenue supports value-based pricing."

---

## 12. API INTEGRATION POINTS

### Current Implementation
- Frontend-only calculation (no backend call needed)
- Results passed via URL query parameters

### Optional Backend Usage
- POST `/monetization/recommend` - Submit answers, get recommendations
- GET `/questionnaire/` - Fetch all questions

### Future Enhancement
- Could cache recommendations in database
- Track which recommendations were chosen by users
- Analyze recommendation accuracy over time

---

## Summary

The MonetizeMate recommendation flow is a **client-side calculation system** that:

1. **Collects** structured business answers via questionnaire
2. **Scores** 5 monetization models based on matching business factors
3. **Ranks** models by relevance to the user's specific situation
4. **Displays** detailed recommendations with implementation guidance

The system prioritizes speed (instant calculation), simplicity (pattern matching), and clarity (detailed reasoning for each recommendation).
