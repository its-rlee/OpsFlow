import { useEffect, useMemo, useState } from 'react';
import { Activity, ArrowDown, ArrowRight, Bell, Check, CheckCircle2, ChevronDown, CircleHelp, Clock3, Filter, Inbox, LayoutDashboard, LifeBuoy, Menu, Plus, Search, Settings2, ShieldCheck, Sparkles, TicketCheck, TrendingUp, Users, X } from 'lucide-react';

type Status = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
type Priority = 'LOW' | 'MEDIUM' | 'HIGH';
type Ticket = {
  id: string; title: string; description: string; status: Status;
  priority: Priority; assignee: string | null; version: number;
  createdAt: string; updatedAt: string;
};
type ApiError = { error?: string };
const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const statuses: Record<Status, string> = { OPEN: 'Open', IN_PROGRESS: 'In progress', RESOLVED: 'Resolved' };
const priorityLabels: Record<Priority, string> = { HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' };
const relative = (value: string) => fmt.format(new Date(value));

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, init);
  const data: T & ApiError = await response.json();
  if (!response.ok) throw new Error(data.error ?? 'Request failed');
  return data;
}

export default function App() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [form, setForm] = useState<{title:string; description:string; priority:Priority}>({title:'',description:'',priority:'MEDIUM'});

  const refresh = async () => {
    try { setError(''); setTickets(await api<Ticket[]>('/api/tickets')); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load tickets'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void refresh(); }, []);
  const counts = useMemo(() => ({
    total: tickets.length,
    open: tickets.filter(t => t.status === 'OPEN').length,
    progress: tickets.filter(t => t.status === 'IN_PROGRESS').length,
    resolved: tickets.filter(t => t.status === 'RESOLVED').length,
  }), [tickets]);
  const visible = useMemo(() => tickets.filter(t => {
    const matchesText = (t.title + ' ' + t.description + ' ' + (t.assignee || '')).toLowerCase().includes(search.toLowerCase());
    return matchesText && (filter === 'ALL' || t.status === filter);
  }), [tickets, search, filter]);
  const active = tickets.find(t => t.id === selected);
  async function createTicket(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true); setError('');
    try {
      await api('/api/tickets', { method:'POST', headers:{'Content-Type':'application/json', 'Idempotency-Key':crypto.randomUUID()}, body:JSON.stringify(form) });
      setCreating(false); setForm({title:'',description:'',priority:'MEDIUM'}); await refresh();
    } catch(e) { setError(e instanceof Error ? e.message : 'Could not create ticket'); }
    finally { setSubmitting(false); }
  }
  async function action(path: string, body: object) {
    setSubmitting(true); setError('');
    try { await api(path, { method: path.endsWith('/claim') ? 'POST' : 'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) }); await refresh(); }
    catch(e) { setError(e instanceof Error ? e.message : 'Action failed'); await refresh(); }
    finally { setSubmitting(false); }
  }
  return <div className="shell">
    {mobileNav && <div className="backdrop" onClick={() => setMobileNav(false)} />}
    <aside className={`sidebar ${mobileNav ? 'mobile-open' : ''}`}>
      <div className="brand"><div className="brand-icon"><Activity size={22} strokeWidth={2.5}/></div><span>opsflow<span className="brand-dot">.</span></span><button className="nav-close" onClick={() => setMobileNav(false)}><X size={19}/></button></div>
      <div className="workspace-select"><div className="workspace-avatar">O</div><div><strong>OpsFlow Workspace</strong><span>Free workspace</span></div><ChevronDown size={15}/></div>
      <div className="nav-label">WORKSPACE</div>
      <nav>
        <button className="nav-item active"><LayoutDashboard size={18}/>Overview</button>
        <button className="nav-item" onClick={() => { document.getElementById('tickets')?.scrollIntoView({behavior:'smooth'}); setMobileNav(false); }}><Inbox size={18}/>All tickets <span className="nav-count">{counts.total}</span></button>
        <button className="nav-item" onClick={() => {setFilter('IN_PROGRESS'); document.getElementById('tickets')?.scrollIntoView({behavior:'smooth'});}}><Clock3 size={18}/>In progress</button>
        <button className="nav-item" onClick={() => {setFilter('RESOLVED'); document.getElementById('tickets')?.scrollIntoView({behavior:'smooth'});}}><TicketCheck size={18}/>Resolved</button>
      </nav>
      <div className="nav-label second-label">MANAGE</div>
      <nav><div className="nav-item muted"><Users size={18}/>Team members <span className="soon">Soon</span></div><div className="nav-item muted"><Settings2 size={18}/>Settings <span className="soon">Soon</span></div></nav>
      <div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><Sparkles size={18}/></div><strong>Built for better workflows</strong><p>A TypeScript portfolio project exploring reliable APIs, concurrency and clean product UX.</p><a href="https://github.com/its-rlee/OpsFlow" target="_blank" rel="noreferrer">View on GitHub <ArrowRight size={14}/></a></div><div className="profile"><div className="profile-avatar">DE</div><div><strong>Demo Engineer</strong><span>Developer workspace</span></div><span className="online-dot"/></div></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="crumb"><button className="mobile-menu" onClick={()=>setMobileNav(true)}><Menu size={21}/></button> Workspace <span>/</span> <strong>Overview</strong></div><div className="top-actions"><span className="demo-tag"><span/> Demo environment</span><button className="icon-button" title="Help" onClick={()=>window.open('https://github.com/its-rlee/OpsFlow#quick-start','_blank')}><CircleHelp size={19}/></button><div className="top-avatar">DE</div></div></header>
      <div className="content">
        <div className="heading-row"><div><div className="eyebrow"><span className="eyebrow-dot"/> YOUR WORKSPACE AT A GLANCE</div><h1>Good morning, Engineer <span className="wave">✳</span></h1><p className="subtitle">Here’s what’s happening across your support operations today.</p></div><button className="primary-button" onClick={()=>setCreating(true)}><Plus size={18}/> Create ticket</button></div>
        {error && <div className="alert"><span>{error}</span><button onClick={()=>{setError(''); void refresh();}}>Retry / dismiss</button></div>}
        <section className="stats">
          <div className="stat-card"><div className="stat-top"><span>Total tickets</span><div className="stat-icon purple"><Inbox size={19}/></div></div><div className="stat-value">{counts.total.toString().padStart(2,'0')}</div><div className="stat-foot"><TrendingUp size={14}/> All recorded tickets</div></div>
          <div className="stat-card"><div className="stat-top"><span>Open tickets</span><div className="stat-icon orange"><LifeBuoy size={19}/></div></div><div className="stat-value">{counts.open.toString().padStart(2,'0')}</div><div className="stat-foot">Waiting for a team member</div></div>
          <div className="stat-card"><div className="stat-top"><span>In progress</span><div className="stat-icon blue"><Clock3 size={19}/></div></div><div className="stat-value">{counts.progress.toString().padStart(2,'0')}</div><div className="stat-foot">Currently being handled</div></div>
          <div className="stat-card"><div className="stat-top"><span>Resolved</span><div className="stat-icon green"><CheckCircle2 size={19}/></div></div><div className="stat-value">{counts.resolved.toString().padStart(2,'0')}</div><div className="stat-foot">Successfully completed</div></div>
        </section>
        <section className="main-grid">
          <div className="tickets-panel" id="tickets">
            <div className="panel-head"><div><h2>Ticket management</h2><p>Manage, organize, and track support requests.</p></div><button className="outline-button" onClick={()=>{setLoading(true);void refresh();}}><ArrowDown size={16} className="refresh-icon"/> Refresh</button></div>
            <div className="ticket-toolbar"><div className="search"><Search size={18}/><input placeholder="Search tickets..." value={search} onChange={e=>setSearch(e.target.value)} /></div><div className="filter-wrap"><Filter size={16}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="ALL">All statuses</option><option value="OPEN">Open</option><option value="IN_PROGRESS">In progress</option><option value="RESOLVED">Resolved</option></select><ChevronDown size={14}/></div></div>
            <div className="table-wrap"><table><thead><tr><th>TICKET</th><th>PRIORITY</th><th>STATUS</th><th>ASSIGNEE</th><th>CREATED</th><th/></tr></thead><tbody>
              {visible.map(t=><tr key={t.id} onClick={()=>setSelected(t.id)} className={selected===t.id?'selected':''}>
                <td><span className="ticket-title">{t.title}</span><span className="ticket-desc">{t.description}</span></td>
                <td><span className={`priority priority-${t.priority.toLowerCase()}`}><span/>{priorityLabels[t.priority]}</span></td>
                <td><span className={`status status-${t.status.toLowerCase()}`}>{statuses[t.status]}</span></td>
                <td>{t.assignee ? <span className="assignee"><span>{t.assignee.slice(0,2).toUpperCase()}</span>{t.assignee}</span> : <span className="unassigned">Unassigned</span>}</td>
                <td className="date-cell">{relative(t.createdAt)}</td><td className="row-arrow"><ArrowRight size={16}/></td>
              </tr>)}
            </tbody></table>
            {loading && <div className="empty"><Activity size={28}/>Loading tickets…</div>}
            {!loading && !visible.length && <div className="empty"><Inbox size={30}/><strong>{tickets.length ? 'No matching tickets' : 'Your workspace is ready'}</strong><p>{tickets.length ? 'Try changing your filters.' : 'Create your first ticket to start organizing support work.'}</p><button className="secondary-button" onClick={()=>setCreating(true)}><Plus size={15}/> New ticket</button></div>}
            </div>
            <div className="table-footer"><span>Showing {visible.length} of {tickets.length} tickets</span><span>Limited to most recent 100 tickets</span></div>
          </div>
          <aside className="right-rail">
            <div className="insight-card"><div className="insight-badge"><Sparkles size={15}/> YOUR WORKFLOW</div><h3>Make every ticket count.</h3><p>Stay organized and keep your support pipeline moving with clear ownership and status tracking.</p><div className="progress-track"><div style={{width:`${counts.total ? Math.round(counts.resolved / counts.total * 100):0}%`}}/></div><div className="progress-line"><strong>{counts.total ? Math.round(counts.resolved/counts.total*100):0}% resolved</strong><span>{counts.resolved} of {counts.total} tickets</span></div></div>
            <div className="tips-card"><h3><ShieldCheck size={19}/> Engineering highlights</h3><div className="tip"><span className="tip-icon">01</span><div><strong>Atomic ticket claiming</strong><p>Conditional database updates prevent competing assignments.</p></div></div><div className="tip"><span className="tip-icon">02</span><div><strong>Safe request retries</strong><p>Idempotency keys protect against duplicate ticket creation.</p></div></div><div className="tip"><span className="tip-icon">03</span><div><strong>Optimistic concurrency</strong><p>Version checks detect stale status updates.</p></div></div></div>
          </aside>
        </section>
        <footer>OpsFlow © {new Date().getFullYear()} <span>·</span> Built with React, TypeScript, Express & PostgreSQL <span>·</span> <a href="https://github.com/its-rlee/OpsFlow">GitHub repository</a></footer>
      </div>
    </main>
    {(creating || active) && <div className="modal-bg" onMouseDown={e=>{if(e.target===e.currentTarget){setCreating(false);setSelected(null);}}}><div className="modal"><div className="modal-head"><div><div className="modal-label">{creating?'NEW REQUEST':'TICKET DETAILS'}</div><h2>{creating?'Create a ticket':active?.title}</h2></div><button className="icon-button" onClick={()=>{setCreating(false);setSelected(null);}}><X size={20}/></button></div>
      {creating ? <form onSubmit={createTicket} className="ticket-form"><label>Ticket title<input required minLength={3} maxLength={120} placeholder="e.g. Payment confirmation not loading" value={form.title} onChange={e=>setForm({...form,title:e.target.value})}/></label><label>Description<textarea required rows={5} maxLength={3000} placeholder="Describe the issue or request..." value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label><label>Priority<select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value as Priority})}><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option></select></label><div className="modal-actions"><button className="outline-button" type="button" onClick={()=>setCreating(false)}>Cancel</button><button disabled={submitting} className="primary-button" type="submit"><Plus size={16}/>{submitting?'Creating...':'Create ticket'}</button></div></form>
        : active && <div className="details"><div className="detail-chips"><span className={`priority priority-${active.priority.toLowerCase()}`}><span/>{active.priority}</span><span className={`status status-${active.status.toLowerCase()}`}>{statuses[active.status]}</span></div><p>{active.description}</p><div className="detail-meta"><span>Assigned to</span><strong>{active.assignee||'Nobody yet'}</strong><span>Created</span><strong>{relative(active.createdAt)}</strong><span>Version</span><strong>{active.version}</strong></div>{active.status==='OPEN'&&!active.assignee && <button disabled={submitting} className="primary-button wide" onClick={()=>void action(`/api/tickets/${active.id}/claim`,{assignee:'Demo Engineer'})}><Check size={17}/>Claim ticket</button>}{active.status!=='RESOLVED' && <button disabled={submitting} className="outline-button wide" onClick={()=>void action(`/api/tickets/${active.id}/status`,{status:'RESOLVED',version:active.version})}><TicketCheck size={17}/>Mark resolved</button>}</div>}
    </div></div>}
  </div>;
}
