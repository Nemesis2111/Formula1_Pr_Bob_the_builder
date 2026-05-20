/**
 * Strategy Recommendation Agent
 * Recommends pit windows, tire compounds, and estimates residual risk
 */

import { v4 as uuidv4 } from 'uuid';

export class StrategyRecommendationAgent {
  constructor() {
    this.name = 'StrategyRecommendationAgent';
    this.version = '1.0.0';
    
    // Tire compound characteristics
    this.tireCompounds = {
      soft: { grip: 'high', durability: 'low', optimal_laps: 15 },
      medium: { grip: 'medium', durability: 'medium', optimal_laps: 25 },
      hard: { grip: 'low', durability: 'high', optimal_laps: 35 },
    };
  }

  /**
   * Generate race strategy recommendation
   */
  async recommend(safetyAnalysis, telemetryEvent, context = {}) {
    const startTime = Date.now();
    console.log(`🎯 Strategy Recommendation Agent processing event: ${telemetryEvent.event_id}`);

    try {
      const { vehicle, track_environment, weather_condition } = telemetryEvent;
      const { risk_score, severity, anomalies_detected } = safetyAnalysis.analysis;

      // Determine pit window
      const pitWindow = this.calculatePitWindow(
        telemetryEvent.lap,
        vehicle,
        risk_score,
        track_environment
      );

      // Recommend tire compound
      const tireRecommendation = this.recommendTireCompound(
        vehicle,
        weather_condition,
        track_environment,
        telemetryEvent.lap
      );

      // Calculate residual risk
      const residualRisk = this.calculateResidualRisk(
        risk_score,
        pitWindow,
        tireRecommendation
      );

      // Simulate strategy outcomes
      const strategySimulation = this.simulateStrategyOutcomes(
        vehicle,
        pitWindow,
        tireRecommendation,
        telemetryEvent.lap
      );

      // Generate reasoning
      const reasoning = this.generateStrategyReasoning(
        vehicle,
        risk_score,
        pitWindow,
        tireRecommendation,
        anomalies_detected
      );

      const result = {
        success: true,
        agent: this.name,
        strategy_id: uuidv4(),
        event_id: telemetryEvent.event_id,
        recommendation: {
          pit_window: pitWindow,
          tire_compound: tireRecommendation,
          residual_risk: residualRisk,
          strategy_confidence: this.calculateStrategyConfidence(risk_score, vehicle),
          expected_outcome: strategySimulation.expected_outcome,
          alternative_strategies: strategySimulation.alternatives,
          reasoning,
        },
        execution_time_ms: Date.now() - startTime,
      };

      console.log(`✅ Strategy Recommendation: ${pitWindow.action} | Tire: ${tireRecommendation.compound}`);
      return result;

    } catch (error) {
      console.error(`❌ Strategy Recommendation Agent error:`, error);
      return {
        success: false,
        agent: this.name,
        error: error.message,
        execution_time_ms: Date.now() - startTime,
      };
    }
  }

  /**
   * Calculate optimal pit window
   */
  calculatePitWindow(currentLap, vehicle, riskScore, track) {
    let action = 'continue';
    let recommendedLap = null;
    let urgency = 'low';
    let reason = '';

    if (riskScore >= 80) {
      action = 'immediate_pit_stop';
      recommendedLap = currentLap;
      urgency = 'critical';
      reason = 'Critical safety factors require immediate pit stop';
    } else if (riskScore >= 60) {
      action = 'pit_next_window';
      recommendedLap = currentLap + Math.floor(Math.random() * 2) + 1;
      urgency = 'high';
      reason = 'High risk factors recommend pit stop within next 2 laps';
    } else if (vehicle.tire_wear_percent > 75) {
      action = 'pit_next_window';
      recommendedLap = currentLap + Math.floor(Math.random() * 3) + 2;
      urgency = 'medium';
      reason = 'Tire wear approaching critical threshold';
    } else {
      action = 'continue';
      const remainingOptimalLaps = this.calculateRemainingOptimalLaps(vehicle);
      recommendedLap = currentLap + remainingOptimalLaps;
      urgency = 'low';
      reason = 'Current tire condition allows continued running';
    }

    return {
      action,
      recommended_lap: recommendedLap,
      current_lap: currentLap,
      urgency,
      reason,
      window_flexibility: urgency === 'critical' ? 0 : urgency === 'high' ? 1 : 3,
    };
  }

  /**
   * Calculate remaining optimal laps for current tires
   */
  calculateRemainingOptimalLaps(vehicle) {
    const compound = this.tireCompounds[vehicle.tire_compound] || this.tireCompounds.medium;
    const wearRate = 100 / compound.optimal_laps;
    const remainingWear = 100 - vehicle.tire_wear_percent;
    return Math.max(0, Math.floor(remainingWear / wearRate));
  }

  /**
   * Recommend tire compound
   */
  recommendTireCompound(vehicle, weather, track, currentLap) {
    let compound = 'medium';
    let reason = '';
    let confidence = 0.85;

    // Weather considerations
    if (weather.rain_probability > 50) {
      compound = 'intermediate';
      reason = 'High rain probability requires wet weather tires';
      confidence = 0.90;
    } else if (weather.rain_probability > 30) {
      compound = 'medium';
      reason = 'Uncertain weather conditions favor medium compound flexibility';
      confidence = 0.75;
    }
    // Track temperature considerations
    else if (track.track_temperature > 45) {
      compound = 'hard';
      reason = 'High track temperature requires durable hard compound';
      confidence = 0.88;
    } else if (track.track_temperature < 35) {
      compound = 'soft';
      reason = 'Lower track temperature allows soft compound performance';
      confidence = 0.82;
    }
    // Race phase considerations
    else if (currentLap < 20) {
      compound = 'soft';
      reason = 'Early race phase allows aggressive soft compound strategy';
      confidence = 0.80;
    } else if (currentLap > 40) {
      compound = 'hard';
      reason = 'Late race phase requires durable compound to finish';
      confidence = 0.85;
    } else {
      compound = 'medium';
      reason = 'Mid-race phase favors balanced medium compound';
      confidence = 0.85;
    }

    return {
      compound,
      reason,
      confidence,
      expected_laps: this.tireCompounds[compound]?.optimal_laps || 25,
      characteristics: this.tireCompounds[compound] || this.tireCompounds.medium,
    };
  }

