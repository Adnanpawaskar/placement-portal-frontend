import useScrollReveal from '../../hooks/useScrollReveal';
import { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Wand2, Download, RefreshCw, CheckCircle, Code2, Award, Briefcase, Image, X, Plus, FileText } from 'lucide-react';

const TEMPLATES = ['Modern', 'Classic', 'Minimal', 'Executive'];
const COLORS = { Modern: '#1a56db', Classic: '#1e293b', Minimal: '#0f172a', Executive: '#7c3aed' };

function ResumePreview({ data, template }) {
  const color = COLORS[template];
  const { name, email, phone, linkedIn, github, bio, course, branch, cgpa, skills, experience, education, certifications, projects, achievements, certImages } = data;
  return (
    <div id="resume-preview" style={{ fontFamily: template === 'Classic' ? 'Georgia,serif' : 'system-ui,sans-serif', background: '#fff', padding: '36px', minHeight: '297mm', width: '210mm', margin: '0 auto', boxSizing: 'border-box', fontSize: '12.5px', color: '#1a1a1a', lineHeight: 1.5 }}>
      <div style={{ borderBottom: `3px solid ${color}`, paddingBottom: 14, marginBottom: 18 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color, margin: 0 }}>{name || 'Your Name'}</h1>
        <p style={{ color: '#555', margin: '3px 0 7px', fontSize: 13 }}>{course}{branch ? ` – ${branch}` : ''}</p>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 11.5, color: '#555' }}>
          {email && <span>✉ {email}</span>}{phone && <span>📞 {phone}</span>}
          {linkedIn && <span>🔗 {linkedIn}</span>}{github && <span>💻 {github}</span>}
        </div>
      </div>
      {bio && <section style={{ marginBottom: 16 }}><h2 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color, borderBottom: `1px solid ${color}30`, paddingBottom: 3, marginBottom: 7 }}>Professional Summary</h2><p style={{ color: '#333', margin: 0 }}>{bio}</p></section>}
      <section style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color, borderBottom: `1px solid ${color}30`, paddingBottom: 3, marginBottom: 8 }}>Education</h2>
        {(education || []).map((e, i) => <div key={i} style={{ marginBottom: 7 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>{e.degree}</strong><span style={{ color: '#777', fontSize: 11 }}>{e.year}</span></div><div style={{ color: '#555' }}>{e.institution}</div>{e.score && <div style={{ color: '#777', fontSize: 11 }}>Score: {e.score}</div>}</div>)}
      </section>
      {skills?.length > 0 && <section style={{ marginBottom: 16 }}><h2 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color, borderBottom: `1px solid ${color}30`, paddingBottom: 3, marginBottom: 8 }}>Technical Skills</h2><div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>{skills.map((s, i) => <span key={i} style={{ background: `${color}15`, color, padding: '3px 9px', borderRadius: 12, fontSize: 11.5, fontWeight: 500 }}>{s}</span>)}</div></section>}
      {experience?.length > 0 && <section style={{ marginBottom: 16 }}><h2 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color, borderBottom: `1px solid ${color}30`, paddingBottom: 3, marginBottom: 8 }}>Experience & Internships</h2>{experience.map((e, i) => <div key={i} style={{ marginBottom: 8 }}><div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>{e.role}</strong><span style={{ color: '#777', fontSize: 11 }}>{e.duration}</span></div><div style={{ color, fontSize: 11, fontWeight: 500 }}>{e.company}</div>{e.description && <div style={{ color: '#444', fontSize: 11, marginTop: 2 }}>{e.description}</div>}</div>)}</section>}
      {projects?.length > 0 && <section style={{ marginBottom: 16 }}><h2 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color, borderBottom: `1px solid ${color}30`, paddingBottom: 3, marginBottom: 8 }}>Projects</h2>{projects.map((p, i) => <div key={i} style={{ marginBottom: 8 }}><strong>{p.title}</strong>{p.tech && <span style={{ color: '#777', fontSize: 11 }}> | {p.tech}</span>}{p.description && <div style={{ color: '#444', fontSize: 11, marginTop: 2 }}>{p.description}</div>}</div>)}</section>}
      {certifications?.length > 0 && <section style={{ marginBottom: 16 }}><h2 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color, borderBottom: `1px solid ${color}30`, paddingBottom: 3, marginBottom: 8 }}>Certifications</h2>{certifications.map((c, i) => <div key={i} style={{ fontSize: 11.5, marginBottom: 3 }}>🏅 {c}</div>)}</section>}
      {achievements?.length > 0 && <section><h2 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color, borderBottom: `1px solid ${color}30`, paddingBottom: 3, marginBottom: 8 }}>Achievements</h2>{achievements.map((a, i) => <div key={i} style={{ fontSize: 11.5, marginBottom: 3 }}>⭐ {a}</div>)}</section>}
    </div>
  );
}

