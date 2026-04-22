import { useState } from "react";

const FONT = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');`;

const STYLE = `
  ${FONT}
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; background: #f7f5f0; color: #1a1a1a; }
  :root {
    --navy: #0f1f3d;
    --gold: #c9a84c;
    --gold-light: #e8c96a;
    --cream: #f7f5f0;
    --white: #ffffff;
    --slate: #4a5568;
    --border: #e2ddd6;
    --red: #c0392b;
    --green: #1a7a4a;
    --blue: #1a4a8a;
  }
`;

const categories = ["All Topics", "Politics & Society", "Science & Tech", "Philosophy & Ethics", "Economics", "Culture & Arts", "Environment"];

const mockForums = [
  { id: 1, title: "Should AI be regulated by governments?", category: "Science & Tech", author: "TechDebater", replies: 47, votes: 134, hot: true, side_a: "Pro-Regulation", side_b: "Anti-Regulation", time: "2h ago" },
  { id: 2, title: "Universal Basic Income: Solution or Problem?", category: "Economics", author: "EconWatch", replies: 89, votes: 312, hot: true, side_a: "For UBI", side_b: "Against UBI", time: "4h ago" },
  { id: 3, title: "Is social media doing more harm than good?", category: "Culture & Arts", author: "MediaCritic", replies: 61, votes: 198, hot: false, side_a: "More Harm", side_b: "More Good", time: "6h ago" },
  { id: 4, title: "Nuclear energy: essential for a green future?", category: "Environment", author: "GreenFuture", replies: 34, votes: 87, hot: false, side_a: "Pro-Nuclear", side_b: "Anti-Nuclear", time: "12h ago" },
  { id: 5, title: "Should voting be mandatory?", category: "Politics & Society", author: "CivicMind", replies: 72, votes: 245, hot: true, side_a: "Mandatory", side_b: "Voluntary", time: "1d ago" },
  { id: 6, title: "Is free will an illusion?", category: "Philosophy & Ethics", author: "PhilosoFred", replies: 103, votes: 411, hot: false, side_a: "Illusion", side_b: "Real", time: "2d ago" },
];

const mockDebates = [
  { id: 1, title: "AI Regulation Showdown", user1: "TechHawk", user2: "OpenSourceAlex", topic: "AI should be strictly regulated", status: "live", round: 2, maxRounds: 4, votes1: 67, votes2: 58 },
  { id: 2, title: "Climate Policy Clash", user1: "GreenMind99", user2: "EconFirst", topic: "Carbon tax is the best climate solution", status: "live", round: 3, maxRounds: 4, votes1: 112, votes2: 89 },
  { id: 3, title: "Philosophy Duel", user1: "PhilosoFred", user2: "RationalReed", topic: "Consciousness is purely physical", status: "waiting", round: 0, maxRounds: 4, votes1: 0, votes2: 0 },
  { id: 4, title: "Democracy Debate", user1: "CivicMind", user2: "LibertarianLou", topic: "Direct democracy is better than representative", status: "completed", round: 4, maxRounds: 4, votes1: 88, votes2: 144 },
];

const mockUsers = [
  { rank: 1, name: "PhilosoFred", wins: 47, losses: 8, rating: 2341, badge: "Grand Orator", avatar: "PF" },
  { rank: 2, name: "TechHawk", wins: 39, losses: 11, rating: 2198, badge: "Logic Master", avatar: "TH" },
  { rank: 3, name: "CivicMind", wins: 35, losses: 14, rating: 2044, badge: "Policy Expert", avatar: "CM" },
  { rank: 4, name: "GreenMind99", wins: 31, losses: 12, rating: 1987, badge: "Rhetorician", avatar: "GM" },
  { rank: 5, name: "EconWatch", wins: 28, losses: 15, rating: 1876, badge: "Debater", avatar: "EW" },
  { rank: 6, name: "RationalReed", wins: 24, losses: 18, rating: 1754, badge: "Debater", avatar: "RR" },
  { rank: 7, name: "OpenSourceAlex", wins: 20, losses: 20, rating: 1600, badge: "Novice", avatar: "OA" },
  { rank: 8, name: "LibertarianLou", wins: 17, losses: 22, rating: 1512, badge: "Novice", avatar: "LL" },
];

