export type GrowthPaceStatus =
  | "Explosive"
  | "Rising Fast"
  | "Steady Growth"
  | "High-Volume Push"
  | "Cooling Down"
  | "Dormant"
  | "Insufficient Data"
  | "No Data"
  | "Early Weak Signal";

export type GrowthPaceDriver =
  | "Viral Spikes"
  | "Consistent Hits"
  | "High Volume"
  | "Engagement Quality"
  | "Audience Growth"
  | "Stable Baseline"
  | "Unknown"
  | "Low Activity"
  | "Possible Slowdown";

export type GrowthPaceResult = {
  status: GrowthPaceStatus;
  driver: GrowthPaceDriver;
  score: number | null;
  confidence: number;
  velocityLift: number | null;
  viralDensity: number | null;
  breakoutDensity: number | null;
  reelsPerWeek: number;
  reasons: string[];
};

export type CreatorReelMetric = {
  id: string;
  views: number;
  likes?: number;
  comments?: number;
  shares?: number;
  saves?: number;
  postedAt: string | Date;
};

export type CreatorGrowthInput = {
  reels: CreatorReelMetric[];
  followersNow?: number;
  followers7dAgo?: number;
  followers30dAgo?: number;
  now?: Date;
};

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function safeDivide(a: number, b: number): number {
  return b === 0 ? 0 : a / b;
}