// ─── Generate a proper Word (.docx) file in the browser ─────────────────────
async function generateDocxBlob(data, template) {
  const color = COLORS[template] || '#1a56db';
  const { name, email, phone, linkedIn, github, bio, course, branch, skills, experience, education, certifications, projects, achievements } = data;

  // Use docx-preview approach: build HTML then convert to Word-compatible XML blob
  // We'll use the html-docx-js approach via a Blob with HTML content type
  // Since we can't import npm packages in browser easily, we'll build a rich RTF/HTML
  // that Word can open natively (Word supports HTML files with .doc extension)

  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  };

  const section = (title, content) => content ? `
    <h2 style="font-size:11pt;font-weight:bold;text-transform:uppercase;letter-spacing:1pt;color:${color};border-bottom:1pt solid ${color}44;padding-bottom:2pt;margin-bottom:6pt;margin-top:0;">${title}</h2>
    ${content}
  ` : '';

  const skillsHtml = skills?.length ? skills.map(s =>
    `<span style="background:${color}18;color:${color};padding:2pt 7pt;border-radius:10pt;font-size:10.5pt;font-weight:500;margin-right:4pt;display:inline-block;margin-bottom:3pt;">${s}</span>`
  ).join('') : '';

  const eduHtml = (education || []).map(e => `
    <div style="margin-bottom:6pt;">
      <div style="display:flex;justify-content:space-between;"><strong>${e.degree}</strong><span style="color:#777;font-size:10pt;">${e.year || ''}</span></div>
      <div style="color:#555;">${e.institution || ''}</div>
      ${e.score ? `<div style="color:#777;font-size:10pt;">${e.score}</div>` : ''}
    </div>
  `).join('');

  const expHtml = (experience || []).map(e => `
    <div style="margin-bottom:7pt;">
      <div style="display:flex;justify-content:space-between;"><strong>${e.role}</strong><span style="color:#777;font-size:10pt;">${e.duration || ''}</span></div>
      <div style="color:${color};font-size:10.5pt;font-weight:500;">${e.company}</div>
      ${e.description ? `<div style="color:#444;font-size:10.5pt;margin-top:2pt;">${e.description}</div>` : ''}
    </div>
  `).join('');

  const projHtml = (projects || []).map(p => `
    <div style="margin-bottom:7pt;">
      <strong>${p.title}</strong>${p.tech ? `<span style="color:#777;font-size:10.5pt;"> | ${p.tech}</span>` : ''}
      ${p.description ? `<div style="color:#444;font-size:10.5pt;margin-top:2pt;">${p.description}</div>` : ''}
    </div>
  `).join('');

  const certHtml = (certifications || []).map(c => `<div style="font-size:11pt;margin-bottom:3pt;">🏅 ${c}</div>`).join('');
  const achHtml = (achievements || []).map(a => `<div style="font-size:11pt;margin-bottom:3pt;">⭐ ${a}</div>`).join('');

  const html = `
<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>${name || 'Resume'}</title>
<!--[if gte mso 9]>
<xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml>
<![endif]-->
<style>
  @page { size: A4; margin: 2.5cm 2cm; }
  body { font-family: ${template === 'Classic' ? 'Georgia, serif' : 'Calibri, Arial, sans-serif'}; font-size: 11.5pt; color: #1a1a1a; line-height: 1.45; margin: 0; padding: 0; }
  h1 { font-size: 22pt; font-weight: bold; color: ${color}; margin: 0 0 3pt 0; }
  h2 { font-size: 11pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1pt; color: ${color}; border-bottom: 1pt solid ${color}; padding-bottom: 2pt; margin: 14pt 0 6pt 0; }
  .subtitle { color: #555; font-size: 12pt; margin: 3pt 0 7pt; }
  .contacts { color: #555; font-size: 10.5pt; margin-bottom: 4pt; }
  .header-block { border-bottom: 2pt solid ${color}; padding-bottom: 12pt; margin-bottom: 14pt; }
</style>
</head>
<body>
<div class="header-block">
  <h1>${name || 'Your Name'}</h1>
  <p class="subtitle">${course || ''}${branch ? ' – ' + branch : ''}</p>
  <p class="contacts">
    ${email ? `✉ ${email}` : ''}
    ${phone ? `  &nbsp;&nbsp; 📞 ${phone}` : ''}
    ${linkedIn ? `  &nbsp;&nbsp; 🔗 ${linkedIn}` : ''}
    ${github ? `  &nbsp;&nbsp; 💻 ${github}` : ''}
  </p>
</div>

${bio ? section('Professional Summary', `<p style="color:#333;margin:0;">${bio}</p>`) : ''}
${section('Education', eduHtml)}
${skills?.length ? section('Technical Skills', `<div>${skillsHtml}</div>`) : ''}
${experience?.length ? section('Experience & Internships', expHtml) : ''}
${projects?.length ? section('Projects', projHtml) : ''}
${certifications?.length ? section('Certifications', certHtml) : ''}
${achievements?.length ? section('Achievements', achHtml) : ''}

</body>
</html>`;

  const blob = new Blob(['\ufeff', html], {
    type: 'application/msword'
  });
  return blob;
}

