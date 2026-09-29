"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Task = { id: string; weekStart: string; day: number; name: string; desc: string; done: boolean };
type User = { name: string; email: string; bio: string; avatar: string };

const NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const SH = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const z = (n: number) => (n < 10 ? "0" : "") + n;
const iso = (d: Date) => `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
const dateOf = (wk: string, day: number) => {
  const [y, m, d] = wk.split("-").map(Number);
  return new Date(y, m - 1, d + day);
};
const pc = (d: number, t: number) => (t ? Math.round((d / t) * 100) : 0);
const level = (p: number, t: number) =>
  !t ? "Add tasks to begin" : p >= 90 ? "Outstanding" : p >= 75 ? "Very productive"
  : p >= 50 ? "Fairly productive" : p >= 25 ? "Slipping behind" : "Needs a push";

async function api(url: string, method: string, body?: unknown) {
  const r = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.error || "Request failed");
  return data;
}

function Avatar({ pic, name, big }: { pic: string; name: string; big?: boolean }) {
  return (
    <div className={"av" + (big ? " big" : "")}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {pic ? <img src={pic} alt="" /> : (name || "?").charAt(0).toUpperCase()}
    </div>
  );
}

export default function WeekApp({ initialTasks, initialUser }: { initialTasks: Task[]; initialUser: User }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false); // dates depend on the browser's timezone
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [user, setUser] = useState<User>(initialUser);
  const [sel, setSel] = useState(0);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [err, setErr] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const [profOpen, setProfOpen] = useState(false);
  const [pName, setPName] = useState("");
  const [pBio, setPBio] = useState("");
  const [pPic, setPPic] = useState("");
  const [pNote, setPNote] = useState("");

  const NOW = new Date();
  NOW.setHours(0, 0, 0, 0);
  const TODAY = (NOW.getDay() + 6) % 7;
  const MON = new Date(NOW);
  MON.setDate(NOW.getDate() - TODAY);
  const WK = iso(MON);

  useEffect(() => {
    setSel(TODAY);
    setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!mounted) return null;

  const mine = tasks.filter((t) => t.weekStart === WK);
  const due = mine.filter((t) => t.day <= TODAY);
  const dd = due.filter((t) => t.done).length;
  const p = pc(dd, due.length);
  const missed = due.filter((t) => !t.done && t.day < TODAY).length;

  const all = tasks.map((t) => ({ ...t, d: dateOf(t.weekStart, t.day) })).map((t) => ({ ...t, due: t.d <= NOW }));
  const mk = `${NOW.getFullYear()}-${z(NOW.getMonth() + 1)}`;
  const moTasks = all.filter((x) => x.due && iso(x.d).slice(0, 7) === mk);
  const moPct = pc(moTasks.filter((x) => x.done).length, moTasks.length);

  const months: Record<string, { d: number; t: number }> = {};
  all.filter((x) => x.due).forEach((x) => {
    const k = iso(x.d).slice(0, 7);
    months[k] = months[k] || { d: 0, t: 0 };
    months[k].t++;
    if (x.done) months[k].d++;
  });
  const weeks = Array.from(new Set(tasks.map((t) => t.weekStart))).sort().reverse().slice(0, 8);

  const isPast = sel < TODAY;
  const isToday = sel === TODAY;
  const list = mine.filter((t) => t.day === sel);
  const fmt: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return;
    try {
      const { task } = await api("/api/tasks", "POST", { weekStart: WK, day: sel, name: n, desc: desc.trim() });
      setTasks((ts) => [...ts, task]);
      setName(""); setDesc(""); setErr("");
    } catch (e) { setErr((e as Error).message); }
  }

  async function toggle(t: Task) {
    if (sel !== TODAY) return;
    setTasks((ts) => ts.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)));
    try { await api(`/api/tasks/${t.id}`, "PATCH", { done: !t.done }); }
    catch { setTasks((ts) => ts.map((x) => (x.id === t.id ? { ...x, done: t.done } : x))); setErr("Could not save. Try again."); }
  }

  async function remove(t: Task) {
    const before = tasks;
    setTasks((ts) => ts.filter((x) => x.id !== t.id));
    try { await api(`/api/tasks/${t.id}`, "DELETE"); }
    catch { setTasks(before); setErr("Could not delete. Try again."); }
  }

  async function redo(t: Task) {
    try {
      const { task } = await api("/api/tasks", "POST", { weekStart: WK, day: TODAY, name: t.name, desc: t.desc });
      setTasks((ts) => [...ts, task]);
      setSel(TODAY);
    } catch (e) { setErr((e as Error).message); }
  }

  async function clearWeek() {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    setConfirmClear(false);
    try {
      await api(`/api/tasks?week=${WK}`, "DELETE");
      setTasks((ts) => ts.filter((t) => t.weekStart !== WK));
    } catch (e) { setErr((e as Error).message); }
  }

  function openProfile() {
    setPName(user.name); setPBio(user.bio); setPPic(user.avatar); setPNote(""); setProfOpen(true);
  }

  function pickPic(f?: File) {
    if (!f) return;
    if (!/^image\/(png|jpe?g|webp|gif)$/.test(f.type)) { setPNote("Please choose a PNG, JPG, WebP or GIF image."); return; }
    const r = new FileReader();
    r.onload = () => {
      const im = new Image();
      im.onload = () => {
        const c = document.createElement("canvas"), n = 160, s = Math.min(im.width, im.height);
        c.width = c.height = n;
        c.getContext("2d")!.drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, n, n);
        setPPic(c.toDataURL("image/jpeg", 0.82)); setPNote("");
      };
      im.onerror = () => setPNote("That image could not be read.");
      im.src = r.result as string;
    };
    r.readAsDataURL(f);
  }

  async function saveProfile() {
    const next = { ...user, name: pName.trim() || user.name, bio: pBio.trim(), avatar: pPic };
    try {
      await api("/api/profile", "PUT", { name: next.name, bio: next.bio, avatar: next.avatar });
      setUser(next); setProfOpen(false);
    } catch (e) { setPNote((e as Error).message); }
  }

  async function logout() {
    await api("/api/auth/logout", "POST");
    router.push("/login");
    router.refresh();
  }

  return (
    <main>
      <div className="who">
        <Avatar pic={user.avatar} name={user.name} />
        <div className="wi"><b>{user.name}</b><span>{user.bio || user.email}</span></div>
        <div className="sp">
          <button className="ghost sm" onClick={openProfile}>Edit profile</button>
          <button className="ghost sm" onClick={logout}>Log out</button>
        </div>
      </div>

      {profOpen && (
        <section className="prof" aria-label="Edit profile">
          <h2>Your profile</h2>
          <div className="pr">
            <Avatar pic={pPic} name={pName || user.name} big />
            <div className="pa">
              <label className="ghost" style={{ cursor: "pointer" }}>
                Change photo
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden
                  onChange={(e) => { pickPic(e.target.files?.[0]); e.target.value = ""; }} />
              </label>
              <button type="button" className="ghost" onClick={() => setPPic("")}>Remove photo</button>
            </div>
          </div>
          <input value={pName} onChange={(e) => setPName(e.target.value)} maxLength={40} placeholder="Display name" aria-label="Display name" />
          <textarea value={pBio} onChange={(e) => setPBio(e.target.value)} maxLength={160} placeholder="Short bio" aria-label="Bio" />
          {pNote && <p className="err">{pNote}</p>}
          <div className="pa">
            <button type="button" className="btn" onClick={saveProfile}>Save profile</button>
            <button type="button" className="ghost" onClick={() => setProfOpen(false)}>Cancel</button>
          </div>
        </section>
      )}

      <h1>My Week</h1>
      <p className="sub">Plan Monday to Sunday. Finish each task on its own day.</p>

      <section className="hero" aria-live="polite">
        <div className="top">
          <div className="ring" style={{ ["--p" as string]: p }}><div>{p}%</div></div>
          <div>
            <div className="lvl">{level(p, due.length)}</div>
            <p>{due.length ? `Productivity so far: ${dd} of ${due.length} tasks done, ${missed} missed.` : "Productivity counts tasks due up to today."}</p>
          </div>
        </div>
        <div className="split">
          <div><b>{pc(mine.filter((t) => t.done).length, mine.length)}%</b><span>Whole week completed</span></div>
          <div><b>{moPct}%</b><span>{NOW.toLocaleDateString(undefined, { month: "long" })} productivity</span></div>
        </div>
      </section>

      <div className="tabs" role="tablist">
        {SH.map((s, i) => {
          const dl = mine.filter((t) => t.day === i);
          const done = dl.filter((t) => t.done).length;
          const d = dateOf(WK, i);
          const cls = "tab" + (i === TODAY ? " today" : "") + (i < TODAY ? " past" : "") + (dl.length && done < dl.length ? " miss" : "");
          return (
            <button key={s} className={cls} role="tab" aria-selected={i === sel} onClick={() => setSel(i)}>
              <b>{s}</b><em>{d.getDate()}</em>
              <span>{d.toLocaleDateString(undefined, { month: "short" })}</span>
              <div className="mini"><i style={{ width: pc(done, dl.length) + "%" }} /></div>
            </button>
          );
        })}
      </div>

      <h2>{NAMES[sel]}, {dateOf(WK, sel).toLocaleDateString(undefined, fmt)}{isToday ? " (today)" : ""}</h2>
      <p className="note">
        {isToday ? "You can tick tasks off today."
          : isPast ? "This day is over. You can still add tasks, but they can't be completed."
          : `Tasks unlock on ${NAMES[sel]}.`}
      </p>

      <form onSubmit={addTask}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Task name" maxLength={80} required aria-label="Task name" />
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Short description (optional)" maxLength={200} aria-label="Task description" />
        {err && <p className="err" role="alert">{err}</p>}
        <button className="btn" type="submit">Add task</button>
      </form>

      <ul className="list">
        {!list.length && <li className="empty">Nothing planned yet.</li>}
        {list.map((t) => {
          const miss = isPast && !t.done;
          return (
            <li key={t.id} className={"task" + (t.done ? " done" : "") + (miss ? " miss" : "")}>
              <input type="checkbox" aria-label="Mark done" checked={t.done} disabled={!isToday} onChange={() => toggle(t)} />
              <div className="t">
                <b>{t.name}</b>
                {t.desc && <small>{t.desc}</small>}
                {miss ? <span className="tag m">Missed</span> : !isToday && !isPast ? <span className="tag">Locked until {SH[sel]}</span> : null}
              </div>
              {miss && <button className="redo" onClick={() => redo(t)}>Redo today</button>}
              <button className="del" aria-label="Delete task" onClick={() => remove(t)}>Delete</button>
            </li>
          );
        })}
      </ul>

      <section className="hist">
        <h2>History</h2>
        <h3>Monthly productivity</h3>
        {Object.keys(months).length ? Object.keys(months).sort().reverse().map((k) => {
          const v = months[k], q = pc(v.d, v.t);
          const dt = new Date(+k.slice(0, 4), +k.slice(5) - 1, 1);
          return (
            <div className="row" key={k}>
              <span>{dt.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</span>
              <div className="bar"><i style={{ width: q + "%" }} /></div><b>{q}%</b>
            </div>
          );
        }) : <p className="note">Monthly results appear once you have tasks due.</p>}
        <h3>Recent weeks</h3>
        {weeks.length ? weeks.map((w) => {
          const ts = tasks.filter((t) => t.weekStart === w && dateOf(w, t.day) <= NOW);
          if (!ts.length) return null;
          const q = pc(ts.filter((t) => t.done).length, ts.length);
          return (
            <div className="row" key={w}>
              <span>{dateOf(w, 0).toLocaleDateString(undefined, fmt)} to {dateOf(w, 6).toLocaleDateString(undefined, fmt)}</span>
              <div className="bar"><i style={{ width: q + "%" }} /></div><b>{q}%</b>
            </div>
          );
        }) : <p className="note">No weeks recorded yet.</p>}
      </section>

      <div className="foot"><button className="ghost" onClick={clearWeek}>{confirmClear ? "Tap again to confirm" : "Clear this week"}</button></div>
    </main>
  );
}
