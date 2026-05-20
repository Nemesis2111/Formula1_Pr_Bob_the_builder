/**
 * Safety Intelligence Agent
 * Analyzes telemetry, detects anomalies, calculates risk scores, and generates explainable reasoning
 */

import { v4 as uuidv4 } from 'uuid';

export class SafetyIntelligenceAgent {
  constructor() {
    this.name = 'SafetyIntelligenceAgent';
    this.version = '1.0.0';
  }

  /**
   * Analyze telemetry and assess safety risk
   */
  async analyze(telemetryEvent, context = {}) {
    const startTime = Date.now();
    console.log(`🛡️ Safety Intelligence Agent analyzing event: ${telemetryEvent.event_id}`);

    try {
      // Extract telemetry data
      const { vehicle, track_environment, weather_condition } = telemetryEvent;

      // Detect anomalies
      const anomalies = this.detectAnomalies(vehicle, track_environment, weather_condition);

      // Calculate risk score
      const riskScore = this.calculateRiskScore(anomalies, vehicle);

      // Classify severity
      const severity = this.classifySeverity(riskScore);

      // Generate reasoning trace
      const reasoningTrace = this.generateReasoningTrace(anomalies, vehicle, riskScore);

      // Determine confidence
      const confidence = this.calculateConfidence(anomalies, vehicle);

      const result = {
        success: true,
        agent: this.name,
        event_id: telemetryEvent.event_id,
        analysis: {
          risk_score: riskScore,
          severity,
          confidence_score: confidence,
          anomalies_detected: anomalies,
          reasoning_trace: reasoningTrace,
          recommendation: this.generateRecommendation(riskScore, severity, anomalies),
          requires_immediate_action: riskScore >= 80,
          predictive_factors: this.identifyPredictiveFactors(anomalies, vehicle),
        },
        execution_time_ms: Date.now() - startTime,
      };

      console.log(`✅ Safety Analysis Complete: Risk=${riskScore}, Severity=${severity}`);
      return result;

    } catch (error) {
      console.error(`❌ Safety Intelligence Agent error:`, error);
      return {
        success: false,
        agent: this.name,
        error: error.message,
        execution_time_ms: Date.now() - startTime,
      };
    }
  }

  /**
   * Detect telemetry anomalies
   */
  detectAnomalies(vehicle, track, weather) {
    const anomalies = [];

    // Tire wear anomaly
    if (vehicle.tire_wear_percent > 85) {
      anomalies.push({
        type: 'critical_tire_wear',
        severity: 'critical',
        value: vehicle.tire_wear_percent,
        threshold: 85,
        description: `Tire wear at ${vehicle.tire_wear_percent.toFixed(1)}% exceeds critical threshold`,
      });
    } else if (vehicle.tire_wear_percent > 70) {
      anomalies.push({
        type: 'high_tire_wear',
        severity: 'high',
        value: vehicle.tire_wear_percent,
        threshold: 70,
        description: `Tire wear at ${vehicle.tire_wear_percent.toFixed(1)}% approaching critical levels`,
      });
    }

    // Steering vibration anomaly
    if (vehicle.steering_vibration > 10) {
      anomalies.push({
        type: 'steering_instability',
        severity: 'critical',
        value: vehicle.steering_vibration,
        threshold: 10,
        description: `Steering vibration at ${vehicle.steering_vibration.toFixed(1)} indicates potential structural issue`,
      });
    } else if (vehicle.steering_vibration > 7) {
      anomalies.push({
        type: 'elevated_steering_vibration',
        severity: 'medium',
        value: vehicle.steering_vibration,
        threshold: 7,
        description: `Steering vibration elevated at ${vehicle.steering_vibration.toFixed(1)}`,
      });
    }

    // Engine temperature anomaly
    if (vehicle.engine_temperature > 105) {
      anomalies.push({
        type: 'engine_overheating',
        severity: 'high',
        value: vehicle.engine_temperature,
        threshold: 105,
        description: `Engine temperature at ${vehicle.engine_temperature.toFixed(1)}°C exceeds safe operating range`,
      });
    }

    // Brake temperature anomaly
    if (vehicle.brake_temperature > 850) {
      anomalies.push({
        type: 'brake_overheating',
        severity: 'high',
        value: vehicle.brake_temperature,
        threshold: 850,
        description: `Brake temperature at ${vehicle.brake_temperature.toFixed(0)}°C approaching failure threshold`,
      });
    }

    // Track condition correlation
    if (track.surface_grip_level === 'low' && vehicle.tire_wear_percent > 60) {
      anomalies.push({
        type: 'grip_degradation_correlation',
        severity: 'medium',
        description: 'Low track grip combined with tire wear increases slide risk',
      });
    }

    // Weather correlation
    if (weather.rain_probability > 50 && vehicle.tire_compound === 'soft') {
      anomalies.push({
        type: 'weather_tire_mismatch',
        severity: 'medium',
        description: 'High rain probability with soft compound tires',
      });
    }

    return anomalies;
  }

