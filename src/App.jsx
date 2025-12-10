import React, { useState, useRef } from 'react';

// ============================================
// BETWEEN THE LINES — Pastel Edition
// Gentle, professional, user-friendly
// ============================================

// Pastel color palette
const colors = {
  bg: '#faf8f5',           // warm off-white
  card: '#ffffff',
  accent: '#9f8fef',       // soft lavender
  accentLight: '#e8e4fb',
  mint: '#7dd3c0',
  mintLight: '#d4f5ed',
  peach: '#f5a97f',
  peachLight: '#fde8db',
  rose: '#e89eb8',
  roseLight: '#fce4ec',
  text: '#2d2a3e',
  textMuted: '#6b6880',
  border: '#e8e6e3',
};

// Wiki data with pastel colors
const WIKI = {
  "criticism": { 
    emoji: "⚡", 
    title: "Criticism", 
    subtitle: "Attacking character, not behavior",
    tip: "Start with 'I feel...' instead of 'You are...'",
    color: colors.peach,
    bgColor: colors.peachLight
  },
  "contempt": { 
    emoji: "😤", 
    title: "Contempt", 
    subtitle: "Disgust or superiority",
    tip: "Build daily appreciation habits",
    color: colors.rose,
    bgColor: colors.roseLight
  },
  "defensiveness": { 
    emoji: "🛡️", 
    title: "Defensiveness", 
    subtitle: "Deflecting responsibility",
    tip: "Accept even a small part of responsibility",
    color: colors.accent,
    bgColor: colors.accentLight
  },
  "stonewalling": { 
    emoji: "🧱", 
    title: "Stonewalling", 
    subtitle: "Withdrawing, shutting down",
    tip: "Take a break WITH a return promise",
    color: '#8b9dc3',
    bgColor: '#e8edf5'
  },
  "pursue-withdraw": { 
    emoji: "🔄", 
    title: "Pursue-Withdraw", 
    subtitle: "The chase and retreat dance",
    tip: "Pursuer: soften. Withdrawer: come back.",
    color: '#d4a574',
    bgColor: '#f5ebe0'
  },
  "anxious": { 
    emoji: "💭", 
    title: "Anxious", 
    subtitle: "The Worrier",
    tip: "They need consistent reassurance",
    color: colors.peach,
    bgColor: colors.peachLight
  },
  "avoidant": { 
    emoji: "🚪", 
    title: "Avoidant", 
    subtitle: "The Lone Wolf",
    tip: "Give space without punishment",
    color: '#7eb8da',
    bgColor: '#e3f2fd'
  },
  "secure": { 
    emoji: "🌱", 
    title: "Secure", 
    subtitle: "The Steady One",
    tip: "The goal — can be learned!",
    color: colors.mint,
    bgColor: colors.mintLight
  },
  "disorganized": { 
    emoji: "🌀", 
    title: "Disorganized", 
    subtitle: "The Push-Puller",
    tip: "Patience + consistency + support",
    color: colors.accent,
    bgColor: colors.accentLight
  },
};

// Sample conversation for testing
const SAMPLE_CONVO = `Me: Hey, did you get my message about dinner tomorrow?
Partner: Yeah
Me: So... are we going or not?
Partner: I don't know, I'm tired
Me: You're always tired. Can you just give me a straight answer?
Partner: Why are you being like this?
Me: Being like what? I just asked a simple question
Partner: Whatever, fine, we'll go
Me: Forget it. If you don't want to go, just say so
Partner: I said we'll go!
Me: Your tone says otherwise`;

