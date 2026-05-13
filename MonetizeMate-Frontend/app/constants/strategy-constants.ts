export const INDUSTRIES = [
  'Fintech',
  'Healthcare', 
  'E-commerce / Retail',
  'Social Media / Content',
  'Logistics / Mapping',
  'SaaS / B2B Tech',
  'Other'
];

export const ANSWER_OPTIONS = [
  { text: 'Strongly Disagree', value: -2 },
  { text: 'Disagree', value: -1 },
  { text: 'Neutral', value: 0 },
  { text: 'Agree', value: 1 },
  { text: 'Strongly Agree', value: 2 }
];

export const QUESTIONNAIRE_QUESTIONS = [
  {
    id: "businessType",
    title: "My business primarily serves other businesses (B2B) rather than individual consumers (B2C)",
    description: "This helps us understand your target market and customer behavior.",
  },
  {
    id: "userBase",
    title: "My business has a large and established user base (1,000+ active users)",
    description: "Understanding your scale helps determine the best pricing approach.",
  },
  {
    id: "currentRevenue",
    title: "My business currently generates significant monthly recurring revenue (>$10,000/month)",
    description: "This helps us understand your monetization urgency and goals.",
  },
  {
    id: "primaryGoal",
    title: "My primary business goal is to maximize revenue growth rather than user acquisition",
    description: "Different goals require different monetization approaches.",
  },
  {
    id: "customerWillingness",
    title: "My customers are willing to pay premium prices for high-quality solutions",
    description: "Customer payment behavior affects which models will work best.",
  },
  {
    id: "competition",
    title: "My market has intense competition with many similar solutions available",
    description: "Competition level affects pricing flexibility and positioning.",
  },
  {
    id: "apiComplexity",
    title: "My product/service is complex with many features and configuration options",
    description: "Complexity affects how you can structure your pricing.",
  },
  {
    id: "targetMarket",
    title: "My primary customers are large enterprises rather than small businesses or individuals",
    description: "Different markets have different payment preferences and expectations.",
  },
  {
    id: "timeToMarket",
    title: "I need to implement monetization strategies quickly (within 3 months)",
    description: "Timeline affects which strategies are feasible.",
  },
  {
    id: "resourceLevel",
    title: "My team has strong technical capabilities and can implement complex solutions",
    description: "Implementation complexity should match your capabilities.",
  }
];