  /**
   * Calculate overall risk score
   */
  calculateRiskScore(anomalies, vehicle) {
    let riskScore = 0;

    // Base risk from anomalies
    anomalies.forEach(anomaly => {
      switch (anomaly.severity) {
        case 'critical':
          riskScore += 35;
          break;
        case 'high':
          riskScore += 20;
          break;
        case 'medium':
          riskScore += 10;
          break;
        default:
          riskScore += 5;
      }
    });

    // Compound risk factors
    const hasTireIssue = anomalies.some(a => a.type.includes('tire'));
    const hasSteeringIssue = anomalies.some(a => a.type.includes('steering'));
    
    if (hasTireIssue && hasSteeringIssue) {
      riskScore += 15; // Compound risk
    }

    // Speed factor
    if (vehicle.speed_kmh > 300 && riskScore > 50) {
      riskScore += 10; // High speed amplifies risk
    }

    return Math.min(100, Math.round(riskScore));
  }

  /**
   * Classify severity based on risk score
   */
  classifySeverity(riskScore) {
    if (riskScore >= 80) return 'critical';
    if (riskScore >= 60) return 'high';
    if (riskScore >= 40) return 'medium';
    return 'low';
  }

  /**
   * Generate explainable reasoning trace
   */
  generateReasoningTrace(anomalies, vehicle, riskScore) {
    const trace = [];

    trace.push({
      step: 1,
      action: 'telemetry_ingestion',
      description: `Received telemetry for ${vehicle.vehicle_id} (${vehicle.driver_name})`,
      data: {
        tire_wear: vehicle.tire_wear_percent,
        steering_vibration: vehicle.steering_vibration,
        engine_temp: vehicle.engine_temperature,
      },
    });

    trace.push({
      step: 2,
      action: 'anomaly_detection',
      description: `Detected ${anomalies.length} anomalies`,
      anomalies: anomalies.map(a => a.type),
    });

    trace.push({
      step: 3,
      action: 'risk_calculation',
      description: `Calculated risk score: ${riskScore}`,
      factors: anomalies.map(a => ({
        type: a.type,
        severity: a.severity,
        contribution: a.severity === 'critical' ? 35 : a.severity === 'high' ? 20 : 10,
      })),
    });

    trace.push({
      step: 4,
      action: 'severity_classification',
      description: `Classified as ${this.classifySeverity(riskScore)} severity`,
    });

    return trace;
  }

  /**
   * Calculate confidence score
   */
  calculateConfidence(anomalies, vehicle) {
    let confidence = 0.85; // Base confidence

    // More anomalies = higher confidence in assessment
    if (anomalies.length >= 3) {
      confidence += 0.10;
    }

    // Critical anomalies = higher confidence
    const criticalCount = anomalies.filter(a => a.severity === 'critical').length;
    if (criticalCount > 0) {
      confidence += 0.05;
    }

    // Reduce confidence if data seems inconsistent
    if (vehicle.tire_wear_percent > 80 && vehicle.steering_vibration < 5) {
      confidence -= 0.10; // Unexpected pattern
    }

    return Math.min(1.0, Math.max(0.5, parseFloat(confidence.toFixed(2))));
  }

  /**
   * Generate safety recommendation
   */
  generateRecommendation(riskScore, severity, anomalies) {
    if (riskScore >= 80) {
      return {
        action: 'immediate_pit_stop',
        urgency: 'critical',
        reason: 'Multiple critical safety factors detected',
        escalate_to_governance: true,
      };
    }

    if (riskScore >= 60) {
      return {
        action: 'pit_stop_next_window',
        urgency: 'high',
        reason: 'Significant safety concerns require attention',
        escalate_to_governance: true,
      };
    }

    if (riskScore >= 40) {
      return {
        action: 'monitor_closely',
        urgency: 'medium',
        reason: 'Elevated risk factors require monitoring',
        escalate_to_governance: false,
      };
    }

    return {
      action: 'continue_normal_operation',
      urgency: 'low',
      reason: 'No significant safety concerns',
      escalate_to_governance: false,
    };
  }

  /**
   * Identify predictive factors for pre-impact intelligence
   */
  identifyPredictiveFactors(anomalies, vehicle) {
    const factors = [];

    // Tire degradation trajectory
    if (vehicle.tire_wear_percent > 70) {
      const lapsRemaining = Math.floor((100 - vehicle.tire_wear_percent) / 3.5);
      factors.push({
        factor: 'tire_degradation_trajectory',
        prediction: `Tires will reach critical wear in approximately ${lapsRemaining} laps`,
        confidence: 0.85,
      });
    }

    // Steering vibration escalation
    if (vehicle.steering_vibration > 7) {
      factors.push({
        factor: 'steering_vibration_escalation',
        prediction: 'Vibration pattern suggests potential front-left tire structural issue',
        confidence: 0.78,
      });
    }

    // Temperature trend
    if (vehicle.engine_temperature > 100) {
      factors.push({
        factor: 'thermal_stress_accumulation',
        prediction: 'Sustained high temperatures may lead to component failure',
        confidence: 0.72,
      });
    }

    return factors;
  }
}

// Export singleton instance
export const safetyIntelligenceAgent = new SafetyIntelligenceAgent();

// Made with Bob