export default function AIResumeBuilder() {
  const [profile, setProfile] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [template, setTemplate] = useState('Modern');
  const [jobTarget, setJobTarget] = useState('');
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');
  const [extra, setExtra] = useState({ experience: [], projects: [], certifications: [], achievements: [], certImages: [] });
  const [newExp, setNewExp] = useState({ role: '', company: '', duration: '', description: '' });
  const [newProj, setNewProj] = useState({ title: '', tech: '', description: '' });
  const [newCert, setNewCert] = useState('');
  const [newAch, setNewAch] = useState('');

  useEffect(() => { api.get('/students/profile').then(r => setProfile(r.data.student)).catch(() => {}); }, []);

  const handleCertImage = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setExtra(p => ({ ...p, certImages: [...p.certImages, { url: ev.target.result, name: file.name }] }));
      };
      reader.readAsDataURL(file);
    });
    toast.success(`${files.length} certificate image(s) added!`);
  };

  const removeImage = (idx) => setExtra(p => ({ ...p, certImages: p.certImages.filter((_, i) => i !== idx) }));

  const generateResume = async () => {
    setGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/students/ai-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jobTarget, extraData: extra })
      });
      const data = await res.json();
      if (data.success) {
        setResumeData({ ...data.resume, certImages: extra.certImages });
        setActiveTab('preview');
        toast.success('Resume generated! Click Download Word to save.');
      } else toast.error(data.message || 'Failed');
    } catch { toast.error('Failed to generate resume'); }
    finally { setGenerating(false); }
  };

  const downloadWord = async () => {
    const data = displayData;
    try {
      const blob = await generateDocxBlob(data, template);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.name || 'Resume'}_Resume.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('📄 Resume downloaded as Word (.doc) file!');
    } catch (err) {
      toast.error('Failed to generate Word file');
    }
  };

  const displayData = resumeData || {
    name: profile?.user?.name, email: profile?.user?.email, phone: profile?.phone,
    linkedIn: profile?.linkedIn, github: profile?.github, bio: profile?.bio,
    course: profile?.course, branch: profile?.branch, cgpa: profile?.cgpa,
    skills: profile?.skills || [],
    education: [
      { degree: profile?.course || 'B.Tech', institution: 'S. M. Shetty College', year: '2021–2025', score: profile?.cgpa ? `CGPA: ${profile.cgpa}` : '' },
      profile?.percentage12th && { degree: '12th (HSC)', institution: '—', year: '2021', score: `${profile.percentage12th}%` },
      profile?.percentage10th && { degree: '10th (SSC)', institution: '—', year: '2019', score: `${profile.percentage10th}%` },
    ].filter(Boolean),
    experience: extra.experience, projects: extra.projects,
    certifications: extra.certifications, achievements: extra.achievements,
    certImages: extra.certImages,
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2"><Wand2 className="text-[var(--neon-purple)]" size={24} /> AI Resume Builder</h1>
          <p className="text-[var(--text-muted)] text-sm">Generate ATS-friendly resume + download as Word (.doc)</p>
        </div>
        <div className="flex gap-2">
          <button onClick={generateResume} disabled={generating} className="btn-primary flex items-center gap-2">
            {generating ? <><RefreshCw size={15} className="animate-spin" />Generating...</> : <><Wand2 size={15} />Generate Resume</>}
          </button>
          <button onClick={downloadWord} className="btn-secondary flex items-center gap-2 border-green-300 text-[var(--neon-green)] hover:bg-green-50">
            <FileText size={15} />Download Word
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-[var(--text-primary)] mb-3 text-sm">Template</h3>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map(t => (
                <button key={t} onClick={() => setTemplate(t)}
                  className={`py-2 px-3 rounded-lg text-sm font-medium border-2 transition-all ${template === t ? 'border-[var(--neon-blue)] bg-blue-50 text-[var(--neon-blue)]' : 'border-[var(--border-glow)] text-[var(--text-secondary)] hover:border-blue-300'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-[var(--text-primary)] mb-2 text-sm">🎯 Target Role</h3>
            <input className="input text-sm" placeholder="e.g. Frontend Dev at Google" value={jobTarget} onChange={e => setJobTarget(e.target.value)} />
          </div>

          <div className="card">
            <h3 className="font-semibold text-[var(--text-primary)] mb-3 text-sm flex items-center gap-2"><Briefcase size={14} />Experience</h3>
            {extra.experience.map((e, i) => <div key={i} className="text-xs bg-blue-50 text-[var(--neon-blue)] rounded p-2 mb-1 flex justify-between"><span>{e.role} @ {e.company}</span><button onClick={() => setExtra(p => ({ ...p, experience: p.experience.filter((_,j)=>j!==i) }))} className="text-red-400"><X size={11}/></button></div>)}
            <div className="space-y-1.5">
              <input className="input text-xs" placeholder="Role" value={newExp.role} onChange={e => setNewExp(p=>({...p,role:e.target.value}))} />
              <input className="input text-xs" placeholder="Company" value={newExp.company} onChange={e => setNewExp(p=>({...p,company:e.target.value}))} />
              <input className="input text-xs" placeholder="Duration (Jun–Aug 2024)" value={newExp.duration} onChange={e => setNewExp(p=>({...p,duration:e.target.value}))} />
              <textarea className="input text-xs" rows={2} placeholder="Key work..." value={newExp.description} onChange={e => setNewExp(p=>({...p,description:e.target.value}))} />
              <button onClick={() => { if(!newExp.role) return; setExtra(p=>({...p,experience:[...p.experience,newExp]})); setNewExp({role:'',company:'',duration:'',description:''}); }} className="btn-secondary w-full text-xs py-1.5"><Plus size={11} className="inline mr-1"/>Add</button>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-[var(--text-primary)] mb-3 text-sm flex items-center gap-2"><Code2 size={14} />Projects</h3>
            {extra.projects.map((p, i) => <div key={i} className="text-xs bg-purple-50 text-[var(--neon-purple)] rounded p-2 mb-1 flex justify-between"><span>{p.title}</span><button onClick={() => setExtra(pr=>({...pr,projects:pr.projects.filter((_,j)=>j!==i)}))} className="text-red-400"><X size={11}/></button></div>)}
            <div className="space-y-1.5">
              <input className="input text-xs" placeholder="Project title" value={newProj.title} onChange={e => setNewProj(p=>({...p,title:e.target.value}))} />
              <input className="input text-xs" placeholder="Tech: React, Node.js" value={newProj.tech} onChange={e => setNewProj(p=>({...p,tech:e.target.value}))} />
              <textarea className="input text-xs" rows={2} placeholder="What you built..." value={newProj.description} onChange={e => setNewProj(p=>({...p,description:e.target.value}))} />
              <button onClick={() => { if(!newProj.title) return; setExtra(p=>({...p,projects:[...p.projects,newProj]})); setNewProj({title:'',tech:'',description:''}); }} className="btn-secondary w-full text-xs py-1.5"><Plus size={11} className="inline mr-1"/>Add</button>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-[var(--text-primary)] mb-3 text-sm flex items-center gap-2"><Award size={14} />Certifications</h3>
            {extra.certifications.map((c,i) => <div key={i} className="text-xs bg-green-50 text-[var(--neon-green)] rounded p-1.5 mb-1 flex justify-between"><span>🏅 {c}</span><button onClick={() => setExtra(p=>({...p,certifications:p.certifications.filter((_,j)=>j!==i)}))} className="text-red-400"><X size={11}/></button></div>)}
            <div className="flex gap-2 mb-3">
              <input className="input text-xs flex-1" placeholder="AWS Certified, Hackathon..." value={newCert} onChange={e => setNewCert(e.target.value)} />
              <button onClick={() => { if(!newCert) return; setExtra(p=>({...p,certifications:[...p.certifications,newCert]})); setNewCert(''); }} className="btn-secondary text-xs px-2"><Plus size={12}/></button>
            </div>
            <div className="border-t border-[var(--border-glow)] pt-3">
              <p className="text-xs font-medium text-[var(--text-secondary)] mb-2 flex items-center gap-1"><Image size={12} />Upload Certificate Images</p>
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-lg p-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all">
                <Image size={20} className="text-[var(--text-muted)] mb-1" />
                <span className="text-xs text-[var(--text-muted)]">Click to upload images</span>
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleCertImage} />
              </label>
              {extra.certImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {extra.certImages.map((img, i) => (
                    <div key={i} className="relative group">
                      <img src={img.url} alt={img.name} className="w-16 h-12 object-cover rounded border border-[var(--border-glow)]" />
                      <button onClick={() => removeImage(i)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X size={9} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-[var(--text-primary)] mb-3 text-sm">⭐ Achievements</h3>
            {extra.achievements.map((a,i) => <div key={i} className="text-xs bg-yellow-50 text-yellow-700 rounded p-1.5 mb-1 flex justify-between"><span>{a}</span><button onClick={() => setExtra(p=>({...p,achievements:p.achievements.filter((_,j)=>j!==i)}))} className="text-red-400"><X size={11}/></button></div>)}
            <div className="flex gap-2">
              <input className="input text-xs flex-1" placeholder="NSS volunteer, Cultural head..." value={newAch} onChange={e => setNewAch(e.target.value)} />
              <button onClick={() => { if(!newAch) return; setExtra(p=>({...p,achievements:[...p.achievements,newAch]})); setNewAch(''); }} className="btn-secondary text-xs px-2"><Plus size={12}/></button>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-2">
          <div className="flex gap-2 mb-4">
            {['preview','tips'].map(t => (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${activeTab === t ? 'bg-[var(--neon-blue)] text-black' : 'bg-transparent border border-[var(--border-glow)] text-[var(--text-secondary)] hover:bg-blue-50'}`}>
                {t === 'tips' ? '💡 Tips' : '👁 Preview'}
              </button>
            ))}
          </div>

          {activeTab === 'preview' ? (
            <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-glow)] p-4 overflow-auto max-h-[800px]">
              <ResumePreview data={displayData} template={template} />
            </div>
          ) : (
            <div className="card space-y-3">
              <h3 className="font-semibold text-[var(--text-primary)]">💡 Resume Tips</h3>
              {['Use strong action verbs: "Developed", "Led", "Optimized", "Designed"','Quantify achievements: "Improved performance by 30%", "Handled 10k+ users"','Keep it 1 page for freshers — 2 pages max for experienced','Match keywords from the job description for ATS success','CGPA above 7.0 should always be prominently mentioned','Projects beat academic achievements for tech roles','Add GitHub links with actual deployed/live projects'].map((tip,i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                  <CheckCircle size={15} className="text-green-500 flex-shrink-0 mt-0.5" />{tip}
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-green-800">📄 Download your resume as a Word file</p>
              <p className="text-[var(--neon-green)] text-sm">Opens in Microsoft Word or Google Docs — easy to edit!</p>
            </div>
            <button onClick={downloadWord} className="btn-primary bg-green-600 hover:bg-green-700 flex items-center gap-2">
              <Download size={16} /> Download Word
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
