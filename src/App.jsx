import React, { useState, useRef } from 'react';

// ============================================
// BETWEEN THE LINES v2
// AI + Communication Insight
// With Screenshot Support + Wiki Cards
// ============================================

// Wiki data inline (simplified for single-file)
const WIKI = {
  "criticism": { emoji: "⚡", title: "Criticism", tip: "Start with 'I feel...' not 'You are...'" },
  "contempt": { emoji: "😤", title: "Contempt", tip: "Build daily appreciation habits" },
  "defensiveness": { emoji: "🛡️", title: "Defensiveness", tip: "Accept even a small part" },
  "stonewalling": { emoji: "🧱", title: "Stonewalling", tip: "Take a break WITH a return promise" },
  "pursue-withdraw": { emoji: "🔄", title: "Pursue-Withdraw", tip: "Pursuer: soften. Withdrawer: return." },
  "attachment-anxious": { emoji: "💭", title: "Anxious", tip: "They need consistent reassurance" },
  "attachment-avoidant": { emoji: "🚪", title: "Avoidant", tip: "Give space without punishment" },
  "attachment-secure": { emoji: "🌱", title: "Secure", tip: "The goal — can be learned!" },
  "attachment-disorganized": { emoji: "🌀", title: "Disorganized", tip: "Patience + consistency" },
};

