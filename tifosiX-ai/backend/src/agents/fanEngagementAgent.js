/**
 * Fan Engagement Agent
 * Generates multilingual fan narratives, emotional storytelling,
 * notification variety, and telemetry-safe fan content.
 */

import { v4 as uuidv4 } from 'uuid';
import { auditLogger } from '../services/auditLogger.js';

export class FanEngagementAgent {
  constructor() {
    this.name = 'FanEngagementAgent';
    this.version = '1.1.0';

    this.templates = {
      en: {
        critical_pit: [
          {
            tone: 'urgent',
            title: '🚨 Urgent Pit Stop',
            content:
              '🏁 {driver} is being called into the pits for an urgent stop after the team detected elevated tire stress. The crew is ready to switch strategy and protect track position.'
          },
          {
            tone: 'dramatic',
            title: '🔥 Race Momentum Shift',
            content:
              'A crucial moment is unfolding for {driver}. Ferrari is reacting quickly with a defensive stop to reduce risk and reset the race plan.'
          },
          {
            tone: 'broadcast',
            title: '📡 Live Race Update',
            content:
              'The pit wall has made a decisive call for {driver}. The team is preparing a fast stop to stabilize the next stint and keep the race under control.'
          },
          {
            tone: 'fan-friendly',
            title: '🏎️ What This Means',
            content:
              '{driver} is heading into a key strategy phase. The stop is designed to manage tire stress, protect performance, and give the team a stronger platform for the next stint.'
          }
        ],

        strategy_change: [
          {
            tone: 'strategic',
            title: '🎯 Strategy Update',
            content:
              'Strategy update for {driver}: The team is adjusting the race plan to optimize tire management and maintain competitive pace.'
          },
          {
            tone: 'analytical',
            title: '📊 Pit Wall Analysis',
            content:
                    '{team} is shifting the strategy window for {driver}, balancing race pace, tire life, and track position as conditions evolve.'
          },
          {
            tone: 'confident',
            title: '♟️ Tactical Move',
            content:
              'The engineers are making a tactical adjustment for {driver}. This move is aimed at creating a cleaner and more stable race phase.'
          }
        ],

        normal_pit: [
          {
            tone: 'informative',
            title: '🔧 Pit Stop',
            content:
              '{driver} makes a routine pit stop. The team executes a clean tire change to keep the race on track.'
          },
          {
            tone: 'calm',
            title: '✅ Clean Stop',
            content:
              'A smooth stop for {driver}. The team keeps the race plan steady and focuses on consistent pace for the next stint.'
          }
        ],

        tire_management: [
          {
            tone: 'analytical',
            title: '🏎️ Tire Management',
            content:
              '{driver} is managing tire wear carefully as the team monitors performance data to determine the optimal pit window.'
          },
          {
            tone: 'technical',
            title: '🧠 Race Control Insight',
            content:
              'The team is watching tire behavior closely for {driver}. The focus is on keeping performance stable without exposing sensitive race data.'
          },
          {
            tone: 'fan-friendly',
            title: '📣 Fan Insight',
            content:
              '{driver} is in a tire management phase. It may look calm on track, but the pit wall is actively reading the race and preparing options.'
          }
        ]
      },

      es: {
        critical_pit: [
          {
            tone: 'urgent',
            title: '🚨 Parada Urgente',
            content:
              '🏁 {driver} es llamado a boxes para una parada urgente después de que el equipo detectara estrés elevado en los neumáticos. El equipo está listo para cambiar la estrategia y proteger la posición en pista.'
          },
          {
            tone: 'dramatic',
            title: '🔥 Cambio Clave en la Carrera',
            content:
              'Un momento crucial se desarrolla para {driver}. {team} reacciona rápidamente con una parada defensiva para reducir el riesgo y reajustar la estrategia.'
          },
          {
            tone: 'broadcast',
            title: '📡 Actualización en Vivo',
            content:
              'El muro de boxes toma una decisión importante para {driver}. El equipo prepara una parada rápida para estabilizar el próximo stint.'
          },
          {
            tone: 'fan-friendly',
            title: '🏎️ Qué Significa Esto',
            content:
              '{driver} entra en una fase estratégica clave. La parada busca controlar el desgaste, proteger el rendimiento y reforzar la siguiente parte de la carrera.'
          }
        ],

        strategy_change: [
          {
            tone: 'strategic',
            title: '🎯 Actualización de Estrategia',
            content:
              'Actualización de estrategia para {driver}: El equipo ajusta el plan de carrera para optimizar la gestión de neumáticos y mantener el ritmo competitivo.'
          },
          {
            tone: 'analytical',
            title: '📊 Análisis del Muro',
            content:
              '{team} ajusta la ventana estratégica para {driver}, equilibrando ritmo, vida de neumáticos y posición en pista.'
          },
          {
            tone: 'confident',
            title: '♟️ Movimiento Táctico',
            content:
              'Los ingenieros realizan un ajuste táctico para {driver}, buscando una fase de carrera más estable y controlada.'
          }
        ],

        normal_pit: [
          {
            tone: 'informative',
            title: '🔧 Parada en Boxes',
            content:
              '{driver} realiza una parada rutinaria en boxes. El equipo ejecuta un cambio limpio para mantener la carrera bajo control.'
          },
          {
            tone: 'calm',
            title: '✅ Parada Limpia',
            content:
              'Parada fluida para {driver}. El equipo mantiene el plan de carrera y busca ritmo constante en el siguiente stint.'
          }
        ],

        tire_management: [
          {
            tone: 'analytical',
            title: '🏎️ Gestión de Neumáticos',
            content:
              '{driver} está gestionando cuidadosamente el desgaste mientras el equipo evalúa el mejor momento para parar.'
          },
          {
            tone: 'technical',
            title: '🧠 Inteligencia de Carrera',
            content:
              'El equipo sigue de cerca el comportamiento de los neumáticos de {driver}, manteniendo estabilidad sin revelar datos sensibles.'
          },
          {
            tone: 'fan-friendly',
            title: '📣 Insight para Fans',
            content:
              '{driver} está en una fase de gestión. Puede parecer tranquilo en pista, pero el muro de boxes ya prepara opciones.'
          }
        ]
      },

      it: {
        critical_pit: [
          {
            tone: 'urgent',
            title: '🚨 Sosta Urgente',
            content:
              '🏁 {driver} viene richiamato ai box per una sosta urgente dopo che il team ha rilevato stress elevato sugli pneumatici. La squadra è pronta a cambiare strategia e proteggere la posizione in pista.'
          },
          {
            tone: 'dramatic',
            title: '🔥 Momento Decisivo',
            content:
              'Un momento cruciale per {driver}. {team} reagisce rapidamente con una sosta difensiva per ridurre il rischio e riprogrammare la gara.'
          },
          {
            tone: 'broadcast',
            title: '📡 Aggiornamento Live',
            content:
              'Il muretto prende una decisione importante per {driver}. Il team prepara una sosta rapida per stabilizzare il prossimo stint.'
          },
          {
            tone: 'fan-friendly',
            title: '🏎️ Cosa Significa',
            content:
              '{driver} entra in una fase strategica chiave. La sosta serve a gestire lo stress gomme, proteggere il passo e rafforzare il prossimo stint.'
          }
        ],

        strategy_change: [
          {
            tone: 'strategic',
            title: '🎯 Aggiornamento Strategia',
            content:
              'Aggiornamento strategia per {driver}: Il team sta regolando il piano gara per ottimizzare la gestione gomme e mantenere il ritmo competitivo.'
          },
          {
            tone: 'analytical',
            title: '📊 Analisi dal Muretto',
            content:
              '{team} modifica la finestra strategica per {driver}, bilanciando passo gara, vita gomme e posizione in pista.'
          },
          {
            tone: 'confident',
            title: '♟️ Mossa Tattica',
            content:
              'Gli ingegneri stanno effettuando un aggiustamento tattico per {driver}, puntando a una fase di gara più stabile.'
          }
        ],

        normal_pit: [
          {
            tone: 'informative',
            title: '🔧 Pit Stop',
            content:
              '{driver} effettua una sosta di routine ai box. Il team completa un cambio gomme pulito per mantenere la gara in carreggiata.'
          },
          {
            tone: 'calm',
            title: '✅ Sosta Pulita',
            content:
              'Sosta fluida per {driver}. Il team mantiene il piano gara e punta a ritmo costante nel prossimo stint.'
          }
        ],

        tire_management: [
          {
            tone: 'analytical',
            title: '🏎️ Gestione Gomme',
            content:
              '{driver} sta gestendo attentamente l’usura degli pneumatici mentre il team valuta la finestra ottimale di sosta.'
          },
          {
            tone: 'technical',
            title: '🧠 Insight Race Control',
            content:
              'Il team osserva il comportamento gomme di {driver}, mantenendo stabilità senza rivelare dati sensibili.'
          },
          {
            tone: 'fan-friendly',
            title: '📣 Insight per i Fan',
            content:
              '{driver} è in una fase di gestione. In pista sembra calma, ma il muretto sta già preparando le opzioni.'
          }
        ]
      },

      hi: {
  critical_pit: [
    {
      tone: 'urgent',
      title: '🚨 आपातकालीन पिट स्टॉप',
      content:
        '🏁 {driver} को टायर पर बढ़ते दबाव के कारण तुरंत पिट में बुलाया गया है। टीम रणनीति बदलकर रेस पोजिशन सुरक्षित रखने की कोशिश कर रही है।'
    },
    {
      tone: 'dramatic',
      title: '🔥 रेस में बड़ा मोड़',
      content:
        '{driver} के लिए यह रेस का अहम पल है। फेरारी तेजी से रणनीति बदलकर जोखिम कम करने की कोशिश कर रही है।'
    },
    {
      tone: 'broadcast',
      title: '📡 लाइव रेस अपडेट',
      content:
        'पिट वॉल ने {driver} के लिए महत्वपूर्ण निर्णय लिया है। टीम अगले स्टिंट को स्थिर रखने के लिए तेज पिट स्टॉप की तैयारी कर रही है।'
    },
    {
      tone: 'fan-friendly',
      title: '🏎️ इसका क्या मतलब है',
      content:
        '{driver} अब रेस की महत्वपूर्ण रणनीतिक स्थिति में प्रवेश कर चुके हैं। यह स्टॉप प्रदर्शन और टायर प्रबंधन के लिए जरूरी है।'
    }
  ],

  strategy_change: [
    {
      tone: 'strategic',
      title: '🎯 रणनीति अपडेट',
      content:
        '{driver} के लिए फेरारी अपनी रणनीति बदल रही है ताकि टायर लाइफ और रेस गति को संतुलित रखा जा सके।'
    },
    {
      tone: 'analytical',
      title: '📊 पिट वॉल विश्लेषण',
      content:
        'फेरारी {driver} के लिए रेस गति, टायर स्थिति और ट्रैक पोजिशन के बीच संतुलन बनाने की कोशिश कर रही है।'
    },
    {
      tone: 'confident',
      title: '♟️ रणनीतिक कदम',
      content:
        'इंजीनियर्स ने {driver} के लिए महत्वपूर्ण रणनीतिक बदलाव किया है जिससे अगला स्टिंट अधिक स्थिर हो सके।'
    }
  ],

  normal_pit: [
    {
      tone: 'informative',
      title: '🔧 नियमित पिट स्टॉप',
      content:
        '{driver} ने सामान्य पिट स्टॉप किया है। टीम ने तेज और साफ टायर बदलाव पूरा किया।'
    },
    {
      tone: 'calm',
      title: '✅ साफ पिट स्टॉप',
      content:
        '{driver} के लिए यह एक शांत और नियंत्रित पिट स्टॉप रहा। टीम अब अगले स्टिंट पर ध्यान दे रही है।'
    }
  ],

  tire_management: [
    {
      tone: 'analytical',
      title: '🏎️ टायर प्रबंधन',
      content:
        '{driver} फिलहाल टायर मैनेजमेंट फेज में हैं जबकि टीम सर्वश्रेष्ठ पिट विंडो का विश्लेषण कर रही है।'
    },
    {
      tone: 'technical',
      title: '🧠 रेस कंट्रोल इनसाइट',
      content:
        'टीम {driver} के टायर व्यवहार को ध्यान से मॉनिटर कर रही है ताकि प्रदर्शन स्थिर रखा जा सके।'
    },
    {
      tone: 'fan-friendly',
      title: '📣 फैन अपडेट',
      content:
        '{driver} फिलहाल नियंत्रित रेस चरण में हैं। ट्रैक पर सब शांत दिख सकता है, लेकिन पिट वॉल लगातार रणनीति बना रही है।'
    }
  ]
},
    };
  }

