import { useState, useEffect, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth, GoogleAuthProvider, signInWithPopup,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged, updateProfile
} from "firebase/auth";
import {
  getFirestore, collection, addDoc, doc,
  updateDoc, increment, query, orderBy, onSnapshot,
  serverTimestamp, getDoc, setDoc
} from "firebase/firestore";

// ── Firebase ─────────────────────────────────────────────────────
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

// ── LD Format ────────────────────────────────────────────────────
const LD_ROUNDS = [
  { key: "AC",  label: "Affirmative Constructive", speaker: "pro",  seconds: 180, desc: "PRO presents opening case" },
  { key: "CX1", label: "Cross-Examination (NEG questions)", speaker: "con",  seconds: 120, desc: "CON cross-examines PRO" },
  { key: "NC",  label: "Negative Constructive", speaker: "con",  seconds: 180, desc: "CON presents opening case" },
  { key: "CX2", label: "Cross-Examination (AFF questions)", speaker: "pro",  seconds: 120, desc: "PRO cross-examines CON" },
  { key: "1AR", label: "1st Affirmative Rebuttal", speaker: "pro",  seconds: 240, desc: "PRO rebuts CON's case" },
  { key: "NR",  label: "Negative Rebuttal", speaker: "con",  seconds: 240, desc: "CON rebuts & extends" },
  { key: "2AR", label: "2nd Affirmative Rebuttal", speaker: "pro",  seconds: 180, desc: "PRO final rebuttal" },
];

// ── Styles ───────────────────────────────────────────────────────
const FONT = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:wght@300;400;500;600&display=swap');`;
const STYLE = `
  ${FONT}
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'DM Sans', sans-serif; background: #f7f5f0; color: #1a1a1a; }
  :root {
    --navy: #0f1f3d; --gold: #c9a84c; --cream: #f7f5f0;
    --white: #fff; --slate: #4a5568; --border: #e2ddd6;
    --red: #c0392b; --green: #1a7a4a; --blue: #1a4a8a;
  }
  input, textarea, select { outline: none; font-family: 'DM Sans', sans-serif; }
  button { font-family: 'DM Sans', sans-serif; cursor: pointer; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
`;

const categories = ["All Topics","Politics & Society","Science & Tech","Philosophy & Ethics","Economics","Culture & Arts","Environment"];
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
const fmtTime = (s) => `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`;

