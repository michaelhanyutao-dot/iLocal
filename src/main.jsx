import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Calendar,
  Check,
  ClipboardList,
  Database,
  Heart,
  Languages,
  List,
  LocateFixed,
  Map,
  Navigation,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Upload,
  UserPlus,
  UserRound,
} from "lucide-react";
import { categories, descFor, districtFor, labelFor, priceFor } from "./lib/categories";
import { getAdminContent, getExploreItems, bulkInsert, track } from "./lib/data";
import { parseImport, templateFor } from "./lib/importer";
import { localDateTime, t } from "./lib/i18n";
import { hasSupabaseConfig } from "./lib/supabase";
import "./styles.css";

function App() {
  const [lang, setLang] = useState(localStorage.getItem("ilocal_lang") || "zh");
  const [tab, setTab] = useState("explore");
  const [items, setItems] = useState([]);
  const [demoMode, setDemoMode] = useState(!hasSupabaseConfig);
  const [saved, setSaved] = useState(() => new Set(JSON.parse(localStorage.getItem("ilocal_saved") || "[]")));

  useEffect(() => {
    localStorage.setItem("ilocal_lang", lang);
  }, [lang]);

  useEffect(() => {
    getExploreItems().then(({ items: next, demo }) => {
      setItems(next);
      setDemoMode(demo);
    });
  }, []);

  function toggleSaved(item) {
    const id = item.id;
    setSaved((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem("ilocal_saved", JSON.stringify([...next]));
      track(next.has(id) ? "item_saved" : "item_unsaved", { id, content_kind: item.content_kind });
      return next;
    });
  }

  const savedItems = items.filter((item) => saved.has(item.id));

  return (
    <div className="app-shell">
      <main className="phone-frame">
        <Header lang={lang} setLang={setLang} demoMode={demoMode} />
        {tab === "explore" && <Explore items={items} saved={saved} onSave={toggleSaved} lang={lang} />}
        {tab === "saved" && <Saved items={savedItems} lang={lang} onSave={toggleSaved} />}
        {tab === "admin" && <Admin lang={lang} />}
        {tab === "profile" && <Profile lang={lang} demoMode={demoMode} openAdmin={() => setTab("admin")} />}
      </main>
      <nav className="bottom-nav" aria-label="Primary">
        <NavButton active={tab === "explore"} onClick={() => setTab("explore")} Icon={Map} label={t(lang, "explore")} />
        <NavButton active={tab === "saved"} onClick={() => setTab("saved")} Icon={ClipboardList} label={t(lang, "saved")} />
        <NavButton active={tab === "profile"} onClick={() => setTab("profile")} Icon={UserRound} label={t(lang, "profile")} />
      </nav>
    </div>
  );
}

function Header({ lang, setLang, demoMode }) {
  return (
    <header className="header">
      <div className="brand-mark">
        <Send size={30} />
      </div>
      <div>
        <h1>iLocal</h1>
        <p>{t(lang, "tagline")}</p>
      </div>
      <button className="chip icon-chip" onClick={() => setLang(lang === "zh" ? "en" : "zh")} title="Language">
        <Languages size={18} />
        {lang === "zh" ? "EN" : "中"}
      </button>
      <button className="chip login-chip" title="Login">
        <UserPlus size={18} />
        {lang === "en" ? "Log in" : "登录 / 注册"}
      </button>
      {demoMode && <span className="demo-dot" title={t(lang, "demoMode")} />}
    </header>
  );
}