  async generateMessage(safetyAnalysis, strategyRecommendation, governanceResult, telemetryEvent, context = {}) {
    const startTime = Date.now();
    console.log(`📢 Fan Engagement Agent generating message`);

    try {
      const { approval_record } = governanceResult;

      if (approval_record.blocked || approval_record.approval_status !== 'approved') {
        console.log(`🚫 Message generation blocked - awaiting approval`);
        return {
          success: false,
          agent: this.name,
          blocked: true,
          reason: 'Message generation blocked pending governance approval',
          execution_time_ms: Date.now() - startTime
        };
      }

      const { vehicle } = telemetryEvent;
      const { risk_score, severity } = safetyAnalysis.analysis;
      const { recommendation } = strategyRecommendation;

      const messageType = this.determineMessageType(risk_score, severity, recommendation);

      const messages = this.generateMultilingualMessages(
        messageType,
        vehicle,
        recommendation,
        context.languages || ['en', 'es', 'it', 'hi']
      );

      const validatedMessages = this.validateMessages(messages);

      const messageRecords = validatedMessages.map(msg => ({
        message_id: uuidv4(),
        event_id: telemetryEvent.event_id,
        strategy_id: strategyRecommendation.strategy_id,
        language: msg.language,
        message_title: msg.title,
        message_content: msg.content,
        message_type: messageType,
        priority_level: this.determinePriority(severity),
        delivery_status: 'draft',
        contains_telemetry: msg.contains_telemetry,
        emotional_tone: msg.emotional_tone,
        created_at: new Date().toISOString()
      }));

      messageRecords.forEach(record => {
        auditLogger.logFanMessage(record);
      });

      const result = {
        success: true,
        agent: this.name,
        messages: messageRecords,
        personalization_applied: this.getPersonalizationFeatures(),
        safety_validation: {
          telemetry_removed: true,
          governance_approved: true,
          fan_safe: true
        },
        execution_time_ms: Date.now() - startTime
      };

      console.log(`✅ Fan messages generated: ${messageRecords.length} languages`);
      return result;
    } catch (error) {
      console.error(`❌ Fan Engagement Agent error:`, error);
      return {
        success: false,
        agent: this.name,
        error: error.message,
        execution_time_ms: Date.now() - startTime
      };
    }
  }

