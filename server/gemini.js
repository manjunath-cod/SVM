import fs from 'node:fs';
import path from 'node:path';
import { getGeminiApiKey } from './env.js';

// Rubric definitions for each creative discipline
export const CATEGORY_RUBRICS = {
  singing: [
    { name: 'Vocal Control & Pitch', description: 'Intonation accuracy, vocal stability, breath support, and register transitions.' },
    { name: 'Rhythm & Phrasing', description: 'Timing, groove adherence, syncopation, and lyrical phrasing.' },
    { name: 'Tone & Timbre', description: 'Vocal resonance, warmth, dynamic range, and tonal consistency.' },
    { name: 'Expressive Delivery', description: 'Emotional connection, dynamic contrasts, storytelling, and stylistic authenticity.' }
  ],
  music: [
    { name: 'Composition & Arrangement', description: 'Structural coherence, motif development, and instrument balance.' },
    { name: 'Harmonic Progression', description: 'Chordal richness, voice leading, and tonal clarity.' },
    { name: 'Production & Balance', description: 'Clarity of mix, dynamic range, frequency distribution, and spatial depth.' },
    { name: 'Originality & Emotion', description: 'Distinct voice, creative risks, and emotional impact.' }
  ],
  instrumental_music: [
    { name: 'Technical Proficiency', description: 'Fingering/bowing/embouchure execution, precision, and hand coordination.' },
    { name: 'Intonation & Tone Quality', description: 'Pitch purity, acoustic warmth, and resonant sustain.' },
    { name: 'Rhythmic Accuracy', description: 'Tempo consistency, subdivisional feel, and groove pocket.' },
    { name: 'Musical Articulation', description: 'Phrasing, accents, dynamic shading, and stylistic nuance.' }
  ],
  dance: [
    { name: 'Movement Precision & Lines', description: 'Body alignment, extension, clean silhouettes, and intentional footwork.' },
    { name: 'Rhythm & Musicality', description: 'Synchronization with beats, accents, pauses, and textural movement.' },
    { name: 'Spatial Awareness', description: 'Use of stage levels, directional changes, and floor geometry.' },
    { name: 'Energy & Projection', description: 'Performance charisma, stamina, emotional commitment, and presence.' }
  ],
  photography: [
    { name: 'Composition & Framing', description: 'Rule of thirds/leading lines, visual weight balance, and perspective.' },
    { name: 'Lighting & Exposure', description: 'Dynamic range management, highlight/shadow detail, and ambient mood.' },
    { name: 'Focus & Depth of Field', description: 'Intentional aperture selection, focal sharpness, and subject separation.' },
    { name: 'Storytelling & Impact', description: 'Narrative depth, decisive moment capture, and visual resonance.' }
  ],
  videography: [
    { name: 'Cinematography & Framing', description: 'Shot variety, composition, camera stabilization, and intentional angles.' },
    { name: 'Lighting & Color Grade', description: 'Visual mood, contrast ratios, color palette coherence, and clarity.' },
    { name: 'Pacing & Editing Rhythm', description: 'Cut points, continuity, montage rhythm, and scene transitions.' },
    { name: 'Narrative or Conceptual Hook', description: 'Clarity of story, emotional engagement, and audience retention.' }
  ],
  painting: [
    { name: 'Composition & Layout', description: 'Visual balance, focal points, spatial proportions, and negative space.' },
    { name: 'Technique & Brushwork', description: 'Mark-making variety, texture, layer building, and medium control.' },
    { name: 'Color Theory & Harmony', description: 'Palette restraint, value contrast, saturation control, and mood.' },
    { name: 'Original Concept', description: 'Conceptual depth, expressive voice, and creative exploration.' }
  ],
  graphic_design: [
    { name: 'Visual Hierarchy', description: 'Guiding viewer eye flow, emphasis, scale contrast, and clear reading order.' },
    { name: 'Typography', description: 'Font pairing, kerning, leading, legibility, and stylistic appropriateness.' },
    { name: 'Color & Contrast', description: 'Color harmony, accessible contrast ratios, and purposeful palette choices.' },
    { name: 'Grid & Execution Polish', description: 'Alignment, margins, rhythm, and execution fidelity.' }
  ],
  writing: [
    { name: 'Voice & Distinct Style', description: 'Originality of narrative voice, tonal consistency, and prose rhythm.' },
    { name: 'Structure & Pacing', description: 'Arc development, logical flow, tension control, and scene transitions.' },
    { name: 'Character & Thematic Depth', description: 'Nuance of ideas, believable development, and evocative subtext.' },
    { name: 'Language & Craft', description: 'Vocabulary precision, sentence variety, sensory detail, and editing polish.' }
  ],
  poetry: [
    { name: 'Meter & Sonic Texture', description: 'Rhythmic flow, alliteration, assonance, rhyme scheme, or free verse cadence.' },
    { name: 'Imagery & Metaphor', description: 'Fresh figures of speech, vivid sensory evocations, and symbolic resonance.' },
    { name: 'Form & Structural Purpose', description: 'Stanza breaks, lineation, visual rhythm, and compression of language.' },
    { name: 'Emotional Resonance', description: 'Capacity to evoke feeling, subtlety of thought, and thematic impact.' }
  ],
  anchoring: [
    { name: 'Vocal Modulation & Clarity', description: 'Enunciation, pitch variation, projection, pacing, and breath management.' },
    { name: 'Stage Presence & Demeanor', description: 'Posture, open body language, relaxed confidence, and eye contact.' },
    { name: 'Audience Engagement', description: 'Warmth, interactive rapport, energy pacing, and audience awareness.' },
    { name: 'Improvisation & Flow', description: 'Handling transitions, recovering from unexpected cues, and spontaneous humor.' }
  ],
  acting: [
    { name: 'Character Conviction', description: 'Believability, emotional truth, motivation clarity, and subtextual depth.' },
    { name: 'Physicality & Movement', description: 'Posture, gestures, spatial embodiment, and intentional physical choices.' },
    { name: 'Vocal Projection & Diction', description: 'Vocal inflection, dialect/accent authenticity, and dynamic volume.' },
    { name: 'Listening & Reaction', description: 'Active presence, spontaneity in responses, and genuine engagement.' }
  ],
  theatre: [
    { name: 'Stage Blocking & Staging', description: 'Use of stage space, sightlines, ensemble choreography, and spatial dynamics.' },
    { name: 'Dramatic Tension', description: 'Pacing, build-up of stakes, climax timing, and comedic/dramatic beats.' },
    { name: 'Acoustics & Audibility', description: 'Voice projection into the house, enunciation, and balance with sound.' },
    { name: 'Ensemble Synergy', description: 'Collaborative interplay, mutual focus, and collective tempo.' }
  ],
  event_management: [
    { name: 'Concept & Vision', description: 'Theme originality, target attendee experience, and program value.' },
    { name: 'Operational Logistics', description: 'Timeline feasibility, crowd flow, scheduling, and technical requirements.' },
    { name: 'Contingency & Risk Foresight', description: 'Emergency protocols, technical backups, and risk management.' },
    { name: 'Communication & Branding', description: 'Clear marketing narrative, stakeholder coordination, and branding coherence.' }
  ],
  other: [
    { name: 'Creative Craftsmanship', description: 'Attention to detail, material control, and technical execution.' },
    { name: 'Originality & Concept', description: 'Fresh perspective, unique approach, and creative exploration.' },
    { name: 'Coherence & Purpose', description: 'Clear artistic intent and thoughtful resolution.' },
    { name: 'Development Potential', description: 'Promise for growth, iteration, and cross-disciplinary collaboration.' }
  ]
};

