import React, { useState } from 'react';

// ============================================
// BETWEEN THE LINES - AI+ Communication Insight
// Kaggle Gemini 3 Hackathon Starter
// ============================================

const SAMPLE_CONVERSATION = `Me: Hey, did you get my message about dinner tomorrow?
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
Partner: Fine.`;

// Communication pattern definitions
const PATTERNS = {
  pursueWithdraw: {
    name: "Pursue-Withdraw",
    emoji: "🔄",
    description: "One person pushes for connection while the other pulls away",
    color: "#f59e0b"
  },
  criticism: {
    name: "Criticism vs Complaint",
    emoji: "⚡",
    description: "Attacking character instead of addressing specific behavior",
    color: "#ef4444"
  },
  defensiveness: {
    name: "Defensiveness",
    emoji: "🛡️",
    description: "Deflecting responsibility instead of acknowledging concerns",
    color: "#8b5cf6"
  },
  stonewalling: {
    name: "Stonewalling",
    emoji: "🧱",
    description: "Withdrawing from interaction, shutting down emotionally",
    color: "#6b7280"
  },
  contempt: {
    name: "Contempt",
    emoji: "😤",
    description: "Communicating disgust or superiority",
    color: "#dc2626"
  }
};

const ATTACHMENT_STYLES = {
  anxious: {
    name: "Anxious",
    emoji: "💭",
    traits: ["Seeks reassurance", "Fear of abandonment", "Hypervigilant to cues"],
    color: "#f97316"
  },
  avoidant: {
    name: "Avoidant",
    emoji: "🚪",
    traits: ["Values independence", "Discomfort with closeness", "Minimizes emotions"],
    color: "#3b82f6"
  },
  secure: {
    name: "Secure",
    emoji: "🌱",
    traits: ["Comfortable with intimacy", "Good boundaries", "Direct communication"],
    color: "#22c55e"
  },
  disorganized: {
    name: "Disorganized",
    emoji: "🌀",
    traits: ["Mixed signals", "Push-pull dynamic", "Difficulty regulating"],
    color: "#a855f7"
  }
};