  determineMessageType(riskScore, severity, recommendation) {
    const action = recommendation?.pit_window?.action;

    if (riskScore >= 80 || severity === 'critical') {
      return 'critical_pit';
    }

    if (action === 'pit_next_window') {
      return 'strategy_change';
    }

    if (action === 'immediate_pit_stop') {
      return 'critical_pit';
    }

    if (riskScore >= 40) {
      return 'tire_management';
    }

    return 'normal_pit';
  }

  generateMultilingualMessages(messageType, vehicle, recommendation, languages) {
    return languages.map((lang, index) => {
      const templatePool =
        this.templates[lang]?.[messageType] ||
        this.templates.en[messageType] ||
        this.templates.en.normal_pit;

      const template = this.pickTemplate(templatePool, vehicle, recommendation, index);

      const content = template.content
  .replace('{driver}', vehicle.driver_name)
  .replace('{team}', vehicle.team_name);

      return {
        language: lang,
        title: this.decorateTitle(template.title, vehicle.driver_name),
        content: this.enhanceWithEmotionalStorytelling(
          content,
          messageType,
          vehicle,
          recommendation,
          template.tone
        ),
        emotional_tone: template.tone,
        contains_telemetry: false
      };
    });
  }

  pickTemplate(templatePool, vehicle, recommendation, index = 0) {
    const seedSource = `${vehicle?.vehicle_id || ''}-${recommendation?.strategy_id || ''}-${Date.now()}-${index}`;
    let hash = 0;

    for (let i = 0; i < seedSource.length; i++) {
      hash = (hash << 5) - hash + seedSource.charCodeAt(i);
      hash |= 0;
    }

    const selectedIndex = Math.abs(hash) % templatePool.length;
    return templatePool[selectedIndex];
  }