const JSON_SCHEMA = {
  type: 'object',
  properties: {
    summary: {
      type: 'string',
      description: 'A 2-3 sentence thoughtful artistic summary of what was observed in the submitted work.'
    },
    overallScore: {
      type: 'number',
      description: 'A fair overall score between 1.0 and 10.0 based on technical and creative evidence. Use null only if the submission cannot be meaningfully scored.'
    },
    confidenceRating: {
      type: 'string',
      enum: ['high', 'moderate', 'preliminary'],
      description: 'Confidence in this evaluation based on the quality and completeness of evidence in the submission.'
    },
    rubrics: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          criterion: { type: 'string' },
          score: { type: 'number', description: 'Score from 1 to 10' },
          observation: { type: 'string', description: 'Direct specific observation explaining this score' }
        },
        required: ['criterion', 'score', 'observation']
      }
    },
    detailedObservations: {
      type: 'array',
      items: { type: 'string' },
      description: '3 to 5 individualized observations derived directly from analyzing the submitted media and description.'
    },
    strengths: {
      type: 'array',
      items: { type: 'string' },
      description: '2 to 4 concrete, encouraging artistic and technical strengths demonstrated in this piece.'
    },
    areasForImprovement: {
      type: 'array',
      items: { type: 'string' },
      description: '2 to 3 actionable, constructive areas where focused refinement will unlock the student’s next level.'
    },
    practicalExercises: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          frequency: { type: 'string' },
          targetOutcome: { type: 'string' }
        },
        required: ['title', 'description', 'frequency', 'targetOutcome']
      },
      description: '2 to 3 hands-on practice routines or creative exercises tailored to this specific work.'
    },
    recommendedSvmActivities: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          type: { type: 'string' },
          reason: { type: 'string' }
        },
        required: ['name', 'type', 'reason']
      },
      description: '1 to 3 relevant SVM campus clubs, fests, or opportunities (e.g. SVM Unplugged, Frames of Campus, Theatre Guild, CultureFest) that match this student’s creative direction.'
    },
    limitationsDisclaimer: {
      type: 'string',
      description: 'An honest explanation of what the automated AI model could and could not evaluate in this media artifact.'
    }
  },
  required: [
    'summary',
    'rubrics',
    'detailedObservations',
    'strengths',
    'areasForImprovement',
    'practicalExercises',
    'recommendedSvmActivities',
    'limitationsDisclaimer'
  ]
};