export default function BetweenTheLines() {
  // State
  const [inputType, setInputType] = useState('text'); // 'text' | 'image'
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
    
    // Preview
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    
    // Convert to base64 for API
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      setImageData({
        base64,
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  // ============================================
  // API CALL (Works with Gemini API)
  // ============================================
  const callGemini = async (prompt, imageBase64 = null, imageMimeType = null) => {
    const messages = [];
    
    if (imageBase64) {
      // Multimodal: image + text
      messages.push({
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: imageMimeType,
              data: imageBase64
            }
          },
          { type: "text", text: prompt }
        ]
      });
    } else {
      // Text only
      messages.push({ role: "user", content: prompt });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        messages
      })
    });
    
    const data = await response.json();
    return data.content?.[0]?.text || '';
  };

  // ============================================
  // ANALYZE
  // ============================================
  const analyze = async () => {
    setLoading(true);
    
    const basePrompt = `You are an expert communication therapist. Analyze this conversation and identify patterns.

${inputType === 'image' ? `
STEP 1: Extract all text from this screenshot.
- Identify message bubbles and who sent each (left vs right, colors, names)
- Preserve order and emotional content
` : ''}

STEP 2: Analyze for communication patterns.

Respond in JSON only:
{
  "extractedText": "the conversation text (if from image)",
  "healthScore": 1-100,
  "tldr": "One casual sentence summary",
  "coreMiscommunication": "The REAL issue in plain language",
  "patterns": [
    {
      "type": "criticism|contempt|defensiveness|stonewalling|pursue-withdraw",
      "who": "Person 1 or Person 2",
      "quote": "exact words",
      "severity": 1-10,
      "whyItHurts": "simple explanation"
    }
  ],
  "person1Attachment": {
    "style": "anxious|avoidant|secure|disorganized",
    "confidence": 0-100,
    "because": "evidence"
  },
  "person2Attachment": {
    "style": "anxious|avoidant|secure|disorganized", 
    "confidence": 0-100,
    "because": "evidence"
  },
  "frictionMoments": [
    {
      "quote": "the exchange",
      "problem": "what went wrong",
      "needed": "what they actually needed",
      "betterWay": "healthier alternative"
    }
  ],
  "oneThingToTry": "Single actionable tip"
}`;

    const textPrompt = inputType === 'text' 
      ? `${basePrompt}\n\nConversation:\n${conversation}`
      : basePrompt;

    try {
      const result = await callGemini(
        textPrompt,
        inputType === 'image' ? imageData?.base64 : null,
        inputType === 'image' ? imageData?.mimeType : null
      );
      
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        setAnalysis(JSON.parse(jsonMatch[0]));
        setActiveTab('results');
      }
    } catch (error) {
      console.error('Analysis error:', error);
    }
    
    setLoading(false);
  };

  // ============================================
  // GENERATE REPAIR SCRIPT
  // ============================================
  const generateRepair = async () => {
    if (!analysis) return;
    setLoading(true);

    const prompt = `Based on this analysis:
${JSON.stringify(analysis, null, 2)}

Generate a simple repair script. No therapy jargon — just real words anyone can use.

JSON format:
{
  "before": {
    "breathe": "Quick calming tip",
    "remember": "Mindset reminder",
    "when": "Best timing"
  },
  "script": [
    { "step": "Open", "say": "exact words", "why": "why this works" },
    { "step": "Own it", "say": "exact words", "why": "why this works" },
    { "step": "Be real", "say": "exact words", "why": "why this works" },
    { "step": "Ask them", "say": "exact words", "why": "why this works" },
    { "step": "Together", "say": "exact words", "why": "why this works" }
  ],
  "ifDefensive": {
    "theySay": "example response",
    "youSay": "de-escalation"
  },
  "dontSay": ["thing 1", "thing 2"],
  "mantra": "One sentence to remember"
}`;

    try {
      const result = await callGemini(prompt);
      const jsonMatch = result.match(/\{[\s\S]*\}/);
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
  
  const HealthBar = ({ score }) => (
    <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden">
      <div 
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${score}%`,
          background: score > 70 ? '#22c55e' : score > 40 ? '#f59e0b' : '#ef4444'
        }}
      />
    </div>
  );

  const WikiTooltip = ({ id }) => {
    const data = WIKI[id] || WIKI[`attachment-${id}`];
    if (!data) return null;
    
    return (
      <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-800 rounded-lg text-sm">
        <span>{data.emoji}</span>
        <span className="text-gray-300">{data.title}</span>
        <button 
          onClick={() => setExpandedWiki(expandedWiki === id ? null : id)}
          className="text-violet-400 hover:text-violet-300 ml-1"
        >
          ?
        </button>
        {expandedWiki === id && (
          <div className="absolute mt-1 p-3 bg-gray-900 rounded-lg shadow-xl z-10 max-w-xs">
            <p className="text-gray-400 text-sm">💡 {data.tip}</p>
          </div>
        )}
      </div>
    );
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
            💬
          </div>
          <div>
            <h1 className="font-bold text-lg">Between the Lines</h1>
            <p className="text-gray-500 text-sm">Communication insights without the $200/hr</p>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-800">
        <div className="max-w-2xl mx-auto flex">
          {[
            { id: 'input', label: '1. Input' },
            { id: 'results', label: '2. Analysis', disabled: !analysis },
            { id: 'repair', label: '3. Repair', disabled: !repairScript },
            { id: 'learn', label: '📚 Learn' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
              disabled={tab.disabled}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'text-violet-400 border-b-2 border-violet-400' 
                  : tab.disabled 
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="max-w-2xl mx-auto p-6">
        
        {/* INPUT TAB */}
        {activeTab === 'input' && (
          <div className="space-y-6">
            {/* Input type toggle */}
            <div className="flex gap-2 p-1 bg-gray-900 rounded-lg w-fit">
              <button
                onClick={() => setInputType('text')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  inputType === 'text' ? 'bg-violet-600 text-white' : 'text-gray-400'
                }`}
              >
                📝 Paste Text
              </button>
              <button
                onClick={() => setInputType('image')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  inputType === 'image' ? 'bg-violet-600 text-white' : 'text-gray-400'
                }`}
              >
                📸 Upload Screenshot
              </button>
            </div>

            {/* Text input */}
            {inputType === 'text' && (
              <div>
                <textarea
                  value={conversation}
                  onChange={(e) => setConversation(e.target.value)}
                  placeholder="Paste your conversation here...&#10;&#10;Me: Hey, did you get my message?&#10;Partner: Yeah&#10;Me: So... are we going or not?"
                  className="w-full h-64 bg-gray-900 rounded-xl p-4 text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <button
                  onClick={() => setConversation(`Me: Hey, did you get my message about dinner tomorrow?
Partner: Yeah
Me: So... are we going or not?
Partner: I don't know, I'm tired
Me: You're always tired. Can you just give me a straight answer?
Partner: Why are you being like this?
Me: Being like what? I just asked a simple question
Partner: Whatever, fine, we'll go
Me: Forget it. If you don't want to go, just say so
Partner: I said we'll go!
Me: Your tone says otherwise
Partner: I don't have a tone. You're reading into things
Me: See, this is what always happens
Partner: What always happens?
Me: Nothing. Forget I said anything.
Partner: Fine.`)}
                  className="mt-2 text-sm text-violet-400 hover:text-violet-300"
                >
                  Load example conversation
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
                      alt="Conversation screenshot"
                      className="w-full rounded-xl border border-gray-700"
                    />
                    <button
                      onClick={() => {
                        setImagePreview(null);
                        setImageData(null);
                      }}
                      className="absolute top-2 right-2 w-8 h-8 bg-gray-900/80 rounded-full flex items-center justify-center hover:bg-gray-800"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-64 border-2 border-dashed border-gray-700 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-violet-500 transition-colors"
                  >
                    <span className="text-4xl">📸</span>
                    <span className="text-gray-400">Click to upload screenshot</span>
                    <span className="text-gray-600 text-sm">WeChat, iMessage, WhatsApp, etc.</span>
                  </button>
                )}
              </div>
            )}

            {/* Analyze button */}
            <button
              onClick={analyze}
              disabled={loading || (inputType === 'text' ? !conversation.trim() : !imageData)}
              className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Analyzing...' : 'Analyze Conversation'}
            </button>
          </div>
        )}

        {/* RESULTS TAB */}
        {activeTab === 'results' && analysis && (
          <div className="space-y-6">
            {/* Health Score */}
            <div className="bg-gray-900 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-400">Communication Health</span>
                <span className="text-2xl font-bold">{analysis.healthScore}/100</span>
              </div>
              <HealthBar score={analysis.healthScore} />
              <p className="mt-4 text-gray-300">{analysis.tldr}</p>
            </div>

            {/* Core Issue */}
            <div className="bg-gradient-to-r from-violet-900/30 to-fuchsia-900/30 rounded-2xl p-6 border border-violet-500/30">
              <h3 className="text-sm text-violet-400 mb-2">🎯 The Real Issue</h3>
              <p className="text-lg">{analysis.coreMiscommunication}</p>
            </div>

            {/* Patterns */}
            <div className="bg-gray-900 rounded-2xl p-6">
              <h3 className="font-semibold mb-4">Patterns Detected</h3>
              <div className="space-y-4">
                {analysis.patterns?.map((pattern, i) => (
                  <div key={i} className="border-l-2 border-amber-500 pl-4">
                    <div className="flex items-center gap-2 mb-1">
                      <WikiTooltip id={pattern.type} />
                      <span className="text-gray-500 text-sm">• {pattern.who}</span>
                    </div>
                    <p className="text-gray-400 italic">"{pattern.quote}"</p>
                    <p className="text-gray-500 text-sm mt-1">{pattern.whyItHurts}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Attachment Styles */}
            <div className="bg-gray-900 rounded-2xl p-6">
              <h3 className="font-semibold mb-4">Attachment Styles</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-800 rounded-xl">
                  <p className="text-gray-500 text-sm mb-1">Person 1 (You)</p>
                  <WikiTooltip id={analysis.person1Attachment?.style} />
                  <p className="text-gray-500 text-sm mt-2">{analysis.person1Attachment?.because}</p>
                </div>
                <div className="p-4 bg-gray-800 rounded-xl">
                  <p className="text-gray-500 text-sm mb-1">Person 2</p>
                  <WikiTooltip id={analysis.person2Attachment?.style} />
                  <p className="text-gray-500 text-sm mt-2">{analysis.person2Attachment?.because}</p>
                </div>
              </div>
            </div>

            {/* Quick Win */}
            <div className="bg-emerald-900/30 rounded-2xl p-6 border border-emerald-500/30">
              <h3 className="text-sm text-emerald-400 mb-2">💡 One Thing to Try</h3>
              <p className="text-lg">{analysis.oneThingToTry}</p>
            </div>

            {/* CTA */}
            <button
              onClick={generateRepair}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Get Repair Script →'}
            </button>
          </div>
        )}

        {/* REPAIR TAB */}
        {activeTab === 'repair' && repairScript && (
          <div className="space-y-6">
            {/* Before */}
            <div className="bg-gray-900 rounded-2xl p-6">
              <h3 className="font-semibold mb-4">Before You Talk</h3>
              <div className="space-y-3">
                <p><span className="text-violet-400">🫁 Breathe:</span> {repairScript.before?.breathe}</p>
                <p><span className="text-violet-400">🧠 Remember:</span> {repairScript.before?.remember}</p>
                <p><span className="text-violet-400">⏰ When:</span> {repairScript.before?.when}</p>
              </div>
            </div>

            {/* Script */}
            <div className="bg-gray-900 rounded-2xl p-6">
              <h3 className="font-semibold mb-4">Your Script</h3>
              <div className="space-y-4">
                {repairScript.script?.map((item, i) => (
                  <div key={i} className="border-l-2 border-violet-500 pl-4">
                    <p className="text-sm text-violet-400 mb-1">{item.step}</p>
                    <p className="text-lg text-gray-200">"{item.say}"</p>
                    <p className="text-gray-500 text-sm mt-1">↳ {item.why}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* If Defensive */}
            {repairScript.ifDefensive && (
              <div className="bg-amber-900/20 rounded-2xl p-6 border border-amber-500/30">
                <h3 className="text-amber-400 font-semibold mb-3">If They Get Defensive</h3>
                <p className="text-gray-400 mb-2">They might say: "{repairScript.ifDefensive.theySay}"</p>
                <p className="text-gray-200">You say: "{repairScript.ifDefensive.youSay}"</p>
              </div>
            )}

            {/* Don't Say */}
            <div className="bg-red-900/20 rounded-2xl p-6 border border-red-500/30">
              <h3 className="text-red-400 font-semibold mb-3">⚠️ Avoid Saying</h3>
              <ul className="space-y-2">
                {repairScript.dontSay?.map((item, i) => (
                  <li key={i} className="text-gray-400 flex items-start gap-2">
                    <span className="text-red-400">✗</span> {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Mantra */}
            <div className="bg-gradient-to-r from-violet-900/30 to-fuchsia-900/30 rounded-2xl p-6 text-center">
              <p className="text-gray-500 text-sm mb-2">Remember</p>
              <p className="text-xl font-medium">{repairScript.mantra}</p>
            </div>
          </div>
        )}

        {/* LEARN TAB */}
        {activeTab === 'learn' && (
          <div className="space-y-6">
            <p className="text-gray-400">Tap any card to learn more about the science behind healthy communication.</p>
            
            {/* Four Horsemen */}
            <div>
              <h3 className="text-sm text-gray-500 uppercase tracking-wide mb-3">The Four Horsemen (Gottman)</h3>
              <div className="space-y-2">
                {['criticism', 'contempt', 'defensiveness', 'stonewalling'].map(id => (
                  <button
                    key={id}
                    onClick={() => setExpandedWiki(expandedWiki === id ? null : id)}
                    className="w-full text-left p-4 bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{WIKI[id].emoji}</span>
                      <div>
                        <p className="font-medium">{WIKI[id].title}</p>
                        {expandedWiki === id && (
                          <p className="text-gray-400 text-sm mt-1">💡 {WIKI[id].tip}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Patterns */}
            <div>
              <h3 className="text-sm text-gray-500 uppercase tracking-wide mb-3">Common Patterns</h3>
              <button
                onClick={() => setExpandedWiki(expandedWiki === 'pursue-withdraw' ? null : 'pursue-withdraw')}
                className="w-full text-left p-4 bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{WIKI['pursue-withdraw'].emoji}</span>
                  <div>
                    <p className="font-medium">{WIKI['pursue-withdraw'].title}</p>
                    {expandedWiki === 'pursue-withdraw' && (
                      <p className="text-gray-400 text-sm mt-1">💡 {WIKI['pursue-withdraw'].tip}</p>
                    )}
                  </div>
                </div>
              </button>
            </div>

            {/* Attachment */}
            <div>
              <h3 className="text-sm text-gray-500 uppercase tracking-wide mb-3">Attachment Styles</h3>
              <div className="space-y-2">
                {['attachment-anxious', 'attachment-avoidant', 'attachment-secure', 'attachment-disorganized'].map(id => (
                  <button
                    key={id}
                    onClick={() => setExpandedWiki(expandedWiki === id ? null : id)}
                    className="w-full text-left p-4 bg-gray-900 rounded-xl hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{WIKI[id].emoji}</span>
                      <div>
                        <p className="font-medium">{WIKI[id].title}</p>
                        {expandedWiki === id && (
                          <p className="text-gray-400 text-sm mt-1">💡 {WIKI[id].tip}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12 py-6 text-center text-gray-600 text-sm">
        Built with Gemini 3 Pro • Based on Gottman Method & Attachment Theory
      </footer>
    </div>
  );
}