  /**
   * Calculate residual risk after strategy execution
   */
  calculateResidualRisk(currentRisk, pitWindow, tireRecommendation) {
    let residualRisk = currentRisk;

    // Pit stop reduces risk
    if (pitWindow.action === 'immediate_pit_stop') {
      residualRisk = Math.max(10, currentRisk * 0.15);
    } else if (pitWindow.action === 'pit_next_window') {
      residualRisk = Math.max(20, currentRisk * 0.35);
    }

    // Tire compound affects residual risk
    if (tireRecommendation.compound === 'hard') {
      residualRisk *= 0.9; // Hard tires reduce long-term risk
    } else if (tireRecommendation.compound === 'soft') {
      residualRisk *= 1.1; // Soft tires increase future risk
    }

    return {
      risk_score: Math.round(residualRisk),
      level: residualRisk < 30 ? 'low' : residualRisk < 60 ? 'moderate' : 'high',
      description: this.getResidualRiskDescription(residualRisk),
    };
  }

  /**
   * Get residual risk description
   */
  getResidualRiskDescription(riskScore) {
    if (riskScore < 30) {
      return 'Strategy effectively mitigates safety concerns';
    } else if (riskScore < 60) {
      return 'Strategy reduces risk but continued monitoring required';
    } else {
      return 'Elevated risk remains despite strategy intervention';
    }
  }

  /**
   * Simulate strategy outcomes
   */
  simulateStrategyOutcomes(vehicle, pitWindow, tireRecommendation, currentLap) {
    const expectedOutcome = {
      time_loss_seconds: pitWindow.action === 'immediate_pit_stop' ? 22 : 
                         pitWindow.action === 'pit_next_window' ? 23 : 0,
      position_change: pitWindow.action.includes('pit') ? -1 : 0,
      tire_life_remaining: tireRecommendation.expected_laps,
      race_pace_impact: this.calculatePaceImpact(tireRecommendation.compound),
      overtaking_probability: this.calculateOvertakingProbability(tireRecommendation.compound),
    };

    const alternatives = [
      {
        strategy: 'extend_current_stint',
        description: 'Continue on current tires for 5 more laps',
        risk_delta: +25,
        time_delta: -10,
        confidence: 0.65,
      },
      {
        strategy: 'alternative_compound',
        description: `Use ${tireRecommendation.compound === 'soft' ? 'medium' : 'soft'} compound instead`,
        risk_delta: +5,
        time_delta: +2,
        confidence: 0.75,
      },
    ];

    return {
      expectedOutcome,
      alternatives,
    };
  }

  /**
   * Calculate pace impact of tire compound
   */
  calculatePaceImpact(compound) {
    const impacts = {
      soft: '+0.3s per lap (high grip)',
      medium: 'baseline pace',
      hard: '-0.2s per lap (lower grip)',
      intermediate: '-0.5s per lap (wet conditions)',
    };
    return impacts[compound] || 'unknown';
  }

  /**
   * Calculate overtaking probability
   */
  calculateOvertakingProbability(compound) {
    const probabilities = {
      soft: 0.75,
      medium: 0.60,
      hard: 0.45,
      intermediate: 0.50,
    };
    return probabilities[compound] || 0.60;
  }

  /**
   * Calculate strategy confidence
   */
  calculateStrategyConfidence(riskScore, vehicle) {
    let confidence = 0.85;

    // Higher risk = more confident in pit recommendation
    if (riskScore >= 80) {
      confidence = 0.95;
    } else if (riskScore >= 60) {
      confidence = 0.88;
    }

    // Tire age affects confidence
    if (vehicle.tire_age > 20) {
      confidence += 0.05;
    }

    return Math.min(1.0, parseFloat(confidence.toFixed(2)));
  }

  /**
   * Generate strategy reasoning
   */
  generateStrategyReasoning(vehicle, riskScore, pitWindow, tireRec, anomalies) {
    const reasoning = [];

    reasoning.push({
      factor: 'safety_assessment',
      description: `Risk score of ${riskScore} indicates ${riskScore >= 80 ? 'critical' : riskScore >= 60 ? 'high' : 'moderate'} safety concern`,
      weight: 0.40,
    });

    reasoning.push({
      factor: 'tire_condition',
      description: `Current tire wear at ${vehicle.tire_wear_percent.toFixed(1)}% with ${vehicle.tire_age} laps completed`,
      weight: 0.30,
    });

    reasoning.push({
      factor: 'pit_window_optimization',
      description: `${pitWindow.action} recommended for lap ${pitWindow.recommended_lap}`,
      weight: 0.20,
    });

    reasoning.push({
      factor: 'compound_selection',
      description: `${tireRec.compound} compound selected: ${tireRec.reason}`,
      weight: 0.10,
    });

    return reasoning;
  }
}

// Export singleton instance
export const strategyRecommendationAgent = new StrategyRecommendationAgent();

// Made with Bob
