import { Analytics } from "@vercel/analytics/react";
import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth, GoogleAuthProvider, signInWithPopup,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, updateProfile
} from "firebase/auth";
import {
  getFirestore, collection, addDoc, getDocs, doc,
  updateDoc, increment, query, orderBy, onSnapshot,
  serverTimestamp, getDoc, setDoc
} from "firebase/firestore";
// ── Firebase config ──────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyA7mZm--urrUdfmfvllSQF_DVmqyXqbVmg",
  authDomain: "debate-arena-476dd.firebaseapp.com",
  projectId: "debate-arena-476dd",
  storageBucket: "debate-arena-476dd.firebasestorage.app",
  messagingSenderId: "91689592603",
  appId: "1:91689592603:web:2c04a712098676c83e15be",
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// ── Styles ───────────────────────────────────────────────────────
const FONT = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');`;
const STYLE = `
  ${FONT}
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; background: #f7f5f0; color: #1a1a1a; }
  :root {
    --navy: #0f1f3d; --gold: #c9a84c; --gold-light: #e8c96a;
    --cream: #f7f5f0; --white: #ffffff; --slate: #4a5568;
    --border: #e2ddd6; --red: #c0392b; --green: #1a7a4a; --blue: #1a4a8a;
  }
  input, textarea, select { outline: none; font-family: 'DM Sans', sans-serif; }
  button { font-family: 'DM Sans', sans-serif; cursor: pointer; }
`;

const categories = ["All Topics","Politics & Society","Science & Tech","Philosophy & Ethics","Economics","Culture & Arts","Environment"];