const debateMessages = [
  { user: "TechHawk", side: "pro", text: "AI regulation is not only necessary but urgent. The unchecked development of artificial intelligence poses systemic risks to democratic institutions, labor markets, and individual privacy. We've seen how social media algorithms—left largely unregulated—have deepened polarization. The same pattern will repeat with AI at a far larger scale.", time: "Round 1" },
  { user: "OpenSourceAlex", side: "con", text: "The premise assumes regulators understand AI better than the engineers building it—they don't. Heavy-handed regulation will not prevent harm; it will entrench incumbents, stifle open-source innovation, and drive development to jurisdictions with no oversight at all. The solution is transparency standards, not government control.", time: "Round 1" },
  { user: "TechHawk", side: "pro", text: "Transparency standards without enforcement mechanisms are just PR. OpenSourceAlex's argument assumes good faith from corporations that have consistently prioritized profit over safety. The EU AI Act proves that thoughtful regulation can coexist with innovation—the sky did not fall.", time: "Round 2" },
  { user: "OpenSourceAlex", side: "con", text: "The EU AI Act is still in implementation. Early evidence shows compliance costs disproportionately burden small developers and researchers. Meanwhile, Big Tech has entire legal teams to navigate these rules—giving them a structural advantage. Regulation here paradoxically benefits the very players you claim to constrain.", time: "Round 2" },
];

const badgeColors = {
  "Grand Orator": "#c9a84c",
  "Logic Master": "#7c6fc9",
  "Policy Expert": "#1a7a4a",
  "Rhetorician": "#1a4a8a",
  "Debater": "#4a5568",
  "Novice": "#a0aec0",
};