function Explore({ items, saved, onSave, lang }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [view, setView] = useState("map");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((item) => category === "all" || item.category === category || item.tags?.includes(category))
      .filter((item) => {
        if (!q) return true;
        return [labelFor(item, lang), descFor(item, lang), districtFor(item), item.category, ...(item.tags || [])]
          .join(" ")
          .toLowerCase()
          .includes(q);
      });
  }, [items, query, category, lang]);

  return (
    <section className="explore">
      <div className="search-row">
        <Search size={18} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t(lang, "search")} />
        <button className="search-action" onClick={() => track("search_submitted", { query })}>
          {lang === "en" ? "Search" : "搜索"}
        </button>
        <button className="filter-action" title="Filters">
          <SlidersHorizontal size={18} />
        </button>
      </div>
      <div className="category-row">
        {categories.map(({ key, label_zh, label_en, Icon }) => (
          <button key={key} className={`category ${category === key ? "active" : ""}`} onClick={() => setCategory(key)}>
            <Icon size={15} />
            {lang === "en" ? label_en : label_zh}
          </button>
        ))}
      </div>
      <div className="view-toolbar">
        <strong>
          {t(lang, "found")} {filtered.length} {t(lang, "items")}
        </strong>
      </div>
      <div className="content-zone">
        {view === "map" ? <MapPanel items={filtered} lang={lang} saved={saved} onSave={onSave} /> : <Masonry items={filtered} lang={lang} saved={saved} onSave={onSave} />}
        <div className="segmented floating-toggle">
          <button className={view === "map" ? "active" : ""} onClick={() => setView("map")}>
            <Map size={16} /> {t(lang, "map")}
          </button>
          <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}>
            <List size={16} /> {t(lang, "list")}
          </button>
        </div>
      </div>
    </section>
  );
}

function MapPanel({ items, lang, saved, onSave }) {
  const [selected, setSelected] = useState(items[0] || null);
  useEffect(() => setSelected(items[0] || null), [items]);
  return (
    <div className="map-panel">
      <div className="map-grid" aria-label="Beijing map preview">
        <button className="locate"><LocateFixed size={17} /> {t(lang, "currentLocation")}</button>
        {items.slice(0, 24).map((item, index) => (
          <button
            key={item.id}
            className={`marker ${selected?.id === item.id ? "active" : ""}`}
            style={{ left: `${18 + (index * 23) % 68}%`, top: `${18 + (index * 31) % 58}%` }}
            onClick={() => setSelected(item)}
            aria-label={labelFor(item, lang)}
          />
        ))}
      </div>
      {selected && <PreviewCard item={selected} lang={lang} saved={saved.has(selected.id)} onSave={() => onSave(selected)} />}
    </div>
  );
}

function PreviewCard({ item, lang, saved, onSave }) {
  return (
    <article className="preview-card">
      <img src={item.image_url} alt={labelFor(item, lang)} />
      <div>
        <span className="eyebrow">{item.content_kind === "event" ? t(lang, "event") : t(lang, "venue")}</span>
        <h3>{labelFor(item, lang)}</h3>
        <p>{districtFor(item)} · {priceFor(item, lang)}</p>
      </div>
      <button className={saved ? "round active" : "round"} onClick={onSave} title={t(lang, "save")}>
        <Check size={17} />
      </button>
      <a className="round" href={navUrl(item)} target="_blank" rel="noreferrer" title="Navigate">
        <Navigation size={17} />
      </a>
    </article>
  );
}

function Masonry({ items, lang, saved, onSave }) {
  if (!items.length) return <p className="empty">{t(lang, "noResults")}</p>;
  return (
    <div className="masonry">
      {items.map((item) => (
        <article className="card" key={item.id}>
          <img src={item.image_url} alt={labelFor(item, lang)} />
          <button className={saved.has(item.id) ? "save-button active" : "save-button"} onClick={() => onSave(item)}>
            <Heart size={15} fill={saved.has(item.id) ? "currentColor" : "none"} />
          </button>
          <div className="card-body">
            <span className="eyebrow">{item.content_kind === "event" ? t(lang, "event") : t(lang, "venue")}</span>
            <h3>{labelFor(item, lang)}</h3>
            <p>{descFor(item, lang)}</p>
            {item.starts_at && <time>{localDateTime(item.starts_at, lang)}</time>}
            <div className="meta">
              <span>{districtFor(item)}</span>
              <strong>{priceFor(item, lang)}</strong>
            </div>
            <div className="tags">{(item.tags || []).slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}</div>
          </div>
        </article>
      ))}
    </div>
  );
}