export default function BetweenTheLines() {
  const [inputType, setInputType] = useState('text');
  const [conversation, setConversation] = useState('');
  const [imageData, setImageData] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [repairScript, setRepairScript] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('input');
  const [expandedWiki, setExpandedWiki] = useState(null);
  const fileInputRef = useRef(null);

  // ============================================
  // IMAGE HANDLING
  // ============================================
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImagePreview(URL.createObjectURL(file));
    
    const reader = new FileReader();
    reader.onload = () => {
      setImageData({
        base64: reader.result.split(',')[1],
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  // ============================================
  // GEMINI API CALL
  // ============================================
  const callGemini = async (prompt, systemPrompt = '') => {
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4000,
          system: systemPrompt,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await response.json();
      return data.content?.[0]?.text || '';
    } catch (error) {
      console.error('API Error:', error);
      return null;
    }
  };

  // ============================================
  // ANALYZE CONVERSATION
  // ============================================
  const analyzeConversation = async () => {
    if (!conversation.trim() && !imageData) return;
    setLoading(true);

    const systemPrompt = `You are a warm, insightful communication coach trained in Gottman Method and attachment theory. Analyze conversations with empathy and give practical, hopeful advice. Avoid clinical jargon — speak like a wise friend.`;

    const analysisPrompt = `Analyze this conversation between two people:

<conversation>
${conversation}
</conversation>

Provide your analysis in this exact JSON format:
{
  "healthScore": 45,
  "summary": "A warm, 2-sentence summary of what's happening in this conversation",
  "coreIssue": "The real underlying issue in plain, compassionate language",
  "patterns": [
    {
      "type": "pursue-withdraw",
      "who": "Person 1",
      "quote": "exact quote showing this",
      "severity": 7,
      "explanation": "Why this matters, explained kindly"
    }
  ],
  "person1": {
    "style": "anxious",
    "confidence": 75,
    "summary": "A gentle description of how Person 1 seems to be feeling and why"
  },
  "person2": {
    "style": "avoidant", 
    "confidence": 70,
    "summary": "A gentle description of how Person 2 seems to be feeling and why"
  },
  "hopefulNote": "Something positive or hopeful about this situation",
  "oneSmallStep": "One tiny, doable action they could try"
}

Be warm and non-judgmental. Both people are doing their best.`;

    try {
      const result = await callGemini(analysisPrompt, systemPrompt);
      const jsonMatch = result?.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        setAnalysis(JSON.parse(jsonMatch[0]));
        setActiveTab('analysis');
      }
    } catch (error) {
      console.error('Analysis error:', error);
    }
    setLoading(false);
  };

  // ============================================
  // GENERATE REPAIR SCRIPT
  // ============================================
  const generateRepairScript = async () => {
    if (!analysis) return;
    setLoading(true);

    const systemPrompt = `You are a compassionate communication coach. Generate repair scripts that feel natural and authentic — not robotic or therapy-speak. The goal is reconnection, not "winning."`;

    const repairPrompt = `Based on this analysis:
${JSON.stringify(analysis, null, 2)}

Original conversation:
${conversation}

Create a gentle repair toolkit. Make it feel human and doable.

JSON format:
{
  "beforeTalking": {
    "breathe": "A calming suggestion",
    "mindset": "A helpful reframe",
    "timing": "When might be a good time"
  },
  "openingLines": [
    {
      "say": "A gentle way to start",
      "tone": "How to say it"
    }
  ],
  "keyPhrases": [
    {
      "purpose": "To acknowledge their experience",
      "say": "Exact words",
      "why": "Why this helps"
    },
    {
      "purpose": "To share your feelings",
      "say": "Exact words", 
      "why": "Why this helps"
    },
    {
      "purpose": "To move forward together",
      "say": "Exact words",
      "why": "Why this helps"
    }
  ],
  "avoid": ["Things that might make it worse"],
  "ifStuck": "What to do if the conversation stalls",
  "remember": "A comforting reminder"
}`;

    try {
      const result = await callGemini(repairPrompt, systemPrompt);
      const jsonMatch = result?.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        setRepairScript(JSON.parse(jsonMatch[0]));
        setActiveTab('repair');
      }
    } catch (error) {
      console.error('Repair error:', error);
    }
    setLoading(false);
  };

  // ============================================
  // UI COMPONENTS
  // ============================================
  
  const HealthMeter = ({ score }) => {
    const getColor = () => {
      if (score >= 70) return colors.mint;
      if (score >= 40) return colors.peach;
      return colors.rose;
    };
    
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span style={{ color: colors.textMuted }}>Communication Health</span>
          <span style={{ color: getColor(), fontWeight: 600 }}>{score}/100</span>
        </div>
        <div 
          className="h-2 rounded-full overflow-hidden"
          style={{ background: colors.border }}
        >
          <div 
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${score}%`, background: getColor() }}
          />
        </div>
      </div>
    );
  };

  const PatternCard = ({ pattern }) => {
    const wiki = WIKI[pattern.type] || {};
    return (
      <div 
        className="p-4 rounded-2xl"
        style={{ background: wiki.bgColor || colors.accentLight }}
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl">{wiki.emoji}</span>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium" style={{ color: colors.text }}>
                {wiki.title}
              </span>
              <span 
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'white', color: colors.textMuted }}
              >
                {pattern.who}
              </span>
            </div>
            <p 
              className="text-sm italic mb-2"
              style={{ color: colors.textMuted }}
            >
              "{pattern.quote}"
            </p>
            <p className="text-sm" style={{ color: colors.text }}>
              {pattern.explanation}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const AttachmentCard = ({ person, label, data }) => {
    const wiki = WIKI[data?.style] || {};
    return (
      <div 
        className="p-4 rounded-2xl"
        style={{ background: wiki.bgColor || '#f5f5f5' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{wiki.emoji}</span>
          <div>
            <p className="text-xs" style={{ color: colors.textMuted }}>{label}</p>
            <p className="font-medium" style={{ color: colors.text }}>
              {wiki.title} Attachment
            </p>
          </div>
        </div>
        <p className="text-sm" style={{ color: colors.textMuted }}>
          {data?.summary}
        </p>
      </div>
    );
  };

  const WikiCard = ({ id }) => {
    const data = WIKI[id];
    if (!data) return null;
    const isExpanded = expandedWiki === id;
    
    return (
      <button
        onClick={() => setExpandedWiki(isExpanded ? null : id)}
        className="w-full text-left p-4 rounded-2xl transition-all duration-200"
        style={{ 
          background: isExpanded ? data.bgColor : 'white',
          border: `1px solid ${colors.border}`,
          boxShadow: isExpanded ? '0 4px 12px rgba(0,0,0,0.05)' : 'none'
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{data.emoji}</span>
          <div className="flex-1">
            <p className="font-medium" style={{ color: colors.text }}>{data.title}</p>
            <p className="text-sm" style={{ color: colors.textMuted }}>{data.subtitle}</p>
          </div>
          <span style={{ color: colors.textMuted }}>{isExpanded ? '−' : '+'}</span>
        </div>
        {isExpanded && (
          <div 
            className="mt-3 pt-3 text-sm"
            style={{ borderTop: `1px solid ${colors.border}`, color: colors.text }}
          >
            💡 {data.tip}
          </div>
        )}
      </button>
    );
  };

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div className="min-h-screen" style={{ background: colors.bg, fontFamily: "'DM Sans', -apple-system, sans-serif" }}>
      {/* Header */}
      <header 
        className="sticky top-0 z-50 backdrop-blur-md"
        style={{ background: `${colors.bg}ee`, borderBottom: `1px solid ${colors.border}` }}
      >
        <div className="max-w-xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl"
              style={{ background: `linear-gradient(135deg, ${colors.accent}, ${colors.mint})` }}
            >
              💬
            </div>
            <div>
              <h1 className="font-semibold text-lg" style={{ color: colors.text }}>
                Between the Lines
              </h1>
              <p className="text-sm" style={{ color: colors.textMuted }}>
                Understand your conversations better
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav style={{ borderBottom: `1px solid ${colors.border}` }}>
        <div className="max-w-xl mx-auto px-4">
          <div className="flex gap-1">
            {[
              { id: 'input', label: 'Start', icon: '✏️' },
              { id: 'analysis', label: 'Insights', icon: '💡', disabled: !analysis },
              { id: 'repair', label: 'Repair', icon: '💚', disabled: !repairScript },
              { id: 'learn', label: 'Learn', icon: '📚' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && setActiveTab(tab.id)}
                disabled={tab.disabled}
                className="px-4 py-3 text-sm font-medium transition-all relative"
                style={{ 
                  color: activeTab === tab.id ? colors.accent : tab.disabled ? colors.border : colors.textMuted,
                  opacity: tab.disabled ? 0.5 : 1
                }}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
                {activeTab === tab.id && (
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ background: colors.accent }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-xl mx-auto px-4 py-6">
        
        {/* INPUT TAB */}
        {activeTab === 'input' && (
          <div className="space-y-6">
            {/* Welcome message */}
            <div 
              className="p-4 rounded-2xl text-center"
              style={{ background: colors.accentLight }}
            >
              <p style={{ color: colors.text }}>
                Paste a conversation and I'll help you understand what's happening beneath the surface 🌱
              </p>
            </div>

            {/* Input type toggle */}
            <div 
              className="flex gap-1 p-1 rounded-xl"
              style={{ background: colors.card, border: `1px solid ${colors.border}` }}
            >
              {[
                { id: 'text', label: '✏️ Paste Text' },
                { id: 'image', label: '📸 Screenshot' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setInputType(opt.id)}
                  className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
                  style={{ 
                    background: inputType === opt.id ? colors.accent : 'transparent',
                    color: inputType === opt.id ? 'white' : colors.textMuted
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Text input */}
            {inputType === 'text' && (
              <div className="space-y-3">
                <textarea
                  value={conversation}
                  onChange={(e) => setConversation(e.target.value)}
                  placeholder="Paste your conversation here...

Example:
Me: Hey, did you get my message?
Partner: Yeah
Me: So what do you think?"
                  className="w-full h-56 p-4 rounded-2xl resize-none text-sm transition-all focus:outline-none"
                  style={{ 
                    background: colors.card, 
                    border: `2px solid ${colors.border}`,
                    color: colors.text
                  }}
                  onFocus={(e) => e.target.style.borderColor = colors.accent}
                  onBlur={(e) => e.target.style.borderColor = colors.border}
                />
                <button
                  onClick={() => setConversation(SAMPLE_CONVO)}
                  className="text-sm transition-colors"
                  style={{ color: colors.accent }}
                >
                  ↳ Load example conversation
                </button>
              </div>
            )}

            {/* Image input */}
            {inputType === 'image' && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                
                {imagePreview ? (
                  <div className="relative">
                    <img 
                      src={imagePreview} 
                      alt="Screenshot"
                      className="w-full rounded-2xl"
                      style={{ border: `2px solid ${colors.border}` }}
                    />
                    <button
                      onClick={() => { setImagePreview(null); setImageData(null); }}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-sm"
                      style={{ background: colors.card, color: colors.textMuted }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-56 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all"
                    style={{ 
                      border: `2px dashed ${colors.border}`,
                      background: colors.card
                    }}
                  >
                    <span className="text-4xl">📸</span>
                    <span style={{ color: colors.textMuted }}>Tap to upload a screenshot</span>
                    <span className="text-sm" style={{ color: colors.border }}>
                      WeChat, iMessage, WhatsApp...
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* Analyze button */}
            <button
              onClick={analyzeConversation}
              disabled={loading || (inputType === 'text' ? !conversation.trim() : !imageData)}
              className="w-full py-4 rounded-2xl font-medium text-white transition-all disabled:opacity-50"
              style={{ 
                background: `linear-gradient(135deg, ${colors.accent}, ${colors.mint})`,
                boxShadow: '0 4px 14px rgba(159, 143, 239, 0.3)'
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⏳</span> Analyzing...
                </span>
              ) : (
                'Analyze Conversation ✨'
              )}
            </button>
          </div>
        )}

        {/* ANALYSIS TAB */}
        {activeTab === 'analysis' && analysis && (
          <div className="space-y-5">
            {/* Health Score */}
            <div 
              className="p-5 rounded-2xl"
              style={{ background: colors.card, border: `1px solid ${colors.border}` }}
            >
              <HealthMeter score={analysis.healthScore} />
              <p className="mt-4 text-sm" style={{ color: colors.text }}>
                {analysis.summary}
              </p>
            </div>

            {/* Core Issue */}
            <div 
              className="p-5 rounded-2xl"
              style={{ background: colors.mintLight }}
            >
              <p className="text-sm font-medium mb-2" style={{ color: colors.mint }}>
                🎯 What's really going on
              </p>
              <p style={{ color: colors.text }}>{analysis.coreIssue}</p>
            </div>

            {/* Patterns */}
            {analysis.patterns?.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium" style={{ color: colors.text }}>
                  Patterns I noticed
                </h3>
                {analysis.patterns.map((pattern, i) => (
                  <PatternCard key={i} pattern={pattern} />
                ))}
              </div>
            )}

            {/* Attachment Styles */}
            <div className="space-y-3">
              <h3 className="font-medium" style={{ color: colors.text }}>
                Communication styles
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <AttachmentCard label="You" data={analysis.person1} />
                <AttachmentCard label="Them" data={analysis.person2} />
              </div>
            </div>

            {/* Hopeful Note */}
            {analysis.hopefulNote && (
              <div 
                className="p-5 rounded-2xl text-center"
                style={{ background: colors.accentLight }}
              >
                <p className="text-sm mb-1" style={{ color: colors.accent }}>💜</p>
                <p style={{ color: colors.text }}>{analysis.hopefulNote}</p>
              </div>
            )}

            {/* One Small Step */}
            <div 
              className="p-5 rounded-2xl"
              style={{ background: colors.card, border: `1px solid ${colors.border}` }}
            >
              <p className="text-sm font-medium mb-2" style={{ color: colors.mint }}>
                🌱 One small step
              </p>
              <p style={{ color: colors.text }}>{analysis.oneSmallStep}</p>
            </div>

            {/* CTA */}
            <button
              onClick={generateRepairScript}
              disabled={loading}
              className="w-full py-4 rounded-2xl font-medium text-white transition-all disabled:opacity-50"
              style={{ 
                background: `linear-gradient(135deg, ${colors.mint}, ${colors.accent})`,
                boxShadow: '0 4px 14px rgba(125, 211, 192, 0.3)'
              }}
            >
              {loading ? 'Creating...' : 'Get Repair Script 💚'}
            </button>
          </div>
        )}

        {/* REPAIR TAB */}
        {activeTab === 'repair' && repairScript && (
          <div className="space-y-5">
            {/* Before talking */}
            <div 
              className="p-5 rounded-2xl"
              style={{ background: colors.accentLight }}
            >
              <h3 className="font-medium mb-4" style={{ color: colors.text }}>
                Before you talk
              </h3>
              <div className="space-y-3 text-sm">
                <p><span style={{ color: colors.accent }}>🫁 Breathe:</span> {repairScript.beforeTalking?.breathe}</p>
                <p><span style={{ color: colors.accent }}>💭 Remember:</span> {repairScript.beforeTalking?.mindset}</p>
                <p><span style={{ color: colors.accent }}>⏰ Timing:</span> {repairScript.beforeTalking?.timing}</p>
              </div>
            </div>

            {/* Opening lines */}
            {repairScript.openingLines?.length > 0 && (
              <div 
                className="p-5 rounded-2xl"
                style={{ background: colors.card, border: `1px solid ${colors.border}` }}
              >
                <h3 className="font-medium mb-3" style={{ color: colors.text }}>
                  Ways to start
                </h3>
                {repairScript.openingLines.map((line, i) => (
                  <div key={i} className="p-3 rounded-xl mb-2" style={{ background: colors.bg }}>
                    <p style={{ color: colors.text }}>"{line.say}"</p>
                    <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                      {line.tone}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Key phrases */}
            <div 
              className="p-5 rounded-2xl"
              style={{ background: colors.card, border: `1px solid ${colors.border}` }}
            >
              <h3 className="font-medium mb-4" style={{ color: colors.text }}>
                Things you could say
              </h3>
              <div className="space-y-4">
                {repairScript.keyPhrases?.map((phrase, i) => (
                  <div key={i}>
                    <p className="text-xs font-medium mb-1" style={{ color: colors.accent }}>
                      {phrase.purpose}
                    </p>
                    <p 
                      className="p-3 rounded-xl text-sm"
                      style={{ background: colors.mintLight, color: colors.text }}
                    >
                      "{phrase.say}"
                    </p>
                    <p className="text-xs mt-1" style={{ color: colors.textMuted }}>
                      ↳ {phrase.why}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Avoid */}
            {repairScript.avoid?.length > 0 && (
              <div 
                className="p-5 rounded-2xl"
                style={{ background: colors.peachLight }}
              >
                <h3 className="font-medium mb-3" style={{ color: colors.peach }}>
                  ⚠️ Try to avoid
                </h3>
                <ul className="space-y-2">
                  {repairScript.avoid.map((item, i) => (
                    <li key={i} className="text-sm flex gap-2" style={{ color: colors.text }}>
                      <span>•</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* If stuck */}
            {repairScript.ifStuck && (
              <div 
                className="p-5 rounded-2xl"
                style={{ background: colors.card, border: `1px solid ${colors.border}` }}
              >
                <p className="text-sm font-medium mb-2" style={{ color: colors.textMuted }}>
                  If the conversation stalls...
                </p>
                <p style={{ color: colors.text }}>{repairScript.ifStuck}</p>
              </div>
            )}

            {/* Remember */}
            <div 
              className="p-5 rounded-2xl text-center"
              style={{ background: `linear-gradient(135deg, ${colors.accentLight}, ${colors.mintLight})` }}
            >
              <p className="text-sm mb-1" style={{ color: colors.accent }}>💜 Remember</p>
              <p className="font-medium" style={{ color: colors.text }}>
                {repairScript.remember}
              </p>
            </div>
          </div>
        )}

        {/* LEARN TAB */}
        {activeTab === 'learn' && (
          <div className="space-y-6">
            <p style={{ color: colors.textMuted }}>
              Tap any card to learn more about communication patterns.
            </p>

            {/* Four Horsemen */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium" style={{ color: colors.textMuted }}>
                THE FOUR HORSEMEN
              </h3>
              {['criticism', 'contempt', 'defensiveness', 'stonewalling'].map(id => (
                <WikiCard key={id} id={id} />
              ))}
            </div>

            {/* Patterns */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium" style={{ color: colors.textMuted }}>
                COMMON PATTERNS
              </h3>
              <WikiCard id="pursue-withdraw" />
            </div>

            {/* Attachment */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium" style={{ color: colors.textMuted }}>
                ATTACHMENT STYLES
              </h3>
              {['anxious', 'avoidant', 'secure', 'disorganized'].map(id => (
                <WikiCard key={id} id={id} />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-8 text-center">
        <p className="text-sm" style={{ color: colors.border }}>
          Built with Gemini 3 Pro • Based on Gottman Method
        </p>
      </footer>
    </div>
  );
}