// ════════════════════════════════════════════════════════════════
export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("home");
  const [authModal, setAuthModal] = useState(null);
  const [authError, setAuthError] = useState("");
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [displayName, setDisplayName] = useState("");

  const [forums, setForums] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All Topics");
  const [activeForum, setActiveForum] = useState(null);
  const [forumReplies, setForumReplies] = useState([]);
  const [newReply, setNewReply] = useState("");
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [newTitle, setNewTitle] = useState(""); const [newCat, setNewCat] = useState("Politics & Society");
  const [newSideA, setNewSideA] = useState(""); const [newSideB, setNewSideB] = useState("");

  const [debates, setDebates] = useState([]);
  const [activeDebate, setActiveDebate] = useState(null);
  const [debateMsgs, setDebateMsgs] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [showNewDebate, setShowNewDebate] = useState(false);
  const [newDebateTopic, setNewDebateTopic] = useState("");
  const [myVotes, setMyVotes] = useState({});

  const [timeLeft, setTimeLeft] = useState(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef(null);

  const [leaders, setLeaders] = useState([]);

  // ── Auth ──────────────────────────────────────────────────────
  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const ref = doc(db, "users", u.uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          await setDoc(ref, { displayName: u.displayName || u.email.split("@")[0], email: u.email, wins: 0, losses: 0, rating: 1200, badge: "Novice", createdAt: serverTimestamp() });
        }
      }
    });
  }, []);

  useEffect(() => {
    const q = query(collection(db, "forums"), orderBy("createdAt", "desc"));
    return onSnapshot(q, snap => setForums(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  useEffect(() => {
    const q = query(collection(db, "debates"), orderBy("createdAt", "desc"));
    return onSnapshot(q, snap => setDebates(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, []);

  useEffect(() => {
    if (page !== "leaderboard") return;
    const q = query(collection(db, "users"), orderBy("rating", "desc"));
    return onSnapshot(q, snap => setLeaders(snap.docs.map(d => ({ id: d.id, ...d.data() })).slice(0, 20)));
  }, [page]);

  useEffect(() => {
    if (!activeForum) return;
    const q = query(collection(db, "forums", activeForum.id, "replies"), orderBy("createdAt", "asc"));
    return onSnapshot(q, snap => setForumReplies(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [activeForum]);

  useEffect(() => {
    if (!activeDebate) return;
    const q = query(collection(db, "debates", activeDebate.id, "messages"), orderBy("createdAt", "asc"));
    return onSnapshot(q, snap => setDebateMsgs(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [activeDebate?.id]);

  useEffect(() => {
    if (!activeDebate?.id) return;
    return onSnapshot(doc(db, "debates", activeDebate.id), snap => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() };
        setActiveDebate(data);
        setTimeLeft(t => t === null ? LD_ROUNDS[data.roundIndex || 0].seconds : t);
      }
    });
  }, [activeDebate?.id]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(doc(db, "userVotes", user.uid), snap => {
      if (snap.exists()) setMyVotes(snap.data());
    });
  }, [user?.uid]);

  // Timer
  useEffect(() => {
    clearTimeout(timerRef.current);
    if (timerRunning && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    } else if (timerRunning && timeLeft === 0) {
      setTimerRunning(false);
    }
    return () => clearTimeout(timerRef.current);
  }, [timerRunning, timeLeft]);

  // ── Auth actions ──────────────────────────────────────────────
  const handleSignup = async () => {
    try { setAuthError(""); const c = await createUserWithEmailAndPassword(auth, email, password); await updateProfile(c.user, { displayName: displayName || email.split("@")[0] }); setAuthModal(null); }
    catch (e) { setAuthError(e.message); }
  };
  const handleLogin = async () => {
    try { setAuthError(""); await signInWithEmailAndPassword(auth, email, password); setAuthModal(null); }
    catch (e) { setAuthError(e.message); }
  };
  const handleGoogle = async () => {
    try { await signInWithPopup(auth, googleProvider); setAuthModal(null); }
    catch (e) { setAuthError(e.message); }
  };
  const handleLogout = () => signOut(auth);

  // ── Forum actions ─────────────────────────────────────────────
  const createForum = async () => {
    if (!user) { setAuthModal("login"); return; }
    if (!newTitle.trim()) return;
    await addDoc(collection(db, "forums"), { title: newTitle, category: newCat, sideA: newSideA || "For", sideB: newSideB || "Against", author: user.displayName || user.email, authorId: user.uid, votes: 0, replies: 0, createdAt: serverTimestamp() });
    setNewTitle(""); setNewSideA(""); setNewSideB(""); setShowNewTopic(false);
  };
  const voteForumUp = async (id) => {
    if (!user) { setAuthModal("login"); return; }
    await updateDoc(doc(db, "forums", id), { votes: increment(1) });
  };
  const postReply = async () => {
    if (!user) { setAuthModal("login"); return; }
    if (!newReply.trim()) return;
    await addDoc(collection(db, "forums", activeForum.id, "replies"), { text: newReply, author: user.displayName || user.email, authorId: user.uid, createdAt: serverTimestamp() });
    await updateDoc(doc(db, "forums", activeForum.id), { replies: increment(1) });
    setNewReply("");
  };

  // ── Debate actions ────────────────────────────────────────────
  const createDebate = async () => {
    if (!user) { setAuthModal("login"); return; }
    if (!newDebateTopic.trim()) return;
    await addDoc(collection(db, "debates"), { topic: newDebateTopic, user1: user.displayName || user.email, user1Id: user.uid, user2: null, user2Id: null, status: "waiting", roundIndex: 0, votes1: 0, votes2: 0, createdAt: serverTimestamp() });
    setNewDebateTopic(""); setShowNewDebate(false);
  };

  const joinDebate = async (debate) => {
    if (!user) { setAuthModal("login"); return; }
    if (debate.user1Id === user.uid) return;
    await updateDoc(doc(db, "debates", debate.id), { user2: user.displayName || user.email, user2Id: user.uid, status: "live", roundIndex: 0 });
    setTimeLeft(LD_ROUNDS[0].seconds);
  };

  const advanceRound = async () => {
    if (!activeDebate) return;
    const nextIndex = (activeDebate.roundIndex || 0) + 1;
    setTimerRunning(false);
    if (nextIndex >= LD_ROUNDS.length) {
      await updateDoc(doc(db, "debates", activeDebate.id), { status: "completed" });
      const winnerId = (activeDebate.votes1 || 0) >= (activeDebate.votes2 || 0) ? activeDebate.user1Id : activeDebate.user2Id;
      const loserId = winnerId === activeDebate.user1Id ? activeDebate.user2Id : activeDebate.user1Id;
      if (winnerId) await updateDoc(doc(db, "users", winnerId), { wins: increment(1), rating: increment(32) });
      if (loserId) await updateDoc(doc(db, "users", loserId), { losses: increment(1), rating: increment(-16) });
    } else {
      await updateDoc(doc(db, "debates", activeDebate.id), { roundIndex: nextIndex });
      setTimeLeft(LD_ROUNDS[nextIndex].seconds);
    }
  };

  const sendDebateMsg = async () => {
    if (!user || !chatInput.trim() || !activeDebate) return;
    const roundIndex = activeDebate.roundIndex || 0;
    const round = LD_ROUNDS[roundIndex];
    const isMyTurn = (round.speaker === "pro" && activeDebate.user1Id === user.uid) || (round.speaker === "con" && activeDebate.user2Id === user.uid);
    if (!isMyTurn) return;
    await addDoc(collection(db, "debates", activeDebate.id, "messages"), { text: chatInput, author: user.displayName || user.email, authorId: user.uid, createdAt: serverTimestamp(), roundKey: round.key, roundLabel: round.label });
    setChatInput("");
  };

  const voteDebate = async (debateId, side) => {
    if (!user) { setAuthModal("login"); return; }
    if (myVotes[debateId]) return;
    const field = side === 1 ? "votes1" : "votes2";
    await updateDoc(doc(db, "debates", debateId), { [field]: increment(1) });
    const ref = doc(db, "userVotes", user.uid);
    const snap = await getDoc(ref);
    if (snap.exists()) await updateDoc(ref, { [debateId]: side });
    else await setDoc(ref, { [debateId]: side });
    setMyVotes(prev => ({ ...prev, [debateId]: side }));
  };

  const filteredForums = activeCategory === "All Topics" ? forums : forums.filter(f => f.category === activeCategory);
  const currentRound = activeDebate ? LD_ROUNDS[activeDebate.roundIndex || 0] : null;
  const isMyTurn = activeDebate && currentRound && user && (
    (currentRound.speaker === "pro" && activeDebate.user1Id === user.uid) ||
    (currentRound.speaker === "con" && activeDebate.user2Id === user.uid)
  );
  const isDebater = activeDebate && user && (activeDebate.user1Id === user.uid || activeDebate.user2Id === user.uid);

  const Nav = () => (
    <nav style={{ background: "var(--navy)", borderBottom: "3px solid var(--gold)", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => { setPage("home"); setActiveForum(null); setActiveDebate(null); }}>
          <div style={{ width: 36, height: 36, background: "var(--gold)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display',serif", fontWeight: 900, color: "var(--navy)", fontSize: 18 }}>D</div>
          <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 900, color: "white", fontSize: 22 }}>DebateArena</span>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[["home","Home"],["forums","Forums"],["debates","1v1 Debates"],["leaderboard","Rankings"]].map(([p,l]) => (
            <button key={p} onClick={() => { setPage(p); setActiveForum(null); setActiveDebate(null); }} style={{ background: page===p?"var(--gold)":"transparent", color: page===p?"var(--navy)":"rgba(255,255,255,0.75)", border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: 600, fontSize: 14 }}>{l}</button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {user ? (
            <>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--gold)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "var(--navy)", fontSize: 13 }}>{avatar(user.displayName||user.email)}</div>
              <span style={{ color: "white", fontSize: 14 }}>{user.displayName||user.email.split("@")[0]}</span>
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
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setAuthModal(null)}>
      <div style={{ background: "white", borderRadius: 16, padding: 40, width: 420, maxWidth: "90vw", position: "relative" }} onClick={e=>e.stopPropagation()}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", color: "var(--navy)", marginBottom: 24, fontSize: 28 }}>{authModal==="login"?"Welcome back":"Join DebateArena"}</h2>
        {authError && <div style={{ background: "#fdecea", color: "var(--red)", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 14 }}>{authError}</div>}
        <button onClick={handleGoogle} style={{ width: "100%", background: "white", border: "2px solid var(--border)", borderRadius: 10, padding: "12px 0", fontWeight: 700, fontSize: 15, marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <span style={{ fontSize: 18, fontWeight: 900 }}>G</span> Continue with Google
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }}/><span style={{ color: "var(--slate)", fontSize: 13 }}>or</span><div style={{ flex: 1, height: 1, background: "var(--border)" }}/>
        </div>
        {authModal==="signup" && <input value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Display name" style={{ width: "100%", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px", fontSize: 15, marginBottom: 12 }} />}
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email" style={{ width: "100%", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px", fontSize: 15, marginBottom: 12 }} />
        <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" style={{ width: "100%", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px", fontSize: 15, marginBottom: 20 }} />
        <button onClick={authModal==="login"?handleLogin:handleSignup} style={{ width: "100%", background: "var(--navy)", color: "white", border: "none", borderRadius: 10, padding: "14px 0", fontWeight: 700, fontSize: 16, marginBottom: 14 }}>
          {authModal==="login"?"Log in":"Create account"}
        </button>
        <div style={{ textAlign: "center", fontSize: 14, color: "var(--slate)" }}>
          {authModal==="login"?"Don't have an account? ":"Already have an account? "}
          <span onClick={() => setAuthModal(authModal==="login"?"signup":"login")} style={{ color: "var(--navy)", fontWeight: 700, cursor: "pointer" }}>{authModal==="login"?"Sign up":"Log in"}</span>
        </div>
        <button onClick={() => setAuthModal(null)} style={{ position: "absolute", top: 14, right: 18, background: "transparent", border: "none", fontSize: 24, color: "var(--slate)" }}>×</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--cream)" }}>
      <style>{STYLE}</style>
      <Nav />
      {authModal && <AuthModal />}

      {/* HOME */}
      {page==="home" && (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "48px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <div style={{ display: "inline-block", background: "var(--navy)", color: "var(--gold)", fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", padding: "6px 16px", borderRadius: 20, marginBottom: 20 }}>The Premier Debate Platform</div>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 60, fontWeight: 900, color: "var(--navy)", lineHeight: 1.1, marginBottom: 18 }}>Where Ideas<br /><span style={{ color: "var(--gold)" }}>Compete.</span></h1>
            <p style={{ fontSize: 18, color: "var(--slate)", maxWidth: 520, margin: "0 auto 32px", lineHeight: 1.7 }}>Structured Lincoln-Douglas debates, open forums, and a live leaderboard.</p>
            <div style={{ display: "flex", gap: 14, justifyContent: "center" }}>
              <button onClick={() => user?setPage("debates"):setAuthModal("signup")} style={{ background: "var(--navy)", color: "white", border: "none", padding: "14px 32px", borderRadius: 8, fontWeight: 700, fontSize: 16 }}>Start a Debate</button>
              <button onClick={() => setPage("forums")} style={{ background: "white", color: "var(--navy)", border: "2px solid var(--navy)", padding: "14px 32px", borderRadius: 8, fontWeight: 700, fontSize: 16 }}>Browse Forums</button>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 24, marginBottom: 52 }}>
            {[{icon:"⚡",label:"Live Debates",value:debates.filter(d=>d.status==="live").length},{icon:"💬",label:"Forum Topics",value:forums.length},{icon:"🏆",label:"Members",value:leaders.length||"—"}].map(s=>(
              <div key={s.label} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 12, padding: 28, textAlign: "center" }}>
                <div style={{ fontSize: 34, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 38, fontWeight: 900, color: "var(--navy)" }}>{s.value}</div>
                <div style={{ fontWeight: 700, color: "var(--navy)" }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 28 }}>
            <div>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, color: "var(--navy)", marginBottom: 14 }}>🔥 Recent Forums</h2>
              {forums.slice(0,4).map(f=>(
                <div key={f.id} onClick={()=>{setActiveForum(f);setPage("forums");}} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 18px", marginBottom: 10, cursor: "pointer" }}
                  onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,0.08)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--gold)", textTransform: "uppercase", letterSpacing: 1 }}>{f.category}</span>
                  <div style={{ fontWeight: 600, color: "var(--navy)", marginTop: 4, fontSize: 14 }}>{f.title}</div>
                  <div style={{ display: "flex", gap: 12, marginTop: 6, fontSize: 12, color: "var(--slate)" }}><span>💬 {f.replies||0}</span><span>▲ {f.votes||0}</span><span>{timeAgo(f.createdAt)}</span></div>
                </div>
              ))}
              {forums.length===0 && <div style={{ color:"var(--slate)",padding:32,textAlign:"center" }}>No forums yet!</div>}
            </div>
            <div>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, color: "var(--navy)", marginBottom: 14 }}>⚡ Live Debates</h2>
              {debates.filter(d=>d.status==="live").slice(0,4).map(d=>(
                <div key={d.id} onClick={()=>{setActiveDebate(d);setPage("debates");}} style={{ background: "white", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 16px", marginBottom: 10, cursor: "pointer" }}>
                  <span style={{ background: "#dcfce7", color: "var(--green)", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>🔴 Live</span>
                  <div style={{ fontWeight: 600, color: "var(--navy)", fontSize: 13, margin: "6px 0 3px" }}>"{d.topic}"</div>
                  <div style={{ fontSize: 12, color: "var(--slate)" }}>{d.user1} vs {d.user2}</div>
                </div>
              ))}
              {debates.filter(d=>d.status==="live").length===0 && <div style={{ color:"var(--slate)",padding:32,textAlign:"center" }}>No live debates!</div>}
            </div>
          </div>
        </div>
      )}

      {/* FORUMS LIST */}
      {page==="forums" && !activeForum && (
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
            <div><h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:36,color:"var(--navy)" }}>Discussion Forums</h1><p style={{ color:"var(--slate)",marginTop:4 }}>Join the conversation</p></div>
            <button onClick={()=>user?setShowNewTopic(true):setAuthModal("login")} style={{ background:"var(--navy)",color:"white",border:"none",padding:"12px 24px",borderRadius:8,fontWeight:700,fontSize:14 }}>+ New Topic</button>
          </div>
          {showNewTopic && (
            <div style={{ background:"white",border:"2px solid var(--gold)",borderRadius:12,padding:24,marginBottom:22 }}>
              <h3 style={{ fontFamily:"'Playfair Display',serif",color:"var(--navy)",marginBottom:14 }}>Create New Topic</h3>
              <input value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Debate question..." style={{ width:"100%",border:"1px solid var(--border)",borderRadius:8,padding:"10px 14px",marginBottom:12,fontSize:14 }} />
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:14 }}>
                <select value={newCat} onChange={e=>setNewCat(e.target.value)} style={{ border:"1px solid var(--border)",borderRadius:8,padding:"10px 12px",fontSize:13 }}>{categories.filter(c=>c!=="All Topics").map(c=><option key={c}>{c}</option>)}</select>
                <input value={newSideA} onChange={e=>setNewSideA(e.target.value)} placeholder="Side A" style={{ border:"1px solid var(--border)",borderRadius:8,padding:"10px 12px",fontSize:13 }} />
                <input value={newSideB} onChange={e=>setNewSideB(e.target.value)} placeholder="Side B" style={{ border:"1px solid var(--border)",borderRadius:8,padding:"10px 12px",fontSize:13 }} />
              </div>
              <div style={{ display:"flex",gap:10 }}>
                <button onClick={createForum} style={{ background:"var(--navy)",color:"white",border:"none",padding:"10px 24px",borderRadius:8,fontWeight:700 }}>Create</button>
                <button onClick={()=>setShowNewTopic(false)} style={{ background:"transparent",color:"var(--slate)",border:"1px solid var(--border)",padding:"10px 20px",borderRadius:8 }}>Cancel</button>
              </div>
            </div>
          )}
          <div style={{ display:"flex",gap:8,marginBottom:20,flexWrap:"wrap" }}>
            {categories.map(c=><button key={c} onClick={()=>setActiveCategory(c)} style={{ background:activeCategory===c?"var(--navy)":"white",color:activeCategory===c?"white":"var(--slate)",border:"1px solid "+(activeCategory===c?"var(--navy)":"var(--border)"),padding:"7px 16px",borderRadius:20,fontSize:13,fontWeight:600 }}>{c}</button>)}
          </div>
          <div style={{ display:"grid",gap:12 }}>
            {filteredForums.map(f=>(
              <div key={f.id} style={{ background:"white",border:"1px solid var(--border)",borderRadius:12,padding:"18px 22px",display:"flex",gap:18,cursor:"pointer" }}
                onClick={()=>setActiveForum(f)} onMouseEnter={e=>e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,0.07)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
                <div style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:4,minWidth:44 }}>
                  <button onClick={e=>{e.stopPropagation();voteForumUp(f.id);}} style={{ background:"transparent",border:"1px solid var(--border)",borderRadius:6,width:32,height:28,fontWeight:700,fontSize:13,color:"var(--slate)" }}>▲</button>
                  <span style={{ fontWeight:700,color:"var(--navy)" }}>{f.votes||0}</span>
                </div>
                <div style={{ flex:1 }}>
                  <span style={{ fontSize:11,fontWeight:700,color:"var(--gold)",textTransform:"uppercase",letterSpacing:1 }}>{f.category}</span>
                  <div style={{ fontWeight:700,color:"var(--navy)",fontSize:16,margin:"4px 0 8px" }}>{f.title}</div>
                  <div style={{ display:"flex",gap:6,alignItems:"center" }}>
                    <span style={{ background:"#e8f4fd",color:"var(--blue)",fontSize:12,fontWeight:600,padding:"3px 10px",borderRadius:20 }}>{f.sideA}</span>
                    <span style={{ color:"var(--slate)",fontWeight:700 }}>vs</span>
                    <span style={{ background:"#fdecea",color:"var(--red)",fontSize:12,fontWeight:600,padding:"3px 10px",borderRadius:20 }}>{f.sideB}</span>
                  </div>
                </div>
                <div style={{ textAlign:"right",minWidth:90 }}>
                  <div style={{ fontSize:13,color:"var(--slate)" }}>💬 {f.replies||0}</div>
                  <div style={{ fontSize:12,color:"#aaa",marginTop:4 }}>by {f.author}</div>
                  <div style={{ fontSize:12,color:"#aaa" }}>{timeAgo(f.createdAt)}</div>
                </div>
              </div>
            ))}
            {filteredForums.length===0 && <div style={{ textAlign:"center",padding:60,color:"var(--slate)" }}>No topics yet!</div>}
          </div>
        </div>
      )}

      {/* FORUM DETAIL */}
      {page==="forums" && activeForum && (
        <div style={{ maxWidth:900,margin:"0 auto",padding:"40px 24px" }}>
          <button onClick={()=>setActiveForum(null)} style={{ background:"transparent",border:"1px solid var(--border)",padding:"8px 18px",borderRadius:8,marginBottom:24,color:"var(--slate)",fontWeight:600 }}>← Back</button>
          <div style={{ background:"var(--navy)",borderRadius:14,padding:32,marginBottom:24,color:"white" }}>
            <span style={{ fontSize:11,fontWeight:700,color:"var(--gold)",textTransform:"uppercase",letterSpacing:1 }}>{activeForum.category}</span>
            <h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:28,marginTop:8,marginBottom:16 }}>{activeForum.title}</h1>
            <div style={{ display:"flex",gap:12,alignItems:"center" }}>
              <span style={{ background:"rgba(255,255,255,0.1)",color:"#93c5fd",fontSize:13,fontWeight:600,padding:"6px 16px",borderRadius:20 }}>🔵 {activeForum.sideA}</span>
              <span style={{ fontWeight:700 }}>vs</span>
              <span style={{ background:"rgba(255,255,255,0.1)",color:"#fca5a5",fontSize:13,fontWeight:600,padding:"6px 16px",borderRadius:20 }}>🔴 {activeForum.sideB}</span>
              <span style={{ marginLeft:"auto",fontSize:13,color:"rgba(255,255,255,0.6)" }}>by {activeForum.author}</span>
            </div>
          </div>
          <div style={{ display:"grid",gap:14,marginBottom:20 }}>
            {forumReplies.map(r=>(
              <div key={r.id} style={{ background:"white",border:"1px solid var(--border)",borderRadius:12,padding:"18px 22px" }}>
                <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:8 }}>
                  <div style={{ width:36,height:36,borderRadius:"50%",background:"var(--navy)",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:700,fontSize:11 }}>{avatar(r.author)}</div>
                  <span style={{ fontWeight:700,color:"var(--navy)" }}>{r.author}</span>
                  <span style={{ fontSize:12,color:"var(--slate)",marginLeft:6 }}>{timeAgo(r.createdAt)}</span>
                </div>
                <p style={{ color:"#333",lineHeight:1.65 }}>{r.text}</p>
              </div>
            ))}
            {forumReplies.length===0 && <div style={{ textAlign:"center",padding:40,color:"var(--slate)" }}>No replies yet — start the debate!</div>}
          </div>
          <div style={{ background:"white",border:"1px solid var(--border)",borderRadius:12,padding:18 }}>
            <textarea value={newReply} onChange={e=>setNewReply(e.target.value)} placeholder={user?"Add your argument...":"Log in to reply..."} rows={3} disabled={!user} style={{ width:"100%",border:"1px solid var(--border)",borderRadius:8,padding:12,resize:"vertical",fontSize:15 }} />
            <div style={{ display:"flex",justifyContent:"flex-end",marginTop:10 }}>
              {user?<button onClick={postReply} style={{ background:"var(--navy)",color:"white",border:"none",padding:"10px 24px",borderRadius:8,fontWeight:700 }}>Post Reply</button>
                :<button onClick={()=>setAuthModal("login")} style={{ background:"var(--gold)",color:"var(--navy)",border:"none",padding:"10px 24px",borderRadius:8,fontWeight:700 }}>Log in to Reply</button>}
            </div>
          </div>
        </div>
      )}

      {/* DEBATES LIST */}
      {page==="debates" && !activeDebate && (
        <div style={{ maxWidth:1000,margin:"0 auto",padding:"40px 24px" }}>
          <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20 }}>
            <div><h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:36,color:"var(--navy)" }}>1v1 Debate Rooms</h1><p style={{ color:"var(--slate)",marginTop:4 }}>Lincoln-Douglas format · Timed rounds · One vote per user</p></div>
            <button onClick={()=>user?setShowNewDebate(true):setAuthModal("login")} style={{ background:"var(--gold)",color:"var(--navy)",border:"none",padding:"12px 24px",borderRadius:8,fontWeight:700,fontSize:14 }}>⚡ Start a Debate</button>
          </div>
          <div style={{ background:"var(--navy)",borderRadius:12,padding:"14px 22px",marginBottom:22,display:"flex",gap:10,flexWrap:"wrap",alignItems:"center" }}>
            <span style={{ color:"var(--gold)",fontWeight:700,fontSize:13 }}>LD Format:</span>
            {LD_ROUNDS.map(r=>(
              <span key={r.key} style={{ background:"rgba(255,255,255,0.1)",color:r.speaker==="pro"?"#93c5fd":"#fca5a5",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20 }}>{r.key} {fmtTime(r.seconds)}</span>
            ))}
          </div>
          {showNewDebate && (
            <div style={{ background:"white",border:"2px solid var(--gold)",borderRadius:12,padding:22,marginBottom:22 }}>
              <h3 style={{ fontFamily:"'Playfair Display',serif",color:"var(--navy)",marginBottom:12 }}>New 1v1 Debate</h3>
              <input value={newDebateTopic} onChange={e=>setNewDebateTopic(e.target.value)} placeholder="What's the resolution?" style={{ width:"100%",border:"1px solid var(--border)",borderRadius:8,padding:"10px 14px",fontSize:15,marginBottom:14 }} />
              <div style={{ display:"flex",gap:10 }}>
                <button onClick={createDebate} style={{ background:"var(--navy)",color:"white",border:"none",padding:"10px 24px",borderRadius:8,fontWeight:700 }}>Create Room</button>
                <button onClick={()=>setShowNewDebate(false)} style={{ background:"transparent",color:"var(--slate)",border:"1px solid var(--border)",padding:"10px 20px",borderRadius:8 }}>Cancel</button>
              </div>
            </div>
          )}
          <div style={{ display:"grid",gap:18 }}>
            {debates.map(d=>{
              const total=(d.votes1||0)+(d.votes2||0)||1;
              const pct1=Math.round((d.votes1||0)/total*100);
              const myVote=myVotes[d.id];
              const roundInfo=LD_ROUNDS[d.roundIndex||0];
              return (
                <div key={d.id} style={{ background:"white",border:"1px solid var(--border)",borderRadius:14,padding:"20px 26px" }}>
                  <div style={{ display:"flex",alignItems:"center",gap:10,marginBottom:14 }}>
                    <span style={{ background:d.status==="live"?"#dcfce7":d.status==="waiting"?"#fef9c3":"#f1f5f9",color:d.status==="live"?"var(--green)":d.status==="waiting"?"#b45309":"var(--slate)",fontSize:12,fontWeight:700,padding:"4px 10px",borderRadius:20 }}>
                      {d.status==="live"?"🔴 Live":d.status==="waiting"?"⏳ Waiting":"✓ Done"}
                    </span>
                    {d.status==="live"&&roundInfo&&<span style={{ background:roundInfo.speaker==="pro"?"#e8f4fd":"#fdecea",color:roundInfo.speaker==="pro"?"var(--blue)":"var(--red)",fontSize:12,fontWeight:700,padding:"4px 10px",borderRadius:20 }}>{roundInfo.key}</span>}
                    <span style={{ fontWeight:700,color:"var(--navy)",flex:1,textAlign:"center",fontSize:15 }}>"{d.topic}"</span>
                  </div>
                  <div style={{ display:"grid",gridTemplateColumns:"1fr 50px 1fr",gap:12,alignItems:"center",marginBottom:14 }}>
                    <div style={{ background:"#e8f4fd",borderRadius:10,padding:14,textAlign:"center" }}>
                      <div style={{ width:38,height:38,borderRadius:"50%",background:"var(--blue)",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:700,margin:"0 auto 6px" }}>{avatar(d.user1)}</div>
                      <div style={{ fontWeight:700,color:"var(--navy)",fontSize:13 }}>{d.user1}</div>
                      <div style={{ fontSize:11,color:"var(--blue)",fontWeight:700 }}>PRO / AFF</div>
                    </div>
                    <div style={{ textAlign:"center",fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:900,color:"var(--gold)" }}>VS</div>
                    <div style={{ background:"#fdecea",borderRadius:10,padding:14,textAlign:"center" }}>
                      <div style={{ width:38,height:38,borderRadius:"50%",background:d.user2?"var(--red)":"#ccc",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:700,margin:"0 auto 6px" }}>{d.user2?avatar(d.user2):"?"}</div>
                      <div style={{ fontWeight:700,color:"var(--navy)",fontSize:13 }}>{d.user2||"Open"}</div>
                      <div style={{ fontSize:11,color:"var(--red)",fontWeight:700 }}>CON / NEG</div>
                    </div>
                  </div>
                  {d.status!=="waiting" && (
                    <div style={{ marginBottom:12 }}>
                      <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:13,fontWeight:600 }}>
                        <span style={{ color:"var(--blue)" }}>AFF {pct1}%</span><span style={{ color:"var(--red)" }}>NEG {100-pct1}%</span>
                      </div>
                      <div style={{ height:8,borderRadius:4,background:"#fdecea",overflow:"hidden" }}>
                        <div style={{ width:`${pct1}%`,height:"100%",background:"var(--blue)",borderRadius:4,transition:"width 0.5s" }} />
                      </div>
                    </div>
                  )}
                  <div style={{ display:"flex",gap:10 }}>
                    {d.status==="waiting"&&user&&d.user1Id!==user.uid&&<button onClick={()=>joinDebate(d)} style={{ flex:1,background:"var(--gold)",color:"var(--navy)",border:"none",borderRadius:8,padding:"9px 0",fontWeight:700,fontSize:13 }}>Join as NEG</button>}
                    {d.status==="live"&&!myVote&&<>
                      <button onClick={()=>voteDebate(d.id,1)} style={{ flex:1,background:"white",color:"var(--blue)",border:"2px solid var(--blue)",borderRadius:8,padding:"9px 0",fontWeight:700,fontSize:13 }}>Vote AFF</button>
                      <button onClick={()=>voteDebate(d.id,2)} style={{ flex:1,background:"white",color:"var(--red)",border:"2px solid var(--red)",borderRadius:8,padding:"9px 0",fontWeight:700,fontSize:13 }}>Vote NEG</button>
                    </>}
                    {d.status==="live"&&myVote&&<div style={{ flex:1,textAlign:"center",color:"var(--slate)",fontSize:13,fontWeight:600,padding:"9px 0" }}>✓ Voted {myVote===1?"AFF":"NEG"}</div>}
                    {d.status==="live"&&<button onClick={()=>{setActiveDebate(d);setTimeLeft(LD_ROUNDS[d.roundIndex||0].seconds);}} style={{ flex:1,background:"var(--navy)",color:"white",border:"none",borderRadius:8,padding:"9px 0",fontWeight:700,fontSize:13 }}>Watch →</button>}
                  </div>
                </div>
              );
            })}
            {debates.length===0&&<div style={{ textAlign:"center",padding:60,color:"var(--slate)" }}>No debates yet!</div>}
          </div>
        </div>
      )}

      {/* DEBATE ROOM */}
      {page==="debates" && activeDebate && (
        <div style={{ maxWidth:960,margin:"0 auto",padding:"40px 24px" }}>
          <button onClick={()=>setActiveDebate(null)} style={{ background:"transparent",border:"1px solid var(--border)",padding:"8px 18px",borderRadius:8,marginBottom:24,color:"var(--slate)",fontWeight:600 }}>← Back</button>
          <div style={{ background:"var(--navy)",borderRadius:14,padding:"24px 32px",marginBottom:20 }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:20 }}>
              <div style={{ flex:1 }}>
                <span style={{ background:activeDebate.status==="live"?"#dc2626":"#6b7280",color:"white",fontSize:12,fontWeight:700,padding:"4px 12px",borderRadius:20,display:"inline-block",marginBottom:10 }}>
                  {activeDebate.status==="live"?"🔴 LIVE":activeDebate.status==="waiting"?"⏳ WAITING":"✓ COMPLETED"}
                </span>
                <h2 style={{ fontFamily:"'Playfair Display',serif",color:"white",fontSize:22 }}>"{activeDebate.topic}"</h2>
              </div>
              {activeDebate.status==="live" && currentRound && (
                <div style={{ textAlign:"center",minWidth:160 }}>
                  <div style={{ color:"var(--gold)",fontSize:12,fontWeight:700,marginBottom:2 }}>{currentRound.key} — {currentRound.label}</div>
                  <div style={{ fontFamily:"'Playfair Display',serif",fontSize:52,fontWeight:900,color:timeLeft<=30?"#ef4444":"white",animation:timeLeft<=10&&timerRunning?"pulse 1s infinite":"none",lineHeight:1 }}>{fmtTime(timeLeft??currentRound.seconds)}</div>
                  <div style={{ fontSize:11,color:"rgba(255,255,255,0.55)",margin:"4px 0 10px" }}>{currentRound.desc}</div>
                  {isDebater && (
                    <div style={{ display:"flex",gap:8,justifyContent:"center" }}>
                      <button onClick={()=>setTimerRunning(t=>!t)} style={{ background:timerRunning?"#ef4444":"var(--gold)",color:"white",border:"none",borderRadius:6,padding:"6px 14px",fontWeight:700,fontSize:13 }}>{timerRunning?"⏸ Pause":"▶ Start"}</button>
                      <button onClick={advanceRound} style={{ background:"rgba(255,255,255,0.15)",color:"white",border:"none",borderRadius:6,padding:"6px 14px",fontWeight:700,fontSize:13 }}>
                        {(activeDebate.roundIndex||0)>=LD_ROUNDS.length-1?"End":"Next →"}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            {activeDebate.status==="live" && (
              <div style={{ display:"flex",gap:6,marginTop:16,flexWrap:"wrap" }}>
                {LD_ROUNDS.map((r,i)=>(
                  <div key={r.key} style={{ background:i<(activeDebate.roundIndex||0)?"rgba(255,255,255,0.25)":i===(activeDebate.roundIndex||0)?"var(--gold)":"rgba(255,255,255,0.08)",color:i===(activeDebate.roundIndex||0)?"var(--navy)":"white",fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20 }}>{r.key}</div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:18 }}>
            {[{u:activeDebate.user1,lbl:"PRO / AFF",col:"var(--blue)",bg:"#e8f4fd",spk:"pro"},{u:activeDebate.user2||"Waiting...",lbl:"CON / NEG",col:"var(--red)",bg:"#fdecea",spk:"con"}].map(p=>(
              <div key={p.lbl} style={{ background:p.bg,borderRadius:12,padding:16,textAlign:"center",border:currentRound&&currentRound.speaker===p.spk?`2px solid ${p.col}`:"2px solid transparent" }}>
                <div style={{ width:42,height:42,borderRadius:"50%",background:p.col,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:700,fontSize:13,margin:"0 auto 8px" }}>{avatar(p.u)}</div>
                <div style={{ fontWeight:700,color:"var(--navy)" }}>{p.u}</div>
                <div style={{ color:p.col,fontWeight:700,fontSize:12,marginTop:2 }}>{p.lbl}</div>
                {currentRound&&currentRound.speaker===p.spk&&<div style={{ marginTop:6,fontSize:11,color:p.col,fontWeight:700,background:"white",padding:"2px 10px",borderRadius:20,display:"inline-block" }}>🎤 Speaking</div>}
              </div>
            ))}
          </div>
          <div style={{ background:"white",border:"1px solid var(--border)",borderRadius:14,marginBottom:16 }}>
            <div style={{ padding:"12px 20px",borderBottom:"1px solid var(--border)",fontWeight:700,color:"var(--navy)",background:"#fafafa",borderRadius:"14px 14px 0 0",display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <span>Transcript</span>
              {currentRound&&<span style={{ fontSize:12,color:"var(--slate)",fontWeight:500 }}>{currentRound.label}</span>}
            </div>
            <div style={{ maxHeight:360,overflowY:"auto",padding:"16px 20px",display:"flex",flexDirection:"column",gap:12 }}>
              {debateMsgs.map(m=>(
                <div key={m.id} style={{ display:"flex",gap:12 }}>
                  <div style={{ width:34,height:34,borderRadius:"50%",background:m.authorId===activeDebate.user1Id?"var(--blue)":"var(--red)",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:700,fontSize:10,flexShrink:0 }}>{avatar(m.author)}</div>
                  <div style={{ flex:1,background:"#f8f9fa",borderRadius:10,padding:"10px 14px" }}>
                    <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                      <span style={{ fontWeight:700,color:"var(--navy)",fontSize:13 }}>{m.author}</span>
                      <span style={{ fontSize:11,color:"var(--slate)" }}>{m.roundKey} · {timeAgo(m.createdAt)}</span>
                    </div>
                    <p style={{ color:"#333",lineHeight:1.6,fontSize:14 }}>{m.text}</p>
                  </div>
                </div>
              ))}
              {debateMsgs.length===0&&<div style={{ textAlign:"center",padding:36,color:"var(--slate)" }}>Start the timer to begin the debate!</div>}
            </div>
          </div>
          {isDebater&&activeDebate.status==="live"&&(
            <div style={{ background:"white",border:"1px solid var(--border)",borderRadius:12,padding:16 }}>
              {isMyTurn?(
                <>
                  <div style={{ marginBottom:8,fontSize:13,fontWeight:700,color:currentRound?.speaker==="pro"?"var(--blue)":"var(--red)" }}>🎤 Your turn — {currentRound?.label}</div>
                  <div style={{ display:"flex",gap:10 }}>
                    <textarea value={chatInput} onChange={e=>setChatInput(e.target.value)} placeholder="Submit your argument..." rows={2} style={{ flex:1,border:"1px solid var(--border)",borderRadius:8,padding:"10px 12px",resize:"none",fontSize:14 }} />
                    <button onClick={sendDebateMsg} style={{ background:"var(--navy)",color:"white",border:"none",padding:"0 24px",borderRadius:8,fontWeight:700,alignSelf:"stretch" }}>Submit</button>
                  </div>
                </>
              ):(
                <div style={{ textAlign:"center",color:"var(--slate)",padding:"12px 0",fontSize:14 }}>
                  ⏳ Waiting for {currentRound?.speaker==="pro"?activeDebate.user1:activeDebate.user2} to speak ({currentRound?.label})
                </div>
              )}
            </div>
          )}
          {!isDebater&&activeDebate.status==="live"&&(
            <div style={{ textAlign:"center",padding:16 }}>
              {!myVotes[activeDebate.id]?(
                <div style={{ display:"flex",gap:12,justifyContent:"center" }}>
                  <button onClick={()=>voteDebate(activeDebate.id,1)} style={{ background:"white",color:"var(--blue)",border:"2px solid var(--blue)",borderRadius:8,padding:"10px 28px",fontWeight:700 }}>Vote AFF</button>
                  <button onClick={()=>voteDebate(activeDebate.id,2)} style={{ background:"white",color:"var(--red)",border:"2px solid var(--red)",borderRadius:8,padding:"10px 28px",fontWeight:700 }}>Vote NEG</button>
                </div>
              ):<div style={{ color:"var(--slate)",fontWeight:600 }}>✓ You voted {myVotes[activeDebate.id]===1?"AFF":"NEG"}</div>}
            </div>
          )}
          {!user&&<div style={{ textAlign:"center",padding:20 }}><button onClick={()=>setAuthModal("login")} style={{ background:"var(--gold)",color:"var(--navy)",border:"none",padding:"12px 28px",borderRadius:8,fontWeight:700,fontSize:15 }}>Log in to participate</button></div>}
        </div>
      )}

      {/* LEADERBOARD */}
      {page==="leaderboard"&&(
        <div style={{ maxWidth:900,margin:"0 auto",padding:"40px 24px" }}>
          <h1 style={{ fontFamily:"'Playfair Display',serif",fontSize:36,color:"var(--navy)",marginBottom:6 }}>Rankings</h1>
          <p style={{ color:"var(--slate)",marginBottom:28 }}>Elo updates after every completed debate (+32 win / -16 loss)</p>
          <div style={{ background:"white",border:"1px solid var(--border)",borderRadius:14,overflow:"hidden" }}>
            <div style={{ display:"grid",gridTemplateColumns:"60px 1fr 120px 100px 130px",padding:"12px 24px",background:"#f8f9fa",borderBottom:"1px solid var(--border)",fontSize:12,fontWeight:700,color:"var(--slate)",textTransform:"uppercase",letterSpacing:0.5 }}>
              <div>Rank</div><div>Debater</div><div style={{ textAlign:"center" }}>Rating</div><div style={{ textAlign:"center" }}>W/L</div><div style={{ textAlign:"center" }}>Badge</div>
            </div>
            {leaders.map((u,i)=>(
              <div key={u.id} style={{ display:"grid",gridTemplateColumns:"60px 1fr 120px 100px 130px",padding:"16px 24px",borderBottom:i<leaders.length-1?"1px solid var(--border)":"none",alignItems:"center" }}>
                <div style={{ fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:900,color:i===0?"#c9a84c":i===1?"#9ca3af":i===2?"#b45309":"var(--slate)" }}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}</div>
                <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                  <div style={{ width:40,height:40,borderRadius:"50%",background:"var(--navy)",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontWeight:700,fontSize:12 }}>{avatar(u.displayName)}</div>
                  <span style={{ fontWeight:700,color:"var(--navy)" }}>{u.displayName}</span>
                </div>
                <div style={{ textAlign:"center",fontWeight:800,color:"var(--navy)",fontSize:18,fontFamily:"'Playfair Display',serif" }}>{u.rating||1200}</div>
                <div style={{ textAlign:"center",fontSize:13 }}><span style={{ color:"var(--green)",fontWeight:700 }}>{u.wins||0}W</span> / <span style={{ color:"var(--red)",fontWeight:700 }}>{u.losses||0}L</span></div>
                <div style={{ textAlign:"center" }}><span style={{ background:"#f1f5f9",color:"var(--slate)",fontSize:12,fontWeight:700,padding:"4px 12px",borderRadius:20 }}>{u.badge||"Novice"}</span></div>
              </div>
            ))}
            {leaders.length===0&&<div style={{ textAlign:"center",padding:60,color:"var(--slate)" }}>No ranked members yet!</div>}
          </div>
        </div>
      )}

      <footer style={{ borderTop:"1px solid var(--border)",padding:"28px 24px",textAlign:"center",marginTop:60,background:"white" }}>
        <div style={{ fontFamily:"'Playfair Display',serif",fontWeight:900,color:"var(--navy)",fontSize:18,marginBottom:4 }}>DebateArena</div>
        <div style={{ fontSize:13,color:"var(--slate)" }}>Where ideas compete · Built for serious discourse</div>
      </footer>
    </div>
  );
}