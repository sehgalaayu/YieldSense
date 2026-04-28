export interface PortfolioScoreBreakdown {
  totalScore: number;          // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  gradeColor: string;
  components: {
    expenseRatioScore: number;   // 0-30 points
    directVsRegularScore: number; // 0-30 points
    diversificationScore: number; // 0-20 points
    riskAlignmentScore: number;   // 0-20 points
  };
  insights: string[];            // 3-5 actionable insights
  topAction: string;             // Single most important action
}

export const calculatePortfolioScore = (
  holdings: any[], // Use any for now or import actual types if available
  analysisResults: any[],
  userRiskTolerance: 'Low' | 'Medium' | 'High'
): PortfolioScoreBreakdown => {

  // COMPONENT 1: Expense Ratio Score (0-30 pts)
  // Average expense ratio across portfolio
  // < 0.5% = 30 pts (excellent - mostly Direct/Index)
  // 0.5-1.0% = 20 pts (good)
  // 1.0-1.5% = 10 pts (average - some Regular plans)
  // > 1.5% = 0 pts (poor - mostly Regular plans)
  const avgExpenseRatio = analysisResults.length > 0 
    ? analysisResults.reduce((sum, r) => sum + r.analysis.regularFund.expenseRatio, 0) / analysisResults.length
    : 0;
  
  const expenseRatioScore = 
    avgExpenseRatio < 0.5 ? 30 :
    avgExpenseRatio < 1.0 ? 20 :
    avgExpenseRatio < 1.5 ? 10 : 0;

  // COMPONENT 2: Direct vs Regular Score (0-30 pts)
  // % of portfolio in Regular plans (bad) vs Direct (good)
  // 0% Regular = 30 pts
  // 25% Regular = 20 pts
  // 50% Regular = 10 pts
  // 75%+ Regular = 0 pts
  const regularCount = analysisResults.filter(
    r => r.regularFund.variant === 'Regular'
  ).length;
  const regularPct = analysisResults.length > 0 ? (regularCount / analysisResults.length) * 100 : 0;
  
  const directVsRegularScore =
    regularPct === 0 ? 30 :
    regularPct <= 25 ? 20 :
    regularPct <= 50 ? 10 : 0;

  // COMPONENT 3: Diversification Score (0-20 pts)
  // Are they diversified across categories?
  const categories = new Set(
    analysisResults.map(r => r.regularFund.category)
  );
  const categoryCount = categories.size;
  
  const diversificationScore =
    categoryCount >= 4 ? 20 :
    categoryCount === 3 ? 15 :
    categoryCount === 2 ? 10 : 5;

  // COMPONENT 4: Risk Alignment Score (0-20 pts)
  // Does their portfolio risk match their stated tolerance?
  const highRiskCount = analysisResults.filter(r => 
    r.regularFund.riskLevel === 'Very High' || 
    r.regularFund.riskLevel === 'High'
  ).length;
  const highRiskPct = analysisResults.length > 0 ? (highRiskCount / analysisResults.length) * 100 : 0;
  
  let riskAlignmentScore = 20;
  if (userRiskTolerance === 'Low' && highRiskPct > 30) riskAlignmentScore = 5;
  if (userRiskTolerance === 'Medium' && highRiskPct > 70) riskAlignmentScore = 10;
  if (userRiskTolerance === 'High' && highRiskPct < 30) riskAlignmentScore = 10;

  const totalScore = expenseRatioScore + directVsRegularScore + 
                     diversificationScore + riskAlignmentScore;

  const grade = 
    totalScore >= 85 ? 'A' :
    totalScore >= 70 ? 'B' :
    totalScore >= 55 ? 'C' :
    totalScore >= 40 ? 'D' : 'F';

  const gradeColor =
    grade === 'A' ? '#10B981' :
    grade === 'B' ? '#3B82F6' :
    grade === 'C' ? '#F59E0B' :
    grade === 'D' ? '#F97316' : '#EF4444';

  // Generate insights
  const insights: string[] = [];
  
  if (regularPct > 0) {
    insights.push(
      `${regularCount} of your ${analysisResults.length} funds are Regular plans — you're paying distributor commission unnecessarily`
    );
  }
  if (avgExpenseRatio > 1.0) {
    const annualDrain = analysisResults.reduce(
      (sum, r) => sum + r.analysis.regularFund.annualCostRs, 0
    );
    insights.push(
      `Your portfolio's average expense ratio is ${avgExpenseRatio.toFixed(2)}% — costing you ₹${annualDrain.toLocaleString('en-IN')}/year`
    );
  }
  if (categoryCount < 3 && analysisResults.length > 0) {
    insights.push(
      `Your portfolio is concentrated in ${categoryCount} fund category — consider diversifying`
    );
  }
  if (userRiskTolerance === 'Low' && highRiskPct > 30) {
    insights.push(
      `${highRiskPct.toFixed(0)}% of your portfolio is in high-risk equity funds — higher than your risk comfort`
    );
  }
  
  const saving10Y = analysisResults.reduce(
    (sum, r) => sum + r.analysis.savingOver10Y, 0
  );
  if (saving10Y > 0) {
    insights.push(
      `Switching all Regular funds to Direct would save you ₹${saving10Y.toLocaleString('en-IN')} over 10 years`
    );
  }

  const topAction = regularCount > 0
    ? `Switch ${analysisResults.find(r => r.analysis.switchUrgency === 'High')?.regularFund.shortName || 'your highest-fee fund'} to Direct Plan first`
    : avgExpenseRatio > 0.8
    ? 'Consider adding index funds to lower your overall expense ratio'
    : 'Your portfolio is well-optimized. Review annually.';

  return {
    totalScore,
    grade,
    gradeColor,
    components: {
      expenseRatioScore,
      directVsRegularScore,
      diversificationScore,
      riskAlignmentScore,
    },
    insights,
    topAction,
  };
};