// ── Helpers ──────────────────────────────────────────────────────
const avatar = (name) => (name || "?").slice(0, 2).toUpperCase();
const timeAgo = (ts) => {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`;
  return `${Math.floor(s/86400)}d ago`;
};

// ════════════════════════════════════════════════════════════════
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("home");
  const [authModal, setAuthModal] = useState(null); // "login" | "signup"
  const [authError, setAuthError] = useState("");

  // auth form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  // forums
  const [forums, setForums] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All Topics");
  const [activeForum, setActiveForum] = useState(null);
  const [forumReplies, setForumReplies] = useState([]);
  const [newReply, setNewReply] = useState("");
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCat, setNewCat] = useState("Politics & Society");
  const [newSideA, setNewSideA] = useState("");
  const [newSideB, setNewSideB] = useState("");

  // debates
  const [debates, setDebates] = useState([]);
  const [activeDebate, setActiveDebate] = useState(null);
  const [debateMsgs, setDebateMsgs] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [showNewDebate, setShowNewDebate] = useState(false);
  const [newDebateTopic, setNewDebateTopic] = useState("");

  // leaderboard
  const [leaders, setLeaders] = useState([]);

  // ── Auth listener ──────────────────────────────────────────────
  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // ensure user profile doc
        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          await setDoc(ref, {
            displayName: u.displayName || u.email.split("@")[0],
            email: u.email,
            wins: 0, losses: 0, rating: 1200,
            badge: "Novice", createdAt: serverTimestamp()
          });
        }
      }
    });
  }, []);

  // ── Load forums ────────────────────────────────────────────────
  useEffect(() => {
    const q = query(collection(db, "forums"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setForums(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  // ── Load debates ───────────────────────────────────────────────
  useEffect(() => {
    const q = query(collection(db, "debates"), orderBy("createdAt", "desc"));
    return onSnapshot(q, (snap) => {
      setDebates(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, []);

  // ── Load leaderboard ───────────────────────────────────────────
  useEffect(() => {
    if (page !== "leaderboard") return;
    getDocs(collection(db, "users")).then(snap => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 20);
      setLeaders(list);
    });
  }, [page]);

  // ── Load forum replies ─────────────────────────────────────────
  useEffect(() => {
    if (!activeForum) return;
    const q = query(collection(db, "forums", activeForum.id, "replies"), orderBy("createdAt", "asc"));
    return onSnapshot(q, (snap) => {
      setForumReplies(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [activeForum]);

  // ── Load debate messages ───────────────────────────────────────
  useEffect(() => {
    if (!activeDebate) return;
    const q = query(collection(db, "debates", activeDebate.id, "messages"), orderBy("createdAt", "asc"));
    return onSnapshot(q, (snap) => {
      setDebateMsgs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [activeDebate]);

  // ── Auth actions ───────────────────────────────────────────────
  const handleSignup = async () => {
    try {
      setAuthError("");
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: displayName || email.split("@")[0] });
      setAuthModal(null);
    } catch (e) { setAuthError(e.message); }
  };

  const handleLogin = async () => {
    try {
      setAuthError("");
      await signInWithEmailAndPassword(auth, email, password);
      setAuthModal(null);
    } catch (e) { setAuthError(e.message); }
  };

  const handleGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      setAuthModal(null);
    } catch (e) { setAuthError(e.message); }
  };

  const handleLogout = () => signOut(auth);

  // ── Forum actions ──────────────────────────────────────────────
  const createForum = async () => {
    if (!user) { setAuthModal("login"); return; }
    if (!newTitle.trim()) return;
    await addDoc(collection(db, "forums"), {
      title: newTitle, category: newCat,
      sideA: newSideA || "For", sideB: newSideB || "Against",
      author: user.displayName || user.email, authorId: user.uid,
      votes: 0, replies: 0, createdAt: serverTimestamp()
    });
    setNewTitle(""); setNewSideA(""); setNewSideB(""); setShowNewTopic(false);
  };

  const voteForumUp = async (id) => {
    if (!user) { setAuthModal("login"); return; }
    await updateDoc(doc(db, "forums", id), { votes: increment(1) });
  };

  const postReply = async () => {
    if (!user) { setAuthModal("login"); return; }
    if (!newReply.trim()) return;
    await addDoc(collection(db, "forums", activeForum.id, "replies"), {
      text: newReply, author: user.displayName || user.email,
      authorId: user.uid, createdAt: serverTimestamp(), likes: 0
    });
    await updateDoc(doc(db, "forums", activeForum.id), { replies: increment(1) });
    setNewReply("");
  };

  // ── Debate actions ─────────────────────────────────────────────
  const createDebate = async () => {
    if (!user) { setAuthModal("login"); return; }
    if (!newDebateTopic.trim()) return;
    await addDoc(collection(db, "debates"), {
      topic: newDebateTopic, user1: user.displayName || user.email,
      user1Id: user.uid, user2: null, user2Id: null,
      status: "waiting", round: 0, maxRounds: 4,
      votes1: 0, votes2: 0, createdAt: serverTimestamp()
    });
    setNewDebateTopic(""); setShowNewDebate(false);
  };

  const joinDebate = async (debate) => {
    if (!user) { setAuthModal("login"); return; }
    if (debate.user1Id === user.uid) return;
    await updateDoc(doc(db, "debates", debate.id), {
      user2: user.displayName || user.email, user2Id: user.uid,
      status: "live", round: 1
    });
  };

  const sendDebateMsg = async () => {
    if (!user) { setAuthModal("login"); return; }
    if (!chatInput.trim() || !activeDebate) return;
    await addDoc(collection(db, "debates", activeDebate.id, "messages"), {
      text: chatInput, author: user.displayName || user.email,
      authorId: user.uid, createdAt: serverTimestamp(),
      round: activeDebate.round || 1
    });
    setChatInput("");
  };

  const voteDebate = async (debateId, side) => {
    if (!user) { setAuthModal("login"); return; }
    const field = side === 1 ? "votes1" : "votes2";
    await updateDoc(doc(db, "debates", debateId), { [field]: increment(1) });
  };

  // ── Filtered forums ────────────────────────────────────────────
  const filteredForums = activeCategory === "All Topics"
    ? forums : forums.filter(f => f.category === activeCategory);

  const Nav = () => (
    <nav style={{ background: "var(--navy)", borderBottom: "3px solid var(--gold)", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => { setPage("home"); setActiveForum(null); setActiveDebate(null); }}>
          <div style={{ width: 36, height: 36, background: "var(--gold)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display', serif", fontWeight: 900, color: "var(--navy)", fontSize: 18 }}>D</div>
          <span style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, color: "white", fontSize: 22 }}>DebateArena</span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[["home","Home"],["forums","Forums"],["debates","1v1 Debates"],["leaderboard","Rankings"]].map(([p, label]) => (
            <button key={p} onClick={() => { setPage(p); setActiveForum(null); setActiveDebate(null); }} style={{
              background: page === p ? "var(--gold)" : "transparent",
              color: page === p ? "var(--navy)" : "rgba(255,255,255,0.75)",
              border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: 600, fontSize: 14
            }}>{label}</button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {user ? (
            <>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--navy)", fontSize: 13 }}>{avatar(user.displayName || user.email)}</div>
              <span style={{ color: "white", fontSize: 14 }}>{user.displayName || user.email.split("@")[0]}</span>
              <button onClick={handleLogout} style={{ background: "transparent", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 6, padding: "6px 12px", fontSize: 13 }}>Log out</button>
            </>
          ) : (
            <>
              <button onClick={() => setAuthModal("login")} style={{ background: "transparent", color: "white", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 6, padding: "8px 16px", fontWeight: 600, fontSize: 14 }}>Log in</button>
              <button onClick={() => setAuthModal("signup")} style={{ background: "var(--gold)", color: "var(--navy)", border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: 700, fontSize: 14 }}>Sign up</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );

  const AuthModal = () => (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "white", borderRadius: 16, padding: 40, width: 420, maxWidth: "90vw" }}>
        <h2 style={{ fontFamily: "'Playfair Display', serif", color: "var(--navy)", marginBottom: 24, fontSize: 28 }}>
          {authModal === "login" ? "Welcome back" : "Join DebateArena"}
        </h2>
        {authError && <div style={{ background: "#fdecea", color: "var(--red)", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{authError}</div>}
        <button onClick={handleGoogle} style={{ width: "100%", background: "white", border: "2px solid var(--border)", borderRadius: 10, padding: "12px 0", fontWeight: 700, fontSize: 15, marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <span style={{ fontSize: 20 }}>G</span> Continue with Google
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ color: "var(--slate)", fontSize: 13 }}>or</span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>
        {authModal === "signup" && (
          <input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Display name" style={{ width: "100%", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px", fontSize: 15, marginBottom: 12 }} />
        )}
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" style={{ width: "100%", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px", fontSize: 15, marginBottom: 12 }} />
        <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" style={{ width: "100%", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px", fontSize: 15, marginBottom: 20 }} />
        <button onClick={authModal === "login" ? handleLogin : handleSignup} style={{ width: "100%", background: "var(--navy)", color: "white", border: "none", borderRadius: 10, padding: "14px 0", fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
          {authModal === "login" ? "Log in" : "Create account"}
        </button>
        <div style={{ textAlign: "center", fontSize: 14, color: "var(--slate)" }}>
          {authModal === "login" ? "Don't have an account? " : "Already have an account? "}
          <span onClick={() => setAuthModal(authModal === "login" ? "signup" : "login")} style={{ color: "var(--navy)", fontWeight: 700, cursor: "pointer" }}>
            {authModal === "login" ? "Sign up" : "Log in"}
          </span>
        </div>
        <button onClick={() => setAuthModal(null)} style={{ position: "absolute", top: 16, right: 20, background: "transparent", border: "none", fontSize: 22, color: "var(--slate)" }}>×</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <style>{STYLE}</style>
      <Nav />
      {authModal && <AuthModal />}

      {/* ── HOME ────────────────────────────────────────────────── */}
      {page === "home" && (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <div style={{ display: "inline-block", background: "var(--navy)", color: "var(--gold)", fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", padding: "6px 16px", borderRadius: 20, marginBottom: 20 }}>The Premier Debate Platform</div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 64, fontWeight: 900, color: "var(--navy)", lineHeight: 1.1, marginBottom: 20 }}>Where Ideas<br /><span style={{ color: "var(--gold)" }}>Compete.</span></h1>
            <p style={{ fontSize: 18, color: "var(--slate)", maxWidth: 560, margin: "0 auto 36px", lineHeight: 1.7 }}>Engage in structured debates, challenge ideas in public forums, and climb the rankings as you sharpen your argumentative edge.</p>
            <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
              <button onClick={() => user ? setPage("debates") : setAuthModal("signup")} style={{ background: "var(--navy)", color: "white", border: "none", padding: "14px 32px", borderRadius: 8, fontWeight: 700, fontSize: 16 }}>Start a Debate</button>
              <button onClick={() => setPage("forums")} style={{ background: "white", color: "var(--navy)", border: "2px solid var(--navy)", padding: "14px 32px", borderRadius: 8, fontWeight: 700, fontSize: 16 }}>Browse Forums</button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24, marginBottom: 64 }}>
            {[
              { icon: "⚡", label: "Live Debates", value: debates.filter(d=>d.status==="live").length || 0, desc: "Active 1v1 debates right now" },
              { icon: "💬", label: "Forum Topics", value: forums.length, desc: "Community discussions" },
              { icon: "🏆", label: "Members", value: leaders.length || "—", desc: "Ranked debaters" },
            ].map(s => (
              <div key={s.label} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 12, padding: 28, textAlign: "center" }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 40, fontWeight: 900, color: "var(--navy)" }}>{s.value}</div>
                <div style={{ fontWeight: 700, color: "var(--navy)", marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 13, color: "var(--slate)" }}>{s.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 32 }}>
            <div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: "var(--navy)", marginBottom: 20 }}>🔥 Recent Forums</h2>
              {forums.slice(0, 4).map(f => (
                <div key={f.id} onClick={() => { setActiveForum(f); setPage("forums"); }} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 10, padding: "18px 20px", marginBottom: 12, cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,0.08)"}
                  onMouseLeave={e => e.currentTarget.style.boxShadow="none"}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: 1 }}>{f.category}</span>
                  <div style={{ fontWeight: 600, color: "var(--navy)", marginTop: 4, fontSize: 15 }}>{f.title}</div>
                  <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 13, color: "var(--slate)" }}>
                    <span>💬 {f.replies || 0}</span><span>▲ {f.votes || 0}</span><span>{timeAgo(f.createdAt)}</span>
                  </div>
                </div>
              ))}
              {forums.length === 0 && <div style={{ color: "var(--slate)", textAlign: "center", padding: 40 }}>No forums yet — be the first to start one!</div>}
            </div>
            <div>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: "var(--navy)", marginBottom: 20 }}>⚡ Live Debates</h2>
              {debates.filter(d=>d.status==="live").slice(0,4).map(d => (
                <div key={d.id} onClick={() => { setActiveDebate(d); setPage("debates"); }} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px", marginBottom: 10, cursor: "pointer" }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                    <span style={{ background: "#dcfce7", color: "var(--green)", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>🔴 Live</span>
                  </div>
                  <div style={{ fontWeight: 600, color: "var(--navy)", fontSize: 14, marginBottom: 6 }}>"{d.topic}"</div>
                  <div style={{ fontSize: 12, color: "var(--slate)" }}>{d.user1} vs {d.user2 || "Waiting..."}</div>
                </div>
              ))}
              {debates.filter(d=>d.status==="live").length === 0 && <div style={{ color: "var(--slate)", textAlign: "center", padding: 40 }}>No live debates — start one!</div>}
            </div>
          </div>
        </div>
      )}

      {/* ── FORUMS LIST ─────────────────────────────────────────── */}
      {page === "forums" && !activeForum && (
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
            <div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, color: "var(--navy)" }}>Discussion Forums</h1>
              <p style={{ color: "var(--slate)", marginTop: 4 }}>Join the conversation on today's most contested topics</p>
            </div>
            <button onClick={() => user ? setShowNewTopic(true) : setAuthModal("login")} style={{ background: "var(--navy)", color: "white", border: "none", padding: "12px 24px", borderRadius: 8, fontWeight: 700, fontSize: 14 }}>+ New Topic</button>
          </div>

          {showNewTopic && (
            <div style={{ background: "white", border: "2px solid var(--gold)", borderRadius: 12, padding: 28, marginBottom: 28 }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", color: "var(--navy)", marginBottom: 20, fontSize: 20 }}>Create New Topic</h3>
              <input value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Debate question or topic..." style={{ width: "100%", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 14 }} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                <select value={newCat} onChange={e=>setNewCat(e.target.value)} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", fontSize: 14 }}>
                  {categories.filter(c=>c!=="All Topics").map(c=><option key={c}>{c}</option>)}
                </select>
                <input value={newSideA} onChange={e=>setNewSideA(e.target.value)} placeholder="Side A (e.g. For)" style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", fontSize: 14 }} />
                <input value={newSideB} onChange={e=>setNewSideB(e.target.value)} placeholder="Side B (e.g. Against)" style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", fontSize: 14 }} />
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={createForum} style={{ background: "var(--navy)", color: "white", border: "none", padding: "10px 24px", borderRadius: 8, fontWeight: 700 }}>Create Topic</button>
                <button onClick={() => setShowNewTopic(false)} style={{ background: "transparent", color: "var(--slate)", border: "1px solid var(--border)", padding: "10px 20px", borderRadius: 8 }}>Cancel</button>
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
            {categories.map(c => (
              <button key={c} onClick={() => setActiveCategory(c)} style={{ background: activeCategory===c ? "var(--navy)" : "white", color: activeCategory===c ? "white" : "var(--slate)", border: "1px solid "+(activeCategory===c?"var(--navy)":"var(--border)"), padding: "7px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600 }}>{c}</button>
            ))}
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {filteredForums.map(f => (
              <div key={f.id} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 24px", display: "flex", gap: 20, cursor: "pointer" }}
                onClick={() => setActiveForum(f)}
                onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,0.07)"}
                onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 44 }}>
                  <button onClick={e=>{e.stopPropagation();voteForumUp(f.id);}} style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 6, width: 32, height: 28, fontWeight: 700, fontSize: 13, color: "var(--slate)" }}>▲</button>
                  <span style={{ fontWeight: 700, color: "var(--navy)" }}>{f.votes || 0}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: 1 }}>{f.category}</span>
                  <div style={{ fontWeight: 700, color: "var(--navy)", fontSize: 16, margin: "4px 0 8px" }}>{f.title}</div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <span style={{ background: "#e8f4fd", color: "var(--blue)", fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>{f.sideA}</span>
                    <span style={{ color: "var(--slate)", fontWeight: 700 }}>vs</span>
                    <span style={{ background: "#fdecea", color: "var(--red)", fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>{f.sideB}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right", minWidth: 90 }}>
                  <div style={{ fontSize: 13, color: "var(--slate)" }}>💬 {f.replies || 0}</div>
                  <div style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>by {f.author}</div>
                  <div style={{ fontSize: 12, color: "#aaa" }}>{timeAgo(f.createdAt)}</div>
                </div>
              </div>
            ))}
            {filteredForums.length === 0 && <div style={{ textAlign: "center", padding: 60, color: "var(--slate)" }}>No topics in this category yet. Be the first!</div>}
          </div>
        </div>
      )}

      {/* ── FORUM DETAIL ────────────────────────────────────────── */}
      {page === "forums" && activeForum && (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
          <button onClick={() => setActiveForum(null)} style={{ background: "transparent", border: "1px solid var(--border)", padding: "8px 18px", borderRadius: 8, marginBottom: 24, color: "var(--slate)", fontWeight: 600 }}>← Back to Forums</button>
          <div style={{ background: "var(--navy)", borderRadius: 14, padding: 32, marginBottom: 28, color: "white" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: 1 }}>{activeForum.category}</span>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, marginTop: 8, marginBottom: 16 }}>{activeForum.title}</h1>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span style={{ background: "rgba(255,255,255,0.1)", color: "#93c5fd", fontSize: 13, fontWeight: 600, padding: "6px 16px", borderRadius: 20 }}>🔵 {activeForum.sideA}</span>
              <span style={{ fontWeight: 700, fontSize: 16 }}>vs</span>
              <span style={{ background: "rgba(255,255,255,0.1)", color: "#fca5a5", fontSize: 13, fontWeight: 600, padding: "6px 16px", borderRadius: 20 }}>🔴 {activeForum.sideB}</span>
              <span style={{ marginLeft: "auto", fontSize: 13, color: "rgba(255,255,255,0.6)" }}>by {activeForum.author}</span>
            </div>
          </div>
          <div style={{ display: "grid", gap: 16, marginBottom: 24 }}>
            {forumReplies.map(r => (
              <div key={r.id} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 12 }}>{avatar(r.author)}</div>
                  <div>
                    <span style={{ fontWeight: 700, color: "var(--navy)" }}>{r.author}</span>
                    <span style={{ fontSize: 12, color: "var(--slate)", marginLeft: 10 }}>{timeAgo(r.createdAt)}</span>
                  </div>
                </div>
                <p style={{ color: "#333", lineHeight: 1.65 }}>{r.text}</p>
              </div>
            ))}
            {forumReplies.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "var(--slate)" }}>No replies yet — start the debate!</div>}
          </div>
          <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
            <textarea value={newReply} onChange={e=>setNewReply(e.target.value)} placeholder={user ? "Add your argument..." : "Log in to reply..."} rows={3} disabled={!user} style={{ width: "100%", border: "1px solid var(--border)", borderRadius: 8, padding: 12, resize: "vertical", fontSize: 15 }} />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
              {user ? <button onClick={postReply} style={{ background: "var(--navy)", color: "white", border: "none", padding: "10px 24px", borderRadius: 8, fontWeight: 700 }}>Post Reply</button>
                : <button onClick={() => setAuthModal("login")} style={{ background: "var(--gold)", color: "var(--navy)", border: "none", padding: "10px 24px", borderRadius: 8, fontWeight: 700 }}>Log in to Reply</button>}
            </div>
          </div>
        </div>
      )}

      {/* ── DEBATES LIST ────────────────────────────────────────── */}
      {page === "debates" && !activeDebate && (
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "40px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
            <div>
              <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, color: "var(--navy)" }}>1v1 Debate Rooms</h1>
              <p style={{ color: "var(--slate)", marginTop: 4 }}>Head-to-head structured debates with audience voting</p>
            </div>
            <button onClick={() => user ? setShowNewDebate(true) : setAuthModal("login")} style={{ background: "var(--gold)", color: "var(--navy)", border: "none", padding: "12px 24px", borderRadius: 8, fontWeight: 700, fontSize: 14 }}>⚡ Start a Debate</button>
          </div>

          {showNewDebate && (
            <div style={{ background: "white", border: "2px solid var(--gold)", borderRadius: 12, padding: 24, marginBottom: 24 }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", color: "var(--navy)", marginBottom: 16 }}>New 1v1 Debate</h3>
              <input value={newDebateTopic} onChange={e=>setNewDebateTopic(e.target.value)} placeholder="What's the debate topic?" style={{ width: "100%", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", fontSize: 15, marginBottom: 14 }} />
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={createDebate} style={{ background: "var(--navy)", color: "white", border: "none", padding: "10px 24px", borderRadius: 8, fontWeight: 700 }}>Create Room</button>
                <button onClick={() => setShowNewDebate(false)} style={{ background: "transparent", color: "var(--slate)", border: "1px solid var(--border)", padding: "10px 20px", borderRadius: 8 }}>Cancel</button>
              </div>
            </div>
          )}

          <div style={{ display: "grid", gap: 20 }}>
            {debates.map(d => {
              const total = (d.votes1 || 0) + (d.votes2 || 0) || 1;
              const pct1 = Math.round((d.votes1 || 0) / total * 100);
              return (
                <div key={d.id} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, padding: "20px 28px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                    <span style={{ background: d.status==="live"?"#dcfce7":d.status==="waiting"?"#fef9c3":"#f1f5f9", color: d.status==="live"?"var(--green)":d.status==="waiting"?"#b45309":"var(--slate)", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, textTransform: "uppercase" }}>
                      {d.status==="live"?"🔴 Live":d.status==="waiting"?"⏳ Waiting":"✓ Done"}
                    </span>
                    <span style={{ fontWeight: 700, color: "var(--navy)", flex: 1, textAlign: "center" }}>"{d.topic}"</span>
                    <span style={{ fontSize: 13, color: "var(--slate)" }}>Round {d.round}/{d.maxRounds}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 50px 1fr", gap: 12, alignItems: "center", marginBottom: 16 }}>
                    <div style={{ background: "#e8f4fd", borderRadius: 10, padding: 14, textAlign: "center" }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, margin: "0 auto 6px" }}>{avatar(d.user1)}</div>
                      <div style={{ fontWeight: 700, color: "var(--navy)", fontSize: 14 }}>{d.user1}</div>
                      <div style={{ fontSize: 12, color: "var(--blue)", fontWeight: 600 }}>PRO</div>
                    </div>
                    <div style={{ textAlign: "center", fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 900, color: "var(--gold)" }}>VS</div>
                    <div style={{ background: "#fdecea", borderRadius: 10, padding: 14, textAlign: "center" }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: d.user2 ? "var(--red)" : "#ccc", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, margin: "0 auto 6px" }}>{d.user2 ? avatar(d.user2) : "?"}</div>
                      <div style={{ fontWeight: 700, color: "var(--navy)", fontSize: 14 }}>{d.user2 || "Open"}</div>
                      <div style={{ fontSize: 12, color: "var(--red)", fontWeight: 600 }}>CON</div>
                    </div>
                  </div>
                  {d.status !== "waiting" && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13, fontWeight: 600 }}>
                        <span style={{ color: "var(--blue)" }}>{d.user1}: {pct1}%</span>
                        <span style={{ color: "var(--red)" }}>{d.user2}: {100-pct1}%</span>
                      </div>
                      <div style={{ height: 8, borderRadius: 4, background: "#fdecea", overflow: "hidden" }}>
                        <div style={{ width: `${pct1}%`, height: "100%", background: "var(--blue)", borderRadius: 4 }} />
                      </div>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 10 }}>
                    {d.status === "waiting" && user && d.user1Id !== user.uid && (
                      <button onClick={() => joinDebate(d)} style={{ flex: 1, background: "var(--gold)", color: "var(--navy)", border: "none", borderRadius: 8, padding: "9px 0", fontWeight: 700, fontSize: 13 }}>Join as CON</button>
                    )}
                    {d.status === "live" && (
                      <>
                        <button onClick={() => voteDebate(d.id, 1)} style={{ flex: 1, background: "white", color: "var(--blue)", border: "2px solid var(--blue)", borderRadius: 8, padding: "9px 0", fontWeight: 700, fontSize: 13 }}>Vote {d.user1}</button>
                        <button onClick={() => voteDebate(d.id, 2)} style={{ flex: 1, background: "white", color: "var(--red)", border: "2px solid var(--red)", borderRadius: 8, padding: "9px 0", fontWeight: 700, fontSize: 13 }}>Vote {d.user2}</button>
                        <button onClick={() => setActiveDebate(d)} style={{ flex: 1, background: "var(--navy)", color: "white", border: "none", borderRadius: 8, padding: "9px 0", fontWeight: 700, fontSize: 13 }}>Watch →</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
            {debates.length === 0 && <div style={{ textAlign: "center", padding: 60, color: "var(--slate)" }}>No debates yet — start one!</div>}
          </div>
        </div>
      )}

      {/* ── DEBATE ROOM ─────────────────────────────────────────── */}
      {page === "debates" && activeDebate && (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
          <button onClick={() => setActiveDebate(null)} style={{ background: "transparent", border: "1px solid var(--border)", padding: "8px 18px", borderRadius: 8, marginBottom: 24, color: "var(--slate)", fontWeight: 600 }}>← Back</button>
          <div style={{ background: "var(--navy)", borderRadius: 14, padding: 28, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ background: "#dc2626", color: "white", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20, display: "inline-block", marginBottom: 8 }}>🔴 LIVE</span>
              <h2 style={{ fontFamily: "'Playfair Display', serif", color: "white", fontSize: 22 }}>"{activeDebate.topic}"</h2>
            </div>
            <div style={{ textAlign: "right", color: "rgba(255,255,255,0.7)", fontSize: 14 }}>
              <div style={{ color: "var(--gold)", fontWeight: 700, fontSize: 18 }}>Round {activeDebate.round}/{activeDebate.maxRounds}</div>
            </div>
          </div>
          <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, marginBottom: 20 }}>
            <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", fontWeight: 700, color: "var(--navy)", background: "#fafafa", borderRadius: "14px 14px 0 0" }}>Live Transcript</div>
            <div style={{ maxHeight: 380, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
              {debateMsgs.map(m => (
                <div key={m.id} style={{ display: "flex", gap: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: m.authorId === activeDebate.user1Id ? "var(--blue)" : "var(--red)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 11, flexShrink: 0 }}>{avatar(m.author)}</div>
                  <div style={{ background: "#f8f9fa", borderRadius: 10, padding: "10px 14px", flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: "var(--navy)", fontSize: 13 }}>{m.author}</span>
                      <span style={{ fontSize: 11, color: "var(--slate)" }}>Round {m.round} · {timeAgo(m.createdAt)}</span>
                    </div>
                    <p style={{ color: "#333", lineHeight: 1.6, fontSize: 14 }}>{m.text}</p>
                  </div>
                </div>
              ))}
              {debateMsgs.length === 0 && <div style={{ textAlign: "center", padding: 40, color: "var(--slate)" }}>No arguments yet — make your opening statement!</div>}
            </div>
          </div>
          {user && (activeDebate.user1Id === user.uid || activeDebate.user2Id === user.uid) && (
            <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 12, padding: 16, display: "flex", gap: 12 }}>
              <textarea value={chatInput} onChange={e=>setChatInput(e.target.value)} placeholder="Submit your argument..." rows={2} style={{ flex: 1, border: "1px solid var(--border)", borderRadius: 8, padding: "10px 12px", resize: "none", fontSize: 14 }} />
              <button onClick={sendDebateMsg} style={{ background: "var(--navy)", color: "white", border: "none", padding: "0 24px", borderRadius: 8, fontWeight: 700, alignSelf: "stretch" }}>Submit</button>
            </div>
          )}
          {!user && <div style={{ textAlign: "center", padding: 20 }}><button onClick={() => setAuthModal("login")} style={{ background: "var(--gold)", color: "var(--navy)", border: "none", padding: "12px 28px", borderRadius: 8, fontWeight: 700, fontSize: 15 }}>Log in to participate</button></div>}
        </div>
      )}

      {/* ── LEADERBOARD ─────────────────────────────────────────── */}
      {page === "leaderboard" && (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 36, color: "var(--navy)", marginBottom: 8 }}>Rankings</h1>
          <p style={{ color: "var(--slate)", marginBottom: 32 }}>Top debaters ranked by Elo rating</p>
          <div style={{ background: "white", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 120px 100px 130px", padding: "12px 24px", background: "#f8f9fa", borderBottom: "1px solid var(--border)", fontSize: 12, fontWeight: 700, color: "var(--slate)", textTransform: "uppercase", letterSpacing: 0.5 }}>
              <div>Rank</div><div>Debater</div><div style={{ textAlign: "center" }}>Rating</div><div style={{ textAlign: "center" }}>W/L</div><div style={{ textAlign: "center" }}>Badge</div>
            </div>
            {leaders.map((u, i) => (
              <div key={u.id} style={{ display: "grid", gridTemplateColumns: "60px 1fr 120px 100px 130px", padding: "16px 24px", borderBottom: i < leaders.length-1 ? "1px solid var(--border)" : "none", alignItems: "center" }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 900, color: i===0?"#c9a84c":i===1?"#9ca3af":i===2?"#b45309":"var(--slate)" }}>
                  {i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--navy)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 12 }}>{avatar(u.displayName)}</div>
                  <span style={{ fontWeight: 700, color: "var(--navy)" }}>{u.displayName}</span>
                </div>
                <div style={{ textAlign: "center", fontWeight: 800, color: "var(--navy)", fontSize: 18, fontFamily: "'Playfair Display', serif" }}>{u.rating || 1200}</div>
                <div style={{ textAlign: "center", fontSize: 13 }}><span style={{ color: "var(--green)", fontWeight: 700 }}>{u.wins||0}W</span> / <span style={{ color: "var(--red)", fontWeight: 700 }}>{u.losses||0}L</span></div>
                <div style={{ textAlign: "center" }}><span style={{ background: "#f1f5f9", color: "var(--slate)", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20 }}>{u.badge || "Novice"}</span></div>
              </div>
            ))}
            {leaders.length === 0 && <div style={{ textAlign: "center", padding: 60, color: "var(--slate)" }}>No ranked members yet — sign up to get on the board!</div>}
          </div>
        </div>
      )}

      <footer style={{ borderTop: "1px solid var(--border)", padding: "28px 24px", textAlign: "center", marginTop: 60, background: "white" }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontWeight: 900, color: "var(--navy)", fontSize: 18, marginBottom: 4 }}>DebateArena</div>
        <div style={{ fontSize: 13, color: "var(--slate)" }}>Where ideas compete · Built for serious discourse</div>
      </footer>
    </div>
  );
}