  decorateTitle(title, driverName) {
    if (title.includes(driverName)) {
      return title;
    }

    return `${title}: ${driverName}`;
  }

  enhanceWithEmotionalStorytelling(content, messageType, vehicle, recommendation, tone) {
    let enhanced = content;

    const ferrariAddOns = {
      urgent: [
        ' The Scuderia is moving quickly as every second matters.',
        ' The garage is ready, and this could be a defining moment of the stint.'
      ],
      dramatic: [
        ' The tension is rising as the race pivots around this call.',
        ' This is the kind of decision that can reshape the entire race story.'
      ],
      broadcast: [
        ' The crew is focused, the timing is critical, and the next lap could be decisive.',
        ' This is race control intelligence turning into action.'
      ],
      strategic: [
        ' The Scuderia is working to maintain its competitive edge.',
        ' This move is about balancing risk, pace, and track position.'
      ],
      analytical: [
        ' The pit wall is reading the race carefully and keeping options open.',
        ' The team is prioritizing stability without giving away sensitive details.'
      ],
      technical: [
        ' The call is based on race-state intelligence rather than raw numbers shared publicly.',
        ' The focus is controlled performance through the next phase.'
      ],
      'fan-friendly': [
        ' For fans, the key idea is simple: protect the race, then attack again.',
        ' It is a smart reset designed to keep the driver in the fight.'
      ],
      confident: [
        ' The engineers believe this adjustment strengthens the next stint.',
        ' Confidence on the pit wall is growing as the strategy becomes clearer.'
      ],
      calm: [
        ' The team keeps the execution clean and controlled.',
        ' No drama, just precision from the garage.'
      ],
      informative: [
        ' The stop fits the broader race plan.',
        ' The team remains focused on consistency.'
      ]
    };

    if (vehicle.team_name === 'Ferrari') {
      const addOns = ferrariAddOns[tone] || ferrariAddOns.strategic;
      const addOn = addOns[Math.floor(Math.random() * addOns.length)];
      enhanced += addOn;
    }

    return enhanced;
  }