export default function BetweenTheLines() {
  const [conversation, setConversation] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [repairScript, setRepairScript] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('analyze');
  const [roleplayMode, setRoleplayMode] = useState(false);
  const [roleplayMessages, setRoleplayMessages] = useState([]);
  const [userInput, setUserInput] = useState('');

  // ============================================
  // GEMINI API CALL
  // ============================================
  const callGemini = async (prompt, systemPrompt = '') => {
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
  };

  // ============================================
  // ANALYZE CONVERSATION
  // ============================================
  const analyzeConversation = async () => {
    if (!conversation.trim()) return;
    setLoading(true);
    
    const systemPrompt = `You are an expert communication therapist trained in Gottman Method, Emotionally Focused Therapy (EFT), and attachment theory. You analyze conversations to identify communication patterns and provide actionable insights.

Always respond in valid JSON format.`;

    const analysisPrompt = `Analyze this conversation between two people:

<conversation>
${conversation}
</conversation>

Identify:
1. Communication patterns (pursue-withdraw, criticism, defensiveness, stonewalling, contempt)
2. Each person's likely attachment style (anxious, avoidant, secure, disorganized)
3. Key friction points with exact quotes
4. Underlying emotional needs not being expressed
5. The core miscommunication happening

Respond in this exact JSON format:
{
  "patterns": [
    {
      "type": "pursueWithdraw|criticism|defensiveness|stonewalling|contempt",
      "person": "Person 1 or Person 2",
      "evidence": "exact quote from conversation",
      "severity": 1-10
    }
  ],
  "attachmentStyles": {
    "person1": {
      "style": "anxious|avoidant|secure|disorganized",
      "confidence": 0-100,
      "evidence": "behavioral evidence"
    },
    "person2": {
      "style": "anxious|avoidant|secure|disorganized", 
      "confidence": 0-100,
      "evidence": "behavioral evidence"
    }
  },
  "frictionPoints": [
    {
      "quote": "exact exchange",
      "issue": "what went wrong",
      "unmetNeed": "the underlying need"
    }
  ],
  "coreMiscommunication": "one sentence summary of the real issue",
  "healthScore": 1-100,
  "summary": "2-3 sentence plain language summary"
}`;

    try {
      const result = await callGemini(analysisPrompt, systemPrompt);
      // Extract JSON from response
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        setAnalysis(JSON.parse(jsonMatch[0]));
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

    const systemPrompt = `You are a communication coach. Generate practical, emotionally intelligent scripts people can use to repair their conversations. Use "I" statements, validate feelings, and focus on connection over being right.`;

    const repairPrompt = `Based on this conversation analysis:

Patterns detected: ${JSON.stringify(analysis.patterns)}
Core issue: ${analysis.coreMiscommunication}
Person 1 attachment: ${analysis.attachmentStyles?.person1?.style}
Person 2 attachment: ${analysis.attachmentStyles?.person2?.style}

Original conversation:
${conversation}

Generate repair scripts for Person 1 (the one who seems to be pursuing/initiating more). Include:
1. An opening line to restart the conversation
2. Acknowledgment of their own part
3. Expression of underlying need
4. Invitation for partner's perspective
5. A collaborative close

Respond in JSON:
{
  "openingLine": "exact script to say",
  "acknowledgment": "exact script",
  "needExpression": "exact script using I-statements",
  "invitation": "exact script",
  "collaborativeClose": "exact script",
  "doNotSay": ["things to avoid saying"],
  "toneGuidance": "how to deliver this",
  "bestTiming": "when to have this conversation"
}`;

    try {
      const result = await callGemini(repairPrompt, systemPrompt);
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        setRepairScript(JSON.parse(jsonMatch[0]));
      }
    } catch (error) {
      console.error('Repair script error:', error);
    }
    setLoading(false);
  };

  // ============================================
  // ROLEPLAY MODE
  // ============================================
  const startRoleplay = () => {
    setRoleplayMode(true);
    setRoleplayMessages([
      {
        role: 'system',
        content: `I'll play your partner's role so you can practice this repair conversation. I'll respond as someone with a ${analysis?.attachmentStyles?.person2?.style || 'avoidant'} attachment style who initially feels defensive but is open to connection. Start whenever you're ready.`
      }
    ]);
  };

  const sendRoleplayMessage = async () => {
    if (!userInput.trim()) return;
    
    const newMessages = [...roleplayMessages, { role: 'user', content: userInput }];
    setRoleplayMessages(newMessages);
    setUserInput('');
    setLoading(true);

    const systemPrompt = `You are roleplaying as someone's partner to help them practice a repair conversation. 
    
Your character:
- Attachment style: ${analysis?.attachmentStyles?.person2?.style || 'avoidant'}
- You felt hurt/frustrated in the original conversation
- You're initially defensive but genuinely want connection
- Respond realistically - not too easy, not impossible

Keep responses short (1-3 sentences). Show gradual softening if they use good communication. If they slip into old patterns, gently show how that feels.`;

    try {
      const result = await callGemini(
        `Conversation context: ${conversation}\n\nThey just said: "${userInput}"\n\nRespond in character (1-3 sentences):`,
        systemPrompt
      );
      setRoleplayMessages([...newMessages, { role: 'partner', content: result }]);
    } catch (error) {
      console.error('Roleplay error:', error);
    }
    setLoading(false);
  };

  // ============================================
  // UI COMPONENTS
  // ============================================
  const HealthMeter = ({ score }) => (
    <div className="relative h-4 bg-gray-800 rounded-full overflow-hidden">
      <div 
        className="absolute h-full transition-all duration-1000 ease-out rounded-full"
        style={{
          width: `${score}%`,
          background: score > 70 ? '#22c55e' : score > 40 ? '#f59e0b' : '#ef4444'
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center text-xs font-mono text-white">
        {score}/100
      </div>
    </div>
  );

  const PatternBadge = ({ pattern }) => {
    const patternInfo = PATTERNS[pattern.type];
    return (
      <div 
        className="p-4 rounded-xl border-l-4"
        style={{ 
          borderColor: patternInfo?.color,
          background: `${patternInfo?.color}15`
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{patternInfo?.emoji}</span>
          <span className="font-semibold text-white">{patternInfo?.name}</span>
          <span className="ml-auto text-sm px-2 py-1 rounded-full bg-gray-800 text-gray-300">
            Severity: {pattern.severity}/10
          </span>
        </div>
        <p className="text-gray-400 text-sm mb-2">{patternInfo?.description}</p>
        <div className="bg-gray-900 p-3 rounded-lg">
          <p className="text-gray-300 text-sm italic">"{pattern.evidence}"</p>
          <p className="text-gray-500 text-xs mt-1">— {pattern.person}</p>
        </div>
      </div>
    );
  };

  const AttachmentCard = ({ person, data }) => {
    const style = ATTACHMENT_STYLES[data?.style];
    return (
      <div className="bg-gray-900 p-4 rounded-xl">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">{style?.emoji}</span>
          <div>
            <p className="text-gray-400 text-sm">{person}</p>
            <p className="font-semibold text-white">{style?.name} Attachment</p>
          </div>
          <span 
            className="ml-auto text-sm px-2 py-1 rounded-full"
            style={{ background: `${style?.color}30`, color: style?.color }}
          >
            {data?.confidence}% confident
          </span>
        </div>
        <p className="text-gray-400 text-sm">{data?.evidence}</p>
      </div>
    );
  };

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-xl">
            💬
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            Between the Lines
          </h1>
        </div>
        <p className="text-gray-400">Communication therapy insights without the $200/hr</p>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          {['analyze', 'repair', 'practice'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab 
                  ? 'bg-violet-600 text-white' 
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {tab === 'analyze' && '1. Analyze'}
              {tab === 'repair' && '2. Repair Script'}
              {tab === 'practice' && '3. Practice'}
            </button>
          ))}
        </div>

        {/* ANALYZE TAB */}
        {activeTab === 'analyze' && (
          <div className="space-y-6">
            {/* Input */}
            <div className="bg-gray-900 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <label className="text-gray-300 font-medium">Paste your conversation</label>
                <button
                  onClick={() => setConversation(SAMPLE_CONVERSATION)}
                  className="text-sm text-violet-400 hover:text-violet-300"
                >
                  Load example
                </button>
              </div>
              <textarea
                value={conversation}
                onChange={(e) => setConversation(e.target.value)}
                placeholder="Me: Hey, are you okay?&#10;Partner: I'm fine.&#10;Me: You don't seem fine..."
                className="w-full h-48 bg-gray-800 rounded-xl p-4 text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <button
                onClick={analyzeConversation}
                disabled={loading || !conversation.trim()}
                className="mt-4 w-full py-3 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? 'Analyzing...' : 'Analyze Communication Patterns'}
              </button>
            </div>

            {/* Analysis Results */}
            {analysis && (
              <div className="space-y-6 animate-in fade-in duration-500">
                {/* Health Score */}
                <div className="bg-gray-900 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Communication Health Score</h3>
                  <HealthMeter score={analysis.healthScore} />
                  <p className="mt-4 text-gray-400">{analysis.summary}</p>
                </div>

                {/* Core Issue */}
                <div className="bg-gradient-to-r from-violet-900/50 to-fuchsia-900/50 rounded-2xl p-6 border border-violet-500/30">
                  <h3 className="text-lg font-semibold mb-2">🎯 Core Miscommunication</h3>
                  <p className="text-xl text-gray-200">{analysis.coreMiscommunication}</p>
                </div>

                {/* Patterns */}
                <div className="bg-gray-900 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Detected Patterns</h3>
                  <div className="space-y-4">
                    {analysis.patterns?.map((pattern, i) => (
                      <PatternBadge key={i} pattern={pattern} />
                    ))}
                  </div>
                </div>

                {/* Attachment Styles */}
                <div className="bg-gray-900 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Attachment Styles</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <AttachmentCard person="Person 1 (You)" data={analysis.attachmentStyles?.person1} />
                    <AttachmentCard person="Person 2 (Partner)" data={analysis.attachmentStyles?.person2} />
                  </div>
                </div>

                {/* Friction Points */}
                <div className="bg-gray-900 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Friction Points</h3>
                  <div className="space-y-4">
                    {analysis.frictionPoints?.map((point, i) => (
                      <div key={i} className="border-l-2 border-amber-500 pl-4">
                        <p className="text-gray-300 italic mb-2">"{point.quote}"</p>
                        <p className="text-amber-400 text-sm">⚠️ {point.issue}</p>
                        <p className="text-gray-500 text-sm">💭 Unmet need: {point.unmetNeed}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <button
                  onClick={() => { generateRepairScript(); setActiveTab('repair'); }}
                  className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                >
                  Generate Repair Script →
                </button>
              </div>
            )}
          </div>
        )}

        {/* REPAIR TAB */}
        {activeTab === 'repair' && (
          <div className="space-y-6">
            {!repairScript ? (
              <div className="bg-gray-900 rounded-2xl p-12 text-center">
                <p className="text-gray-400 mb-4">Analyze a conversation first to generate repair scripts</p>
                <button
                  onClick={() => setActiveTab('analyze')}
                  className="text-violet-400 hover:text-violet-300"
                >
                  ← Go to Analyze
                </button>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="bg-gradient-to-r from-emerald-900/50 to-teal-900/50 rounded-2xl p-6 border border-emerald-500/30">
                  <h3 className="text-lg font-semibold mb-2">🛠️ Your Repair Toolkit</h3>
                  <p className="text-gray-400">Scripts designed for your specific situation</p>
                </div>

                {/* Scripts */}
                {[
                  { label: '1. Opening Line', key: 'openingLine', emoji: '👋' },
                  { label: '2. Acknowledge Your Part', key: 'acknowledgment', emoji: '🪞' },
                  { label: '3. Express Your Need', key: 'needExpression', emoji: '💚' },
                  { label: '4. Invite Their Perspective', key: 'invitation', emoji: '👂' },
                  { label: '5. Close Collaboratively', key: 'collaborativeClose', emoji: '🤝' },
                ].map(({ label, key, emoji }) => (
                  <div key={key} className="bg-gray-900 rounded-2xl p-6">
                    <h4 className="text-gray-400 text-sm mb-2">{emoji} {label}</h4>
                    <p className="text-lg text-gray-200 leading-relaxed">"{repairScript[key]}"</p>
                  </div>
                ))}

                {/* Guidance */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-900 rounded-2xl p-6">
                    <h4 className="font-semibold mb-3 text-amber-400">⚠️ Avoid Saying</h4>
                    <ul className="space-y-2">
                      {repairScript.doNotSay?.map((item, i) => (
                        <li key={i} className="text-gray-400 text-sm flex items-start gap-2">
                          <span className="text-red-400">✗</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-gray-900 rounded-2xl p-6">
                    <h4 className="font-semibold mb-3 text-emerald-400">💡 Delivery Tips</h4>
                    <p className="text-gray-400 text-sm mb-4">{repairScript.toneGuidance}</p>
                    <h4 className="font-semibold mb-2 text-blue-400">⏰ Best Timing</h4>
                    <p className="text-gray-400 text-sm">{repairScript.bestTiming}</p>
                  </div>
                </div>

                {/* Practice CTA */}
                <button
                  onClick={() => { startRoleplay(); setActiveTab('practice'); }}
                  className="w-full py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                >
                  Practice with AI Partner →
                </button>
              </div>
            )}
          </div>
        )}

        {/* PRACTICE TAB */}
        {activeTab === 'practice' && (
          <div className="space-y-6">
            {!roleplayMode ? (
              <div className="bg-gray-900 rounded-2xl p-12 text-center">
                <p className="text-gray-400 mb-4">Generate a repair script first</p>
                <button
                  onClick={() => setActiveTab('repair')}
                  className="text-violet-400 hover:text-violet-300"
                >
                  ← Go to Repair Script
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-violet-900/50 to-fuchsia-900/50 rounded-2xl p-6 border border-violet-500/30">
                  <h3 className="text-lg font-semibold mb-2">🎭 Practice Mode</h3>
                  <p className="text-gray-400">I'll respond as your partner. Practice the repair conversation.</p>
                </div>

                {/* Chat Messages */}
                <div className="bg-gray-900 rounded-2xl p-6 min-h-[300px] max-h-[400px] overflow-y-auto">
                  {roleplayMessages.map((msg, i) => (
                    <div 
                      key={i} 
                      className={`mb-4 ${msg.role === 'user' ? 'text-right' : ''}`}
                    >
                      <div className={`inline-block max-w-[80%] p-4 rounded-2xl ${
                        msg.role === 'user' 
                          ? 'bg-violet-600 text-white' 
                          : msg.role === 'system'
                          ? 'bg-gray-800 text-gray-400 text-sm'
                          : 'bg-gray-800 text-gray-200'
                      }`}>
                        {msg.role === 'partner' && <span className="text-xs text-gray-500 block mb-1">Partner</span>}
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {loading && (
                    <div className="text-gray-500 text-sm">Partner is typing...</div>
                  )}
                </div>

                {/* Input */}
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendRoleplayMessage()}
                    placeholder="Practice your response..."
                    className="flex-1 bg-gray-800 rounded-xl px-4 py-3 text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                  <button
                    onClick={sendRoleplayMessage}
                    disabled={loading || !userInput.trim()}
                    className="px-6 py-3 bg-violet-600 rounded-xl font-semibold hover:bg-violet-500 transition-colors disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>

                {/* Reference Scripts */}
                {repairScript && (
                  <div className="bg-gray-900/50 rounded-xl p-4">
                    <p className="text-gray-500 text-sm mb-2">💡 Your repair scripts:</p>
                    <div className="text-gray-400 text-sm space-y-1">
                      <p><strong>Opening:</strong> "{repairScript.openingLine}"</p>
                      <p><strong>Acknowledge:</strong> "{repairScript.acknowledgment}"</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto mt-12 text-center text-gray-600 text-sm">
        Built with Gemini 3 Pro for Kaggle Hackathon 2025
      </div>
    </div>
  );
}