export async function evaluateSubmissionWithGemini(submission, profile) {
  const apiKey = getGeminiApiKey();

  // If API key is not configured, return an honest diagnostic response (never fake mock data)
  if (!apiKey) {
    return {
      status: 'unconfigured',
      mediaEvaluated: 0,
      mediaNotes: 'GEMINI_API_KEY is not set in the server environment (.env). Evaluation queued for live processing once configured.',
      overallScore: null,
      confidenceRating: 'unverified',
      summary: 'Automated Gemini AI evaluation is ready but currently paused pending GEMINI_API_KEY configuration in the server environment.',
      rubricScores: [],
      detailedObservations: [
        `Submission recorded in local SQLite database for category "${submission.category}".`,
        'No external AI evaluation was generated because provider credentials are absent.',
        'To enable live multimodal Gemini evaluation, set GEMINI_API_KEY in your .env file.'
      ],
      strengths: [
        'Submission successfully cataloged with metadata, consent, and media file.',
        'Clear creative statement provided.'
      ],
      areasForImprovement: [
        'Connect Gemini API credentials on the server to unlock genuine AI multimodal feedback.'
      ],
      practicalExercises: [
        {
          title: 'Peer Review & Self-Reflection',
          description: 'Record yourself explaining your creative choices, or share this piece with an SVM faculty mentor or club lead.',
          frequency: 'Once per project cycle',
          targetOutcome: 'Develop critical artistic self-awareness through human dialogue.'
        }
      ],
      recommendedSvmActivities: [
        {
          name: 'SVM CultureLoop Open Sessions',
          type: 'Campus Community',
          reason: 'Showcase work during live campus peer circles while automated AI evaluation is being initialized.'
        }
      ],
      limitationsDisclaimer: 'Automated evaluation requires a valid Google Gemini API key. No canned or simulated score is provided in place of a genuine evaluation.'
    };
  }

  const category = (submission.category || 'other').toLowerCase();
  const rubrics = CATEGORY_RUBRICS[category] || CATEGORY_RUBRICS.other;

  // Prepare system instructions emphasizing genuine, respectful artistic evaluation
  const systemInstruction = `You are the AI Creative Mentor for SVM CultureLoop, an arts and creative ecosystem at SVM Institute of Technology.
Your role is to evaluate student creative work with genuine artistic sensitivity, technical precision, and constructive encouragement.

CRITICAL PRINCIPLES:
1. Evaluate ONLY the submitted creative artifact and artist statement. NEVER judge the student's innate talent, intelligence, or personal worth.
2. Be specific, concrete, and evidence-based. Reference actual visual elements, harmonic intervals, lyrical lines, camera angles, pacing, or compositional choices present in the submission.
3. Tailor your criteria to the student's declared category (${category}) and experience level (${submission.experience_level || 'beginner'}).
4. Avoid generic platitudes, fixed score patterns, or canned phrases.
5. Provide practical, actionable exercises that a college student can realistically practice in a campus environment.
6. Connect recommendations to SVM campus activities (e.g. SVM Unplugged for music/vocals, Frames of Campus for photography/film, SVM Theatre Guild for acting/drama, Loopzine for writing/design, Natya Collective for dance).
7. Clearly acknowledge the limitations of AI evaluation: AI processes static digital artifacts and cannot substitute for live human connection, cultural context, or audience presence.`;

  // Build the multimodal contents array
  const contents = [];
  const parts = [];

  let mediaEvaluated = 0;
  let mediaNotes = 'No media file attached; evaluated based on artist description.';

  // Check if media file exists and read it
  if (submission.file_path && fs.existsSync(submission.file_path)) {
    try {
      const stats = fs.statSync(submission.file_path);
      const mimeType = submission.file_type || 'application/octet-stream';

      // Support images, audio, PDFs, and plain text
      const isImage = mimeType.startsWith('image/');
      const isAudio = mimeType.startsWith('audio/');
      const isPdf = mimeType === 'application/pdf';
      const isText = mimeType.startsWith('text/') || submission.file_name?.endsWith('.txt') || submission.file_name?.endsWith('.md');
      const isVideo = mimeType.startsWith('video/');

      if (isText) {
        const textContent = fs.readFileSync(submission.file_path, 'utf8');
        parts.push({
          text: `[SUBMITTED TEXT ARTIFACT - FILE: ${submission.file_name}]\n\n${textContent.slice(0, 30000)}`
        });
        mediaEvaluated = 1;
        mediaNotes = `Directly evaluated full text content (${submission.file_name}, ${stats.size} bytes).`;
      } else if (isImage || isAudio || isPdf || (isVideo && stats.size <= 20 * 1024 * 1024)) {
        // Read file into base64
        const fileBuffer = fs.readFileSync(submission.file_path);
        const base64Data = fileBuffer.toString('base64');
        parts.push({
          inline_data: {
            mime_type: mimeType,
            data: base64Data
          }
        });
        mediaEvaluated = 1;
        mediaNotes = `Multimodal media directly parsed and transmitted to Gemini (${mimeType}, ${(stats.size / 1024 / 1024).toFixed(2)} MB).`;
      } else if (isVideo) {
        mediaEvaluated = 0;
        mediaNotes = `Video file (${(stats.size / 1024 / 1024).toFixed(1)} MB) exceeds inline processing limit. Evaluated using artist submission description, title, and technical metadata.`;
      }
    } catch (err) {
      console.warn('[gemini] Could not read media file:', err.message);
      mediaNotes = `File could not be read for inline transmission (${err.message}). Evaluated based on description.`;
    }
  }

  // Add the contextual prompt
  const userPrompt = `Please evaluate the following creative submission:

STUDENT PROFILE:
- Name: ${profile?.name || 'SVM Student'}
- Department: ${profile?.department || 'SVM Institute of Technology'}
- Year: ${profile?.year_of_study || 'Student'}

SUBMISSION DETAILS:
- Title: "${submission.title}"
- Category: ${submission.category}
- Declared Experience Level: ${submission.experience_level || 'Beginner'}
- Confidence Level: ${submission.confidence_level || 'Exploring'}
- Creative Description / Statement: "${submission.description || 'No description provided'}"
- Attached Media Type: ${submission.file_type || 'None'}
- Attached Media Name: ${submission.file_name || 'None'}

RUBRIC CRITERIA FOR THIS CATEGORY:
${rubrics.map((r) => `- ${r.name}: ${r.description}`).join('\n')}

INSTRUCTIONS:
1. Inspect the attached media (if provided) and the artist description carefully.
2. Provide a score for each of the ${rubrics.length} rubric criteria above, along with a concrete observation based on evidence in the submission.
3. Formulate an overall score (1.0 to 10.0) reflecting where the student currently stands in their journey.
4. Provide individualized observations, strengths, areas for improvement, practical exercises, and SVM community recommendations.
5. Provide a clear limitations disclaimer.`;

  parts.push({ text: userPrompt });
  contents.push({ role: 'user', parts });

  // Call Google Gemini API
  // We try gemini-2.5-flash first, and fall back to gemini-1.5-flash if needed
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
  let lastError = null;

  for (const modelName of models) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const payload = {
        system_instruction: {
          parts: [{ text: systemInstruction }]
        },
        contents,
        generationConfig: {
          temperature: 0.4,
          topP: 0.95,
          responseMimeType: 'application/json',
          responseSchema: JSON_SCHEMA
        }
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[gemini] Model ${modelName} returned HTTP ${response.status}:`, errorText);
        lastError = new Error(`Gemini API error (${modelName} HTTP ${response.status}): ${errorText}`);
        continue; // try next model
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('Gemini API returned an empty candidate part.');
      }

      const parsed = JSON.parse(rawText);

      return {
        status: 'evaluated',
        mediaEvaluated,
        mediaNotes,
        overallScore: typeof parsed.overallScore === 'number' ? parsed.overallScore : null,
        confidenceRating: parsed.confidenceRating || 'moderate',
        summary: parsed.summary,
        rubricScores: parsed.rubrics || [],
        detailedObservations: parsed.detailedObservations || [],
        strengths: parsed.strengths || [],
        areasForImprovement: parsed.areasForImprovement || [],
        practicalExercises: parsed.practicalExercises || [],
        recommendedSvmActivities: parsed.recommendedSvmActivities || [],
        limitationsDisclaimer: parsed.limitationsDisclaimer
      };
    } catch (err) {
      console.warn(`[gemini] Error calling ${modelName}:`, err.message);
      lastError = err;
    }
  }

  // If all model calls failed, return an honest error report (never fake scores)
  return {
    status: 'error',
    mediaEvaluated: 0,
    mediaNotes: `Gemini API evaluation failed: ${lastError?.message || 'Unknown network or API error'}.`,
    overallScore: null,
    confidenceRating: 'unverified',
    summary: 'An error occurred during Gemini AI processing. Your submission is intact in the database and can be re-evaluated.',
    rubricScores: [],
    detailedObservations: [
      `Evaluation request encountered an error: ${lastError?.message}`,
      'No score was fabricated. The system preserves strict academic integrity.'
    ],
    strengths: ['Creative work successfully stored and preserved.'],
    areasForImprovement: ['Retry evaluation after verifying network connection and Gemini API quota.'],
    practicalExercises: [],
    recommendedSvmActivities: [
      {
        name: 'SVM Faculty Office Hours',
        type: 'Mentorship',
        reason: 'Consult an SVM arts advisor or club lead for immediate human evaluation.'
      }
    ],
    limitationsDisclaimer: 'AI evaluation failed due to service connectivity. No simulated score was assigned.'
  };
}

