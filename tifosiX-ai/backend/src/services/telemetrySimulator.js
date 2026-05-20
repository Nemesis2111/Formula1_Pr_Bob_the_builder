/**
 * Telemetry Simulator Service
 * Generates realistic F1 race telemetry events for testing
 */

import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';

class TelemetrySimulator extends EventEmitter {
  constructor() {
    super();
    this.isRunning = false;
    this.interval = null;
    this.currentLap = 1;
    this.totalLaps = 58;
    
    // Vehicle state
    this.vehicles = [
      {
        vehicle_id: 'FER-16',
        driver_name: 'Charles Leclerc',
        team_name: 'Ferrari',
        car_number: 16,
        tire_compound: 'soft',
        tire_age: 0,
      },
      {
        vehicle_id: 'FER-55',
        driver_name: 'Carlos Sainz',
        team_name: 'Ferrari',
        car_number: 55,
        tire_compound: 'medium',
        tire_age: 0,
      },
    ];
  }

  /**
   * Start telemetry simulation
   */
  start(intervalMs = 5000) {
    if (this.isRunning) {
      console.log('⚠️ Telemetry simulator already running');
      return;
    }

    console.log('🏎️ Starting telemetry simulator...');
    this.isRunning = true;
    
    this.interval = setInterval(() => {
      this.generateTelemetryEvent();
    }, intervalMs);

    // Generate initial event
    this.generateTelemetryEvent();
  }