export function calculateGrowthPace(input: CreatorGrowthInput): GrowthPaceResult {
  const now = input.now || new Date();
  
  // 1. Valid Reels
  const validReels = input.reels
    .filter(r => {
      if (!r.postedAt || r.views <= 0) return false;
      const ageHours = (now.getTime() - new Date(r.postedAt).getTime()) / (1000 * 60 * 60);
      return ageHours >= 6;
    })
    .sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()); // descending by date

  if (validReels.length === 0) {
    return {
      status: "No Data",
      driver: "Unknown",
      score: null,
      confidence: 0,
      velocityLift: null,
      viralDensity: null,
      breakoutDensity: null,
      reelsPerWeek: 0,
      reasons: ["No valid reels found for this creator."]
    };
  }

  const latestReel = validReels[0];
  const daysSinceLastPost = (now.getTime() - new Date(latestReel.postedAt).getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceLastPost > 21) {
    return {
      status: "Dormant",
      driver: "Low Activity",
      score: 20,
      confidence: validReels.length >= 3 ? 0.65 : 0.45,
      velocityLift: null,
      viralDensity: null,
      breakoutDensity: null,
      reelsPerWeek: 0,
      reasons: [`No new reels posted in ${Math.round(daysSinceLastPost)} days.`]
    };
  }

  if (validReels.length < 5) {
    return {
      status: "Insufficient Data",
      driver: "Unknown",
      score: null,
      confidence: clamp(validReels.length / 5, 0, 0.4),
      velocityLift: null,
      viralDensity: null,
      breakoutDensity: null,
      reelsPerWeek: 0,
      reasons: [
        `Only ${validReels.length} valid reels found.`,
        "Need at least 5 mature reels to calculate reliable growth pace."
      ]
    };
  }

  // 2. Baseline
  let matureReels = validReels.filter(r => {
    const ageHours = (now.getTime() - new Date(r.postedAt).getTime()) / (1000 * 60 * 60);
    return ageHours >= 72;
  });
  if (matureReels.length < 3) matureReels = validReels;

  const baselineViews = median(matureReels.map(r => r.views));

  // 3. Lifts & Categories
  const reelsWithLift = validReels.map(r => {
    const lift = safeDivide(r.views, baselineViews);
    return { ...r, lift };
  });

  // 4. Recent window
  let recentReels = reelsWithLift.filter(r => {
    const ageDays = (now.getTime() - new Date(r.postedAt).getTime()) / (1000 * 60 * 60 * 24);
    return ageDays <= 14;
  });
  if (recentReels.length < 3) {
    recentReels = reelsWithLift.slice(0, 10);
  }

  const recentMedianViews = median(recentReels.map(r => r.views));
  const velocityLift = safeDivide(recentMedianViews, baselineViews);

  if (validReels.length < 10 && velocityLift < 0.75) {
    return {
      status: "Early Weak Signal",
      driver: "Possible Slowdown",
      score: Math.round(50 + 25 * Math.log2(Math.max(velocityLift, 0.1))), // Rough estimation
      confidence: 0.45,
      velocityLift,
      viralDensity: null,
      breakoutDensity: null,
      reelsPerWeek: 0,
      reasons: [
        "Recent reels are below baseline, but data volume is still low.",
        "More reels are needed before confirming a slowdown."
      ]
    };
  }

  // 5. Viral Density
  const viralReelsCount = recentReels.filter(r => r.lift >= 2.0).length;
  const breakoutReelsCount = recentReels.filter(r => r.lift >= 5.0).length;
  const viralDensity = safeDivide(viralReelsCount, recentReels.length);
  const breakoutDensity = safeDivide(breakoutReelsCount, recentReels.length);

  // 6. Posting Frequency
  const reelsLast30Days = validReels.filter(r => {
    const ageDays = (now.getTime() - new Date(r.postedAt).getTime()) / (1000 * 60 * 60 * 24);
    return ageDays <= 30;
  }).length;
  const reelsPerWeek = safeDivide(reelsLast30Days, 4.285);

  // 7. Engagement Quality
  function calcEngagement(r: CreatorReelMetric) {
    const likes = r.likes || 0;
    const comments = r.comments || 0;
    const shares = r.shares || 0;
    const saves = r.saves || 0;
    
    if (r.shares !== undefined && r.saves !== undefined) {
      return safeDivide((likes + comments * 2 + saves * 3 + shares * 4), r.views) * 100;
    }
    return safeDivide((likes + comments * 2), r.views) * 100;
  }

  const recentEngagements = recentReels.map(calcEngagement);
  const matureEngagements = matureReels.map(calcEngagement);
  
  const recentMedianEngagementRate = median(recentEngagements);
  const baselineMedianEngagementRate = median(matureEngagements);
  
  const engagementLift = safeDivide(recentMedianEngagementRate, baselineMedianEngagementRate);

  // 8. Scores
  const safeVelocityLift = Math.max(velocityLift, 0.1);
  const velocityScore = clamp(50 + 25 * Math.log2(safeVelocityLift), 0, 100);
  const viralScore = clamp(viralDensity * 80 + breakoutDensity * 40, 0, 100);
  
  const consistencyCount = recentReels.filter(r => r.lift >= 0.8).length;
  const consistencyScore = safeDivide(consistencyCount, recentReels.length) * 100;

  let frequencyHealthScore = 55;
  if (reelsPerWeek === 0) frequencyHealthScore = 0;
  else if (reelsPerWeek < 1) frequencyHealthScore = 30;
  else if (reelsPerWeek <= 3) frequencyHealthScore = 65;
  else if (reelsPerWeek <= 7) frequencyHealthScore = 90;
  else if (reelsPerWeek <= 14) frequencyHealthScore = 75;
  else frequencyHealthScore = 55;

  if (reelsPerWeek > 7 && velocityLift < 0.8) {
    frequencyHealthScore = Math.min(frequencyHealthScore, 45);
  }

  const safeEngagementLift = Math.max(engagementLift, 0.1);
  const engagementScore = clamp(50 + 25 * Math.log2(safeEngagementLift), 0, 100);

  let score = 0;
  const hasFollowerHistory = input.followers30dAgo !== undefined && input.followersNow !== undefined;
  
  let followerGrowth30d = 0;
  if (hasFollowerHistory && input.followers30dAgo && input.followers30dAgo > 0) {
    followerGrowth30d = ((input.followersNow! - input.followers30dAgo) / input.followers30dAgo) * 100;
    const followerGrowthScore = clamp(50 + followerGrowth30d * 5, 0, 100);
    
    score =
      velocityScore * 0.30 +
      viralScore * 0.20 +
      consistencyScore * 0.15 +
      followerGrowthScore * 0.15 +
      engagementScore * 0.10 +
      frequencyHealthScore * 0.10;
  } else {
    score =
      velocityScore * 0.40 +
      viralScore * 0.25 +
      consistencyScore * 0.15 +
      engagementScore * 0.10 +
      frequencyHealthScore * 0.10;
  }

  // 9. Confidence
  const dataVolumeScore = clamp(validReels.length / 20, 0, 1);
  const recencyScore = daysSinceLastPost <= 3 ? 1 : daysSinceLastPost <= 7 ? 0.8 : daysSinceLastPost <= 14 ? 0.5 : 0.2;
  const snapshotScore = hasFollowerHistory ? 1 : input.followers7dAgo !== undefined ? 0.6 : 0.2;
  
  const hasRichMetrics = validReels.some(r => r.shares !== undefined && r.saves !== undefined);
  const metricRichnessScore = hasRichMetrics ? 1 : 0.6;
  
  const confidence = clamp(
    dataVolumeScore * 0.35 +
    recencyScore * 0.25 +
    snapshotScore * 0.25 +
    metricRichnessScore * 0.15,
    0, 1
  );

  // 10. Status and Driver logic
  let status: GrowthPaceStatus;
  let driver: GrowthPaceDriver;

  if (confidence < 0.45) {
    status = "Insufficient Data";
  } else if (daysSinceLastPost > 21) {
    status = "Dormant";
  } else if (score >= 82 && velocityLift >= 2.5 && viralDensity >= 0.35) {
    status = "Explosive";
  } else if (score >= 68 && velocityLift >= 1.5) {
    status = "Rising Fast";
  } else if (reelsPerWeek >= 7 && velocityLift >= 0.8) {
    status = "High-Volume Push";
  } else if (score >= 45) {
    status = "Steady Growth";
  } else {
    status = "Cooling Down";
  }

  if (viralDensity >= 0.35) {
    driver = "Viral Spikes";
  } else if (consistencyScore >= 75 && velocityLift >= 1.1) {
    driver = "Consistent Hits";
  } else if (reelsPerWeek >= 7) {
    driver = "High Volume";
  } else if (engagementLift >= 1.5) {
    driver = "Engagement Quality";
  } else if (followerGrowth30d >= 5) {
    driver = "Audience Growth";
  } else {
    driver = "Stable Baseline";
  }

  // 11. Reasons Generation
  const reasons: string[] = [];
  
  if (viralReelsCount > 0) {
    reasons.push(`${viralReelsCount} of last ${recentReels.length} reels are above 2x normal views`);
  }
  
  if (velocityLift !== null && !isNaN(velocityLift)) {
    if (velocityLift > 1.2) {
      reasons.push(`Recent median views are ${velocityLift.toFixed(1)}x higher than baseline`);
    } else if (velocityLift < 0.8) {
      reasons.push(`Recent median views are ${Math.round((1 - velocityLift) * 100)}% below baseline`);
    }
  }
  
  reasons.push(`Posting ${reelsPerWeek.toFixed(1)} reels/week`);
  
  if (engagementLift !== null && !isNaN(engagementLift)) {
    if (engagementLift > 1.1) {
      reasons.push(`Engagement per view is ${Math.round((engagementLift - 1) * 100)}% above normal`);
    } else if (engagementLift < 0.9) {
      reasons.push(`Engagement per view is ${Math.round((1 - engagementLift) * 100)}% below normal`);
    }
  }

  return {
    status,
    driver,
    score: Math.round(score),
    confidence,
    velocityLift,
    viralDensity,
    breakoutDensity,
    reelsPerWeek,
    reasons
  };
}