  determineEmotionalTone(messageType) {
    const tones = {
      critical_pit: 'urgent',
      strategy_change: 'strategic',
      normal_pit: 'informative',
      tire_management: 'analytical'
    };

    return tones[messageType] || 'neutral';
  }

  validateMessages(messages) {
    return messages.map(msg => {
      const telemetryPatterns = [
        /\d+\.\d+\s*(kmh|km\/h|mph)/i,
        /tire.*\d+%/i,
        /temperature.*\d+/i,
        /vibration.*\d+/i,
        /steering.*\d+/i,
        /risk.*score.*\d+/i,
        /\d+\.\d+\s*seconds/i
      ];

      const containsTelemetry = telemetryPatterns.some(pattern =>
        pattern.test(msg.content) || pattern.test(msg.title)
      );

      if (containsTelemetry) {
        console.warn(`⚠️ Telemetry detected in ${msg.language} message - sanitizing`);
        msg.content = this.sanitizeTelemetry(msg.content);
        msg.title = this.sanitizeTelemetry(msg.title);
      }

      msg.contains_telemetry = containsTelemetry;
      return msg;
    });
  }

  sanitizeTelemetry(text) {
    let sanitized = text;

    sanitized = sanitized.replace(/\d+\.\d+\s*(kmh|km\/h|mph)/gi, 'high speed');
    sanitized = sanitized.replace(/tire.*\d+%/gi, 'tire wear');
    sanitized = sanitized.replace(/temperature.*\d+/gi, 'elevated temperature');
    sanitized = sanitized.replace(/vibration.*\d+/gi, 'vibration');
    sanitized = sanitized.replace(/risk.*score.*\d+/gi, 'elevated risk');

    return sanitized;
  }

  determinePriority(severity) {
    const priorities = {
      critical: 'high',
      high: 'high',
      medium: 'medium',
      low: 'low'
    };

    return priorities[severity] || 'medium';
  }

  getPersonalizationFeatures() {
    return {
      multilingual: true,
      emotional_storytelling: true,
      notification_variety: true,
      team_context: true,
      driver_specific: true,
      telemetry_safe: true,
      governance_approved: true
    };
  }

  generateFanInsights(vehicle, recommendation) {
    return {
      driver_performance: `${vehicle.driver_name} is executing the team's strategy`,
      tire_strategy: 'The team is managing tire life strategically',
      race_position: 'Maintaining competitive position',
      next_milestone:
        recommendation?.pit_window?.action === 'immediate_pit_stop'
          ? 'Pit stop imminent'
          : 'Monitoring race development'
    };
  }

  createPersonalizedFeed(fanProfile, messages) {
    const preferredLanguage = fanProfile.preferred_language || 'en';
    const personalizedMessages = messages.filter(msg => msg.language === preferredLanguage);

    if (fanProfile.favorite_driver) {
      return personalizedMessages.filter(msg =>
        msg.message_content.includes(fanProfile.favorite_driver)
      );
    }

    return personalizedMessages;
  }
}

export const fanEngagementAgent = new FanEngagementAgent();