  /**
   * Stop telemetry simulation
   */
  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isRunning = false;
    console.log('🛑 Telemetry simulator stopped');
  }

  /**
   * Generate a telemetry event
   */
  generateTelemetryEvent() {
    // Randomly select a vehicle
    const vehicle = this.vehicles[Math.floor(Math.random() * this.vehicles.length)];
    
    // Increment lap
    this.currentLap = (this.currentLap % this.totalLaps) + 1;
    vehicle.tire_age++;

    // Generate telemetry data
    const telemetry = this.generateVehicleTelemetry(vehicle);
    
    // Calculate risk score
    const riskAnalysis = this.calculateRiskScore(telemetry);
    
    // Create event
    const event = {
      event_id: uuidv4(),
      event_type: riskAnalysis.event_type,
      timestamp: new Date().toISOString(),
      lap: this.currentLap,
      vehicle: telemetry,
      risk_analysis: riskAnalysis,
      track_environment: this.generateTrackEnvironment(),
      weather_condition: this.generateWeatherCondition(),
    };

    // Emit event
    this.emit('telemetry', event);
    
    console.log(`📡 Telemetry Event: ${vehicle.vehicle_id} | Lap ${this.currentLap} | Risk: ${riskAnalysis.risk_score}`);
    
    return event;
  }

  /**
   * Generate vehicle telemetry
   */
  generateVehicleTelemetry(vehicle) {
    const tireWear = Math.min(100, vehicle.tire_age * 3.5 + Math.random() * 10);
    const isHighWear = tireWear > 75;
    
    return {
      vehicle_id: vehicle.vehicle_id,
      driver_name: vehicle.driver_name,
      team_name: vehicle.team_name,
      car_number: vehicle.car_number,
      speed_kmh: 280 + Math.random() * 40,
      tire_compound: vehicle.tire_compound,
      tire_wear_percent: tireWear,
      tire_age: vehicle.tire_age,
      steering_vibration: isHighWear ? 8 + Math.random() * 6 : 2 + Math.random() * 3,
      engine_temperature: 95 + Math.random() * 15,
      brake_temperature: 650 + Math.random() * 200,
      fuel_level: Math.max(0, 100 - (this.currentLap / this.totalLaps) * 100),
      drs_enabled: Math.random() > 0.7,
      ers_deployment: Math.random() * 100,
    };
  }

  /**
   * Calculate risk score based on telemetry
   */
  calculateRiskScore(telemetry) {
    let riskScore = 0;
    let factors = [];
    let severity = 'low';
    let event_type = 'normal_operation';

    // Tire wear risk
    if (telemetry.tire_wear_percent > 85) {
      riskScore += 40;
      factors.push('critical_tire_wear');
      event_type = 'tire_degradation_critical';
    } else if (telemetry.tire_wear_percent > 70) {
      riskScore += 20;
      factors.push('high_tire_wear');
    }

    // Steering vibration risk
    if (telemetry.steering_vibration > 10) {
      riskScore += 35;
      factors.push('steering_instability');
      event_type = 'steering_vibration_anomaly';
    } else if (telemetry.steering_vibration > 7) {
      riskScore += 15;
      factors.push('elevated_steering_vibration');
    }

    // Engine temperature risk
    if (telemetry.engine_temperature > 105) {
      riskScore += 25;
      factors.push('engine_overheating');
    }

    // Brake temperature risk
    if (telemetry.brake_temperature > 800) {
      riskScore += 20;
      factors.push('brake_overheating');
    }

    // Determine severity
    if (riskScore >= 80) {
      severity = 'critical';
    } else if (riskScore >= 60) {
      severity = 'high';
    } else if (riskScore >= 40) {
      severity = 'medium';
    }

    // Calculate confidence
    const confidence_score = 0.75 + Math.random() * 0.2;

    return {
      risk_score: Math.min(100, riskScore),
      severity,
      event_type,
      risk_factors: factors,
      confidence_score: parseFloat(confidence_score.toFixed(2)),
      recommendation: this.getRecommendation(riskScore, factors),
    };
  }

  /**
   * Get recommendation based on risk
   */
  getRecommendation(riskScore, factors) {
    if (riskScore >= 80) {
      return 'immediate_pit_stop_required';
    } else if (riskScore >= 60) {
      return 'pit_stop_recommended_next_window';
    } else if (riskScore >= 40) {
      return 'monitor_closely';
    }
    return 'continue_normal_operation';
  }

  /**
   * Generate track environment data
   */
  generateTrackEnvironment() {
    return {
      track_environment_id: uuidv4(),
      track_name: 'Monza',
      track_status: 'green',
      track_temperature: 42 + Math.random() * 10,
      surface_grip_level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
      safety_car_probability: Math.random() * 0.3,
      tire_degradation_index: 0.6 + Math.random() * 0.3,
    };
  }

  /**
   * Generate weather condition data
   */
  generateWeatherCondition() {
    return {
      weather_id: uuidv4(),
      weather_name: 'sunny',
      temperature_celsius: 28 + Math.random() * 8,
      humidity_percent: 40 + Math.random() * 30,
      wind_speed_kmh: 10 + Math.random() * 15,
      rain_probability: Math.random() * 20,
      track_visibility: 'excellent',
    };
  }

  /**
   * Generate a critical event manually
   */
  generateCriticalEvent() {
    const vehicle = this.vehicles[0]; // Charles Leclerc
    vehicle.tire_age = 24; // High tire age

    const telemetry = {
      vehicle_id: vehicle.vehicle_id,
      driver_name: vehicle.driver_name,
      team_name: vehicle.team_name,
      car_number: vehicle.car_number,
      speed_kmh: 295,
      tire_compound: 'soft',
      tire_wear_percent: 87,
      tire_age: 24,
      steering_vibration: 12.4,
      engine_temperature: 104.5,
      brake_temperature: 785,
      fuel_level: 45,
      drs_enabled: false,
      ers_deployment: 65,
    };

    const event = {
      event_id: uuidv4(),
      event_type: 'critical_tire_vibration',
      timestamp: new Date().toISOString(),
      lap: this.currentLap,
      vehicle: telemetry,
      risk_analysis: {
        risk_score: 91,
        severity: 'critical',
        event_type: 'front_left_tire_vibration',
        risk_factors: ['critical_tire_wear', 'steering_instability'],
        confidence_score: 0.94,
        recommendation: 'immediate_pit_stop_required',
      },
      track_environment: {
        track_environment_id: uuidv4(),
        track_name: 'Monza',
        track_status: 'green',
        track_temperature: 47,
        surface_grip_level: 'medium_low',
        safety_car_probability: 0.15,
        tire_degradation_index: 0.82,
      },
      weather_condition: this.generateWeatherCondition(),
    };

    this.emit('telemetry', event);
    console.log(`🚨 CRITICAL EVENT GENERATED: ${event.event_id}`);
    
    return event;
  }
}

// Export singleton instance
export const telemetrySimulator = new TelemetrySimulator();

// Made with Bob