function Saved({ items, lang, onSave }) {
  const groups = [
    ["saved", items],
    ["want", []],
    ["plan", []],
    ["visited", []],
  ];
  return (
    <section className="panel">
      <h2>{t(lang, "saved")}</h2>
      <div className="status-grid">
        {groups.map(([key, rows]) => <div key={key}><strong>{rows.length}</strong><span>{t(lang, key)}</span></div>)}
      </div>
      <Masonry items={items} lang={lang} saved={new Set(items.map((item) => item.id))} onSave={onSave} />
    </section>
  );
}

function Admin({ lang }) {
  const [kind, setKind] = useState("event");
  const [content, setContent] = useState(templateFor("event"));
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({ venues: [], events: [], demo: true });
  const [message, setMessage] = useState("");

  useEffect(() => {
    getAdminContent().then(setStats).catch((error) => setMessage(error.message));
  }, []);

  function changeKind(next) {
    setKind(next);
    setContent(templateFor(next));
    setRows([]);
  }

  function preview() {
    try {
      setRows(parseImport(content, kind));
      setMessage("");
    } catch (error) {
      setRows([]);
      setMessage(error.message);
    }
  }

  async function publish() {
    try {
      const inserted = await bulkInsert(kind, rows);
      setMessage(`Inserted ${inserted.length} ${kind} records.`);
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <section className="admin panel">
      <h2>{t(lang, "admin")}</h2>
      <div className="admin-stats">
        <Stat Icon={Database} label="Venues" value={stats.venues.length} />
        <Stat Icon={Calendar} label="Events" value={stats.events.length} />
        <Stat Icon={Upload} label="Preview" value={rows.length} />
      </div>
      <div className="segmented wide">
        <button className={kind === "event" ? "active" : ""} onClick={() => changeKind("event")}>Events</button>
        <button className={kind === "venue" ? "active" : ""} onClick={() => changeKind("venue")}>Venues</button>
      </div>
      <label className="field-label">{t(lang, "pasteJson")}</label>
      <textarea value={content} onChange={(event) => setContent(event.target.value)} />
      <div className="action-row">
        <button className="secondary" onClick={preview}>{t(lang, "preview")}</button>
        <button onClick={publish} disabled={!rows.length}>{t(lang, "publish")}</button>
      </div>
      {message && <p className="notice">{message}</p>}
      {stats.demo && <p className="notice">{t(lang, "demoMode")}</p>}
      <div className="table-preview">
        {rows.slice(0, 6).map((row, index) => (
          <div key={index}>
            <strong>{row.title_zh || row.name_zh || "Untitled"}</strong>
            <span>{row.category} · {row.business_area || row.district}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Profile({ lang, demoMode, openAdmin }) {
  return (
    <section className="panel profile">
      <h2>{t(lang, "profile")}</h2>
      <div className="profile-card">
        <p>iLocal MVP is now wired for Supabase, Beijing-first content, bilingual fields, lifecycle planning, and admin imports.</p>
      </div>
      <div className="profile-actions">
        <button onClick={openAdmin}>
          <ShieldCheck size={18} />
          {t(lang, "admin")}
        </button>
      </div>
      {demoMode && <p className="notice">{t(lang, "demoMode")}</p>}
    </section>
  );
}

function Stat({ Icon, label, value }) {
  return <div><Icon size={16} /><strong>{value}</strong><span>{label}</span></div>;
}

function NavButton({ active, onClick, Icon, label }) {
  return (
    <button className={active ? "active" : ""} onClick={onClick}>
      <Icon size={18} />
      {label}
    </button>
  );
}

function navUrl(item) {
  return `https://apis.map.qq.com/uri/v1/routeplan?type=walk&to=${item.latitude},${item.longitude}&toaddr=${encodeURIComponent(labelFor(item, "zh"))}`;
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