export default function App() {
  const [page, setPage] = useState("home");
  const [activeCategory, setActiveCategory] = useState("All Topics");
  const [activeDebate, setActiveDebate] = useState(null);
  const [activeForum, setActiveForum] = useState(null);
  const [newReply, setNewReply] = useState("");
  const [debateMessages2, setDebateMessages2] = useState(debateMessages);
  const [chatInput, setChatInput] = useState("");
  const [votedForum, setVotedForum] = useState({});
  const [debate1v1Votes, setDebate1v1Votes] = useState({});
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [newTopicCategory, setNewTopicCategory] = useState("Politics & Society");
  const [newTopicSideA, setNewTopicSideA] = useState("");
  const [newTopicSideB, setNewTopicSideB] = useState("");
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [forumsState, setForumsState] = useState(mockForums);
  const [forumReplies, setForumReplies] = useState({});

  const filteredForums = activeCategory === "All Topics"
    ? forumsState
    : forumsState.filter(f => f.category === activeCategory);

  const handleForumVote = (id, dir) => {
    if (votedForum[id]) return;
    setForumsState(prev => prev.map(f => f.id === id ? { ...f, votes: f.votes + (dir === "up" ? 1 : -1) } : f));
    setVotedForum(prev => ({ ...prev, [id]: dir }));
  };

  const handleDebateVote = (debateId, side) => {
    if (debate1v1Votes[debateId]) return;
    setDebate1v1Votes(prev => ({ ...prev, [debateId]: side }));
  };

  const handleSendChat = () => {
    if (!chatInput.trim()) return;
    setDebateMessages2(prev => [...prev, {
      user: "You",
      side: "pro",
      text: chatInput,
      time: `Round ${activeDebate?.round || 2}`
    }]);
    setChatInput("");
  };

  const handleAddReply = () => {
    if (!newReply.trim() || !activeForum) return;
    const id = activeForum.id;
    setForumReplies(prev => ({
      ...prev,
      [id]: [...(prev[id] || []), { user: "You", text: newReply, time: "Just now", likes: 0 }]
    }));
    setForumsState(prev => prev.map(f => f.id === id ? { ...f, replies: f.replies + 1 } : f));
    setNewReply("");
  };

  const handleCreateTopic = () => {
    if (!newTopicTitle.trim()) return;
    const newForum = {
      id: forumsState.length + 1,
      title: newTopicTitle,
      category: newTopicCategory,
      author: "You",
      replies: 0,
      votes: 0,
      hot: false,
      side_a: newTopicSideA || "Side A",
      side_b: newTopicSideB || "Side B",
      time: "Just now"
    };
    setForumsState(prev => [newForum, ...prev]);
    setNewTopicTitle(""); setNewTopicSideA(""); setNewTopicSideB("");
    setShowNewTopic(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)", fontFamily: "'DM Sans', sans-serif" }}>
      <style>{STYLE}</style>

      {/* NAV */}
      <nav style={{ background: "var(--navy)", borderBottom: "3px solid var(--gold)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => setPage("home")}>
            <div style={{ width: 36, height: 36, background: "var(--gold)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display', serif", fontWeight: 900, color: "var(--navy)", fontSize: 18 }}>D</div>
            <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, color: "white", fontSize: 22, letterSpacing: "-0.5px" }}>DebateArena</span>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {[["home", "Home"], ["forums", "Forums"], ["debates", "1v1 Debates"], ["leaderboard", "Rankings"]].map(([p, label]) => (
              <button key={p} onClick={() => { setPage(p); setActiveForum(null); setActiveDebate(null); }} style={{
                background: page === p ? "var(--gold)" : "transparent",
                color: page === p ? "var(--navy)" : "rgba(255,255,255,0.75)",
                border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: 600, fontSize: 14,
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif", transition: "all 0.2s"
              }}>{label}</button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--navy)", fontSize: 14 }}>YO</div>
            <span style={{ color: "white", fontSize: 14, fontWeight: 500 }}>You</span>
          </div>
        </div>
      </nav>

      {/* HOME */}
      {page === "home" && (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ display: "inline-block", background: "var(--navy)", color: "var(--gold)", fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", padding: "6px 16px", borderRadius: 20, marginBottom: 20 }}>The Premier Debate Platform</div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 64, fontWeight: 900, color: "var(--navy)", lineHeight: 1.1, marginBottom: 20 }}>Where Ideas<br /><span style={{ color: "var(--gold)" }}>Compete.</span></h1>
            <p style={{ fontSize: 18, color: "var(--slate)", maxWidth: 560, margin: "0 auto 36px", lineHeight: 1.7 }}>Engage in structured debates, challenge ideas in public forums, and climb the rankings as you sharpen your argumentative edge.</p>
            <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
              <button onClick={() => setPage("debates")} style={{ background: "var(--navy)", color: "white", border: "none", padding: "14px 32px", borderRadius: 8, fontWeight: 700, fontSize: 16, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Start a Debate</button>
              <button onClick={() => setPage("forums")} style={{ background: "white", color: "var(--navy)", border: "2px solid var(--navy)", padding: "14px 32px", borderRadius: 8, fontWeight: 700, fontSize: 16, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Browse Forums</button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginBottom: 64 }}>
            {[
              { icon: "⚡", label: "Live Debates", value: "12", desc: "Active 1v1 debates happening now" },
              { icon: "💬", label: "Forum Posts", value: "4,218", desc: "Topics discussed this month" },
              { icon: "🏆", label: "Ranked Debaters", value: "1,847", desc: "Members with verified ratings" },
            ].map(s => (
              <div key={s.label} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 12, padding: 28, textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, fontWeight: 900, color: "var(--navy)" }}>{s.value}</div>
                <div style={{ fontWeight: 700, color: "var(--navy)", marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 13, color: "var(--slate)" }}>{s.desc}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 32 }}>
            <div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: "var(--navy)", marginBottom: 20 }}>🔥 Hot Debates</h2>
              {forumsState.filter(f => f.hot).slice(0, 3).map(f => (
                <div key={f.id} onClick={() => { setActiveForum(f); setPage("forums"); }} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 10, padding: "18px 20px", marginBottom: 12, cursor: "pointer", transition: "box-shadow 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: 1 }}>{f.category}</span>
                      <div style={{ fontWeight: 600, color: "var(--navy)", marginTop: 4, fontSize: 15 }}>{f.title}</div>
                    </div>
                    <span style={{ background: "#fff3e0", color: "#e65100", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, whiteSpace: "nowrap", marginLeft: 12 }}>🔥 Hot</span>
                  </div>
                  <div style={{ display: "flex", gap: 16, marginTop: 10, fontSize: 13, color: "var(--slate)" }}>
                    <span>💬 {f.replies} replies</span><span>▲ {f.votes} votes</span><span>{f.time}</span>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: "var(--navy)", marginBottom: 20 }}>🏅 Top Debaters</h2>
              {mockUsers.slice(0, 5).map(u => (
                <div key={u.name} style={{ display: "flex", alignItems: "center", gap: 14, background: "white", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px", marginBottom: 10 }}>
                  <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 900, color: u.rank <= 3 ? "var(--gold)" : "var(--slate)", minWidth: 24 }}>#{u.rank}</span>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 12 }}>{u.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: "var(--navy)", fontSize: 14 }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: badgeColors[u.badge] || "#666", fontWeight: 700 }}>{u.badge}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: 700, color: "var(--navy)", fontSize: 15 }}>{u.rating}</div>
                    <div style={{ fontSize: 11, color: "var(--slate)" }}>{u.wins}W {u.losses}L</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FORUMS */}
      {page === "forums" && !activeForum && (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
            <div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, color: "var(--navy)" }}>Discussion Forums</h1>
              <p style={{ color: "var(--slate)", marginTop: 6 }}>Join the conversation on today's most contested topics</p>
            </div>
            <button onClick={() => setShowNewTopic(true)} style={{ background: "var(--navy)", color: "white", border: "none", padding: "12px 24px", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>+ New Topic</button>
          </div>

          {showNewTopic && (
            <div style={{ background: "white", border: "2px solid var(--gold)", borderRadius: 12, padding: 28, marginBottom: 28 }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", color: "var(--navy)", marginBottom: 20, fontSize: 20 }}>Create New Topic</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <input value={newTopicTitle} onChange={e => setNewTopicTitle(e.target.value)} placeholder="Topic title / debate question" style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", fontSize: 14, fontFamily: "'DM Sans', sans-serif", gridColumn: "1 / -1" }} />
                <select value={newTopicCategory} onChange={e => setNewTopicCategory(e.target.value)} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>
                  {categories.filter(c => c !== "All Topics").map(c => <option key={c}>{c}</option>)}
                </select>
                <div style={{ display: "flex", gap: 10 }}>
                  <input value={newTopicSideA} onChange={e => setNewTopicSideA(e.target.value)} placeholder="Side A (e.g. For)" style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", fontSize: 14, fontFamily: "'DM Sans', sans-serif", flex: 1 }} />
                  <input value={newTopicSideB} onChange={e => setNewTopicSideB(e.target.value)} placeholder="Side B (e.g. Against)" style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", fontSize: 14, fontFamily: "'DM Sans', sans-serif", flex: 1 }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={handleCreateTopic} style={{ background: "var(--navy)", color: "white", border: "none", padding: "10px 24px", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Create Topic</button>
                <button onClick={() => setShowNewTopic(false)} style={{ background: "transparent", color: "var(--slate)", border: "1px solid var(--border)", padding: "10px 20px", borderRadius: 8, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Cancel</button>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
            {categories.map(c => (
              <button key={c} onClick={() => setActiveCategory(c)} style={{
                background: activeCategory === c ? "var(--navy)" : "white",
                color: activeCategory === c ? "white" : "var(--slate)",
                border: "1px solid " + (activeCategory === c ? "var(--navy)" : "var(--border)"),
                padding: "8px 18px", borderRadius: 20, fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif"
              }}>{c}</button>
            ))}
          </div>

          <div style={{ display: "grid", gap: 14 }}>
            {filteredForums.map(f => (
              <div key={f.id} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 24px", display: "flex", alignItems: "center", gap: 20, cursor: "pointer" }}
                onClick={() => setActiveForum(f)}
                onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.07)"}
                onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 44 }}>
                  <button onClick={e => { e.stopPropagation(); handleForumVote(f.id, "up"); }} style={{ background: votedForum[f.id] === "up" ? "var(--navy)" : "transparent", color: votedForum[f.id] === "up" ? "white" : "var(--slate)", border: "1px solid var(--border)", borderRadius: 6, width: 32, height: 28, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>▲</button>
                  <span style={{ fontWeight: 700, color: "var(--navy)", fontSize: 15 }}>{f.votes}</span>
                  <button onClick={e => { e.stopPropagation(); handleForumVote(f.id, "down"); }} style={{ background: votedForum[f.id] === "down" ? "#c0392b" : "transparent", color: votedForum[f.id] === "down" ? "white" : "var(--slate)", border: "1px solid var(--border)", borderRadius: 6, width: 32, height: 28, cursor: "pointer", fontWeight: 700, fontSize: 13 }}>▼</button>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: 1 }}>{f.category}</span>
                    {f.hot && <span style={{ background: "#fff3e0", color: "#e65100", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20 }}>🔥 Hot</span>}
                  </div>
                  <div style={{ fontWeight: 700, color: "var(--navy)", fontSize: 16, marginBottom: 8 }}>{f.title}</div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ background: "#e8f4fd", color: "var(--blue)", fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>{f.side_a}</span>
                    <span style={{ color: "var(--slate)", fontSize: 12, fontWeight: 700 }}>vs</span>
                    <span style={{ background: "#fdecea", color: "var(--red)", fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>{f.side_b}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right", minWidth: 90 }}>
                  <div style={{ fontSize: 13, color: "var(--slate)" }}>💬 {f.replies} replies</div>
                  <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>by {f.author}</div>
                  <div style={{ fontSize: 12, color: "#aaa" }}>{f.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FORUM DETAIL */}
      {page === "forums" && activeForum && (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
          <button onClick={() => setActiveForum(null)} style={{ background: "transparent", border: "1px solid var(--border)", padding: "8px 18px", borderRadius: 8, cursor: "pointer", marginBottom: 24, color: "var(--slate)", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>← Back to Forums</button>
          <div style={{ background: "var(--navy)", borderRadius: 14, padding: 32, marginBottom: 28, color: "white" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: 1 }}>{activeForum.category}</span>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, marginTop: 8, marginBottom: 16 }}>{activeForum.title}</h1>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ background: "rgba(255,255,255,0.1)", color: "#93c5fd", fontSize: 13, fontWeight: 600, padding: "6px 16px", borderRadius: 20 }}>🔵 {activeForum.side_a}</span>
              <span style={{ fontWeight: 700, fontSize: 16 }}>vs</span>
              <span style={{ background: "rgba(255,255,255,0.1)", color: "#fca5a5", fontSize: 13, fontWeight: 600, padding: "6px 16px", borderRadius: 20 }}>🔴 {activeForum.side_b}</span>
              <span style={{ marginLeft: "auto", fontSize: 13, color: "rgba(255,255,255,0.6)" }}>Started by {activeForum.author} · {activeForum.time}</span>
            </div>
          </div>

          <div style={{ display: "grid", gap: 16, marginBottom: 28 }}>
            {(forumReplies[activeForum.id] ? [] : [
              { user: activeForum.author, text: `Opening the discussion on: "${activeForum.title}". I believe this is one of the most important debates of our time. Looking forward to hearing arguments from both sides. What's your take?`, time: activeForum.time, likes: 12, side: activeForum.side_a },
              { user: "CivicMind", text: `Great topic. From my perspective, the ${activeForum.side_a} side has far more compelling evidence. The empirical data supports this clearly when you look at comparable case studies.`, time: "1h ago", likes: 8, side: activeForum.side_a },
              { user: "RationalReed", text: `I respectfully disagree. The ${activeForum.side_b} argument is historically more defensible. The framing here ignores crucial structural factors that would change the analysis entirely.`, time: "45m ago", likes: 5, side: activeForum.side_b },
            ]).concat(forumReplies[activeForum.id] || []).map((r, i) => (
              <div key={i} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 12 }}>{r.user.slice(0, 2).toUpperCase()}</div>
                  <div>
                    <span style={{ fontWeight: 700, color: "var(--navy)" }}>{r.user}</span>
                    <span style={{ fontSize: 12, color: "var(--slate)", marginLeft: 10 }}>{r.time}</span>
                  </div>
                  {r.side && <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 700, color: "var(--blue)", background: "#e8f4fd", padding: "3px 10px", borderRadius: 20 }}>{r.side}</span>}
                </div>
                <p style={{ color: "#333", lineHeight: 1.65, fontSize: 15 }}>{r.text}</p>
                <div style={{ marginTop: 12, display: "flex", gap: 16, fontSize: 13, color: "var(--slate)" }}>
                  <span style={{ cursor: "pointer" }}>👍 {r.likes}</span>
                  <span style={{ cursor: "pointer" }}>↩ Reply</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
            <textarea value={newReply} onChange={e => setNewReply(e.target.value)} placeholder="Add your argument to this debate..." rows={4} style={{ width: "100%", border: "1px solid var(--border)", borderRadius: 8, padding: 14, fontSize: 15, resize: "vertical", fontFamily: "'DM Sans', sans-serif" }} />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
              <button onClick={handleAddReply} style={{ background: "var(--navy)", color: "white", border: "none", padding: "10px 24px", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>Post Reply</button>
            </div>
          </div>
        </div>
      )}

      {/* 1V1 DEBATES */}
      {page === "debates" && !activeDebate && (
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
            <div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, color: "var(--navy)" }}>1v1 Debate Rooms</h1>
              <p style={{ color: "var(--slate)", marginTop: 6 }}>Structured head-to-head debates with audience voting</p>
            </div>
            <button style={{ background: "var(--gold)", color: "var(--navy)", border: "none", padding: "12px 24px", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>⚡ Challenge Someone</button>
          </div>

          <div style={{ display: "grid", gap: 20 }}>
            {mockDebates.map(d => {
              const total = d.votes1 + d.votes2 || 1;
              const pct1 = Math.round(d.votes1 / total * 100);
              const myVote = debate1v1Votes[d.id];
              return (
                <div key={d.id} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
                  <div style={{ padding: "20px 28px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                      <span style={{ background: d.status === "live" ? "#dcfce7" : d.status === "waiting" ? "#fef9c3" : "#f1f5f9", color: d.status === "live" ? "var(--green)" : d.status === "waiting" ? "#b45309" : "var(--slate)", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        {d.status === "live" ? "🔴 Live" : d.status === "waiting" ? "⏳ Waiting" : "✓ Completed"}
                      </span>
                      <span style={{ fontSize: 13, color: "var(--slate)" }}>Round {d.round}/{d.maxRounds}</span>
                      <span style={{ fontWeight: 700, color: "var(--navy)", flex: 1, textAlign: "center", fontSize: 15 }}>"{d.topic}"</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 1fr", gap: 16, alignItems: "center" }}>
                      <div style={{ background: "#e8f4fd", borderRadius: 10, padding: 16, textAlign: "center" }}>
                        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, margin: "0 auto 8px" }}>{d.user1.slice(0, 2).toUpperCase()}</div>
                        <div style={{ fontWeight: 700, color: "var(--navy)" }}>{d.user1}</div>
                        <div style={{ fontSize: 13, color: "var(--blue)", marginTop: 4, fontWeight: 600 }}>PRO</div>
                      </div>
                      <div style={{ textAlign: "center", fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: "var(--gold)" }}>VS</div>
                      <div style={{ background: "#fdecea", borderRadius: 10, padding: 16, textAlign: "center" }}>
                        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--red)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, margin: "0 auto 8px" }}>{d.user2.slice(0, 2).toUpperCase()}</div>
                        <div style={{ fontWeight: 700, color: "var(--navy)" }}>{d.user2}</div>
                        <div style={{ fontSize: 13, color: "var(--red)", marginTop: 4, fontWeight: 600 }}>CON</div>
                      </div>
                    </div>
                    {d.status !== "waiting" && (
                      <div style={{ marginTop: 18 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13, fontWeight: 600 }}>
                          <span style={{ color: "var(--blue)" }}>{d.user1}: {pct1}%</span>
                          <span style={{ color: "var(--red)" }}>{d.user2}: {100 - pct1}%</span>
                        </div>
                        <div style={{ height: 8, borderRadius: 4, background: "#fdecea", overflow: "hidden" }}>
                          <div style={{ width: `${pct1}%`, height: "100%", background: "var(--blue)", borderRadius: 4, transition: "width 0.5s" }} />
                        </div>
                        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                          <button onClick={() => handleDebateVote(d.id, "user1")} disabled={!!myVote || d.status === "waiting"} style={{ flex: 1, background: myVote === "user1" ? "var(--blue)" : "white", color: myVote === "user1" ? "white" : "var(--blue)", border: "2px solid var(--blue)", borderRadius: 8, padding: "9px 0", fontWeight: 700, cursor: myVote ? "default" : "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
                            {myVote === "user1" ? "✓ Voted" : `Vote for ${d.user1}`}
                          </button>
                          <button onClick={() => handleDebateVote(d.id, "user2")} disabled={!!myVote || d.status === "waiting"} style={{ flex: 1, background: myVote === "user2" ? "var(--red)" : "white", color: myVote === "user2" ? "white" : "var(--red)", border: "2px solid var(--red)", borderRadius: 8, padding: "9px 0", fontWeight: 700, cursor: myVote ? "default" : "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
                            {myVote === "user2" ? "✓ Voted" : `Vote for ${d.user2}`}
                          </button>
                          {d.status === "live" && <button onClick={() => setActiveDebate(d)} style={{ flex: 1, background: "var(--navy)", color: "white", border: "none", borderRadius: 8, padding: "9px 0", fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>Watch Live →</button>}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DEBATE ROOM */}
      {page === "debates" && activeDebate && (
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px" }}>
          <button onClick={() => setActiveDebate(null)} style={{ background: "transparent", border: "1px solid var(--border)", padding: "8px 18px", borderRadius: 8, cursor: "pointer", marginBottom: 24, color: "var(--slate)", fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>← Back to Debates</button>
          <div style={{ background: "var(--navy)", borderRadius: 14, padding: 28, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ background: "#dc2626", color: "white", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, marginBottom: 10, display: "inline-block" }}>🔴 LIVE</span>
              <h2 style={{ fontFamily: "'Playfair Display', serif", color: "white", fontSize: 24 }}>"{activeDebate.topic}"</h2>
            </div>
            <div style={{ textAlign: "right", color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
              <div style={{ color: "var(--gold)", fontWeight: 700, fontSize: 18 }}>Round {activeDebate.round}/{activeDebate.maxRounds}</div>
              <div>Audience: 247 watching</div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
            {[{ user: activeDebate.user1, side: "PRO", color: "var(--blue)", bg: "#e8f4fd" }, { user: activeDebate.user2, side: "CON", color: "var(--red)", bg: "#fdecea" }].map(p => (
              <div key={p.user} style={{ background: p.bg, borderRadius: 12, padding: 20, textAlign: "center" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: p.color, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 800, fontSize: 16, margin: "0 auto 10px" }}>{p.user.slice(0, 2).toUpperCase()}</div>
                <div style={{ fontWeight: 700, color: "var(--navy)", fontSize: 16 }}>{p.user}</div>
                <div style={{ color: p.color, fontWeight: 700, fontSize: 13 }}>{p.side}</div>
              </div>
            ))}
          </div>

          <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, marginBottom: 20, overflow: "hidden" }}>
            <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", fontWeight: 700, color: "var(--navy)", background: "#fafafa" }}>Debate Transcript</div>
            <div style={{ maxHeight: 380, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
              {debateMessages2.map((m, i) => (
                <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: m.side === "pro" ? "var(--blue)" : m.user === "You" ? "var(--gold)" : "var(--red)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{m.user.slice(0, 2).toUpperCase()}</div>
                  <div style={{ background: "#f8f9fa", borderRadius: 10, padding: "12px 16px", flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, color: "var(--navy)", fontSize: 14 }}>{m.user}</span>
                      <span style={{ fontSize: 11, color: "var(--slate)" }}>{m.time}</span>
                    </div>
                    <p style={{ color: "#333", lineHeight: 1.6, fontSize: 14 }}>{m.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 12, padding: 16, display: "flex", gap: 12 }}>
            <textarea value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="Submit your argument for this round..." rows={2} style={{ flex: 1, border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", resize: "none", fontFamily: "'DM Sans', sans-serif", fontSize: 14 }} />
            <button onClick={handleSendChat} style={{ background: "var(--navy)", color: "white", border: "none", padding: "0 24px", borderRadius: 8, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", alignSelf: "stretch" }}>Submit</button>
          </div>
        </div>
      )}

      {/* LEADERBOARD */}
      {page === "leaderboard" && (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
          <div style={{ marginBottom: 36 }}>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, color: "var(--navy)" }}>Rankings</h1>
            <p style={{ color: "var(--slate)", marginTop: 6 }}>The top debaters ranked by Elo rating and win rate</p>
          </div>
          <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 120px 100px 120px 140px", padding: "12px 24px", background: "#f8f9fa", borderBottom: "1px solid var(--border)", fontSize: 12, fontWeight: 700, color: "var(--slate)", textTransform: "uppercase", letterSpacing: 0.5 }}>
              <div>Rank</div><div>Debater</div><div style={{ textAlign: "center" }}>Rating</div><div style={{ textAlign: "center" }}>W/L</div><div style={{ textAlign: "center" }}>Win Rate</div><div style={{ textAlign: "center" }}>Badge</div>
            </div>
            {mockUsers.map((u, i) => (
              <div key={u.name} style={{ display: "grid", gridTemplateColumns: "60px 1fr 120px 100px 120px 140px", padding: "18px 24px", borderBottom: i < mockUsers.length - 1 ? "1px solid var(--border)" : "none", alignItems: "center", background: i === 0 ? "fffef0" : "white" }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 900, color: u.rank === 1 ? "#c9a84c" : u.rank === 2 ? "#9ca3af" : u.rank === 3 ? "#b45309" : "var(--slate)" }}>
                  {u.rank <= 3 ? ["🥇", "🥈", "🥉"][u.rank - 1] : `#${u.rank}`}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 13 }}>{u.avatar}</div>
                  <span style={{ fontWeight: 700, color: "var(--navy)", fontSize: 15 }}>{u.name}</span>
                </div>
                <div style={{ textAlign: "center", fontWeight: 800, color: "var(--navy)", fontSize: 18, fontFamily: "'Playfair Display', serif" }}>{u.rating}</div>
                <div style={{ textAlign: "center", fontSize: 14, color: "var(--slate)" }}><span style={{ color: "var(--green)", fontWeight: 700 }}>{u.wins}W</span> / <span style={{ color: "var(--red)", fontWeight: 700 }}>{u.losses}L</span></div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${Math.round(u.wins / (u.wins + u.losses) * 100)}%`, height: "100%", background: "var(--green)", borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: 12, marginTop: 4, color: "var(--slate)", fontWeight: 600 }}>{Math.round(u.wins / (u.wins + u.losses) * 100)}%</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <span style={{ background: badgeColors[u.badge] + "20", color: badgeColors[u.badge], fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20 }}>{u.badge}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <footer style={{ borderTop: "1px solid var(--border)", padding: "28px 24px", textAlign: "center", marginTop: 60, background: "white" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, color: "var(--navy)", fontSize: 18, marginBottom: 6 }}>DebateArena</div>
        <div style={{ fontSize: 13, color: "var(--slate)" }}>Where ideas compete · Built for serious discourse</div>
      </footer>
    </div>
  );
}
