import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowUpRight,
  Bot,
  BriefcaseBusiness,
  ChevronDown,
  Code2,
  Database,
  ExternalLink,
  FileDown,
  GraduationCap,
  Languages,
  Mail,
  MapPin,
  Plane,
  QrCode,
  Rocket,
  Radio,
  Server,
  Smartphone,
  Sparkles,
  Terminal,
} from 'lucide-react';
import {
  FaCss3Alt,
  FaHtml5,
  FaJava,
  FaLinkedin,
  FaLinux,
  FaWindows,
} from 'react-icons/fa';
import {
  SiDeepgram,
  SiDocker,
  SiExpress,
  SiFirebase,
  SiGit,
  SiGithub,
  SiJavascript,
  SiModelcontextprotocol,
  SiMysql,
  SiNetlify,
  SiNodedotjs,
  SiNotion,
  SiPostman,
  SiPython,
  SiReact,
  SiRender,
  SiSpringboot,
  SiSupabase,
  SiSwagger,
  SiSwift,
  SiTailwindcss,
  SiTypescript,
  SiVercel,
  SiVite,
} from 'react-icons/si';
import './styles.css';

const skills = [
  { label: 'Java', Icon: FaJava, color: '#df3d14' },
  { label: 'HTML', Icon: FaHtml5, color: '#e34c26' },
  { label: 'CSS', Icon: FaCss3Alt, color: '#2965f1' },
  { label: 'JavaScript', Icon: SiJavascript, color: '#f7df1e' },
  { label: 'TypeScript', Icon: SiTypescript, color: '#3178c6' },
  { label: 'Python', Icon: SiPython, color: '#3776ab' },
  { label: 'Swift', Icon: SiSwift, color: '#f05138' },
  { label: 'React', Icon: SiReact, color: '#61dafb' },
  { label: 'NodeJS', Icon: SiNodedotjs, color: '#68a063' },
  { label: 'Express', Icon: SiExpress, color: '#fff' },
  { label: 'Spring Boot', Icon: SiSpringboot, color: '#6db33f' },
  { label: 'Tailwind', Icon: SiTailwindcss, color: '#38bdf8' },
  { label: 'Docker', Icon: SiDocker, color: '#2496ed' },
  { label: 'MySQL', Icon: SiMysql, color: '#00758f' },
  { label: 'Git', Icon: SiGit, color: '#f34f29' },
  { label: 'GitHub', Icon: SiGithub, color: '#fff' },
  { label: 'Vite', Icon: SiVite, color: '#a855f7' },
  { label: 'Firebase', Icon: SiFirebase, color: '#ffca28' },
  { label: 'MCP', Icon: SiModelcontextprotocol, color: '#f3f3f3' },
  { label: 'Deepgram', Icon: SiDeepgram, color: '#13ef93' },
  { label: 'Linux', Icon: FaLinux, color: '#f5f5f5' },
  { label: 'Windows', Icon: FaWindows, color: '#0078d4' },
  { label: 'Postman', Icon: SiPostman, color: '#ff6c37' },
  { label: 'Swagger', Icon: SiSwagger, color: '#85ea2d' },
  { label: 'Supabase', Icon: SiSupabase, color: '#3ecf8e' },
  { label: 'Vercel', Icon: SiVercel, color: '#fff' },
  { label: 'Netlify', Icon: SiNetlify, color: '#00c7b7' },
  { label: 'Render', Icon: SiRender, color: '#fff' },
  { label: 'Notion', Icon: SiNotion, color: '#fff' },
];

const skillRows = [
  skills.slice(0, 10),
  skills.slice(8).concat(skills.slice(0, 4)),
];

const highlightLogos = {
  React: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/react/react-original.svg',
  TypeScript: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg',
  Python: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg',
  Swift: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/swift/swift-original.svg',
  Node: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/nodejs/nodejs-original.svg',
  AWS: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/amazonwebservices/amazonwebservices-original-wordmark.svg',
  MCP: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/modelcontextprotocol.svg',
};

const brandIcons = {
  github: SiGithub,
  linkedin: FaLinkedin,
};

const experience = [
  {
    company: 'Altius Link',
    role: 'Translation Specialist',
    status: 'Active',
    statusJa: '在職中',
    date: 'Jun 2023 - Now',
    dateJa: '2023年6月 - 現在',
    icon: Languages,
    logo: '/assets/altius-link-logo.png',
    url: 'https://www.altius-link.com/eng/',
    tone: 'green',
    details: [
      'Translate and localize customer-facing communication between English and Japanese.',
      'Support cross-cultural handoffs with business-level Japanese, documentation, and service context.',
      'Keep terminology consistent across support workflows and internal knowledge resources.',
    ],
    roleJa: '翻訳スペシャリスト',
    detailsJa: [
      '英語と日本語の顧客向けコミュニケーションを翻訳・ローカライズ。',
      'ビジネスレベルの日本語、資料、サービス文脈を踏まえて異文化間の引き継ぎを支援。',
      'サポート業務と社内ナレッジで用語の一貫性を維持。',
    ],
  },
  {
    company: 'Hotel SUI Akasaka',
    role: 'Front Desk Associate',
    status: 'Done',
    statusJa: '完了',
    date: 'Apr 2023 - Jul 2023',
    dateJa: '2023年4月 - 2023年7月',
    icon: BriefcaseBusiness,
    logo: '/assets/hotel-sui-akasaka-favicon.ico',
    url: 'https://hotelsui-akasaka.com/',
    tone: 'red',
    details: [
      'Handled front desk reception, guest check-ins, reservations, and multilingual customer support.',
      'Resolved day-to-day guest requests while coordinating smoothly with hotel operations staff.',
      'Used Japanese and English in a fast-paced hospitality environment in central Tokyo.',
    ],
    roleJa: 'フロントデスクスタッフ',
    detailsJa: [
      'フロント受付、チェックイン、予約対応、多言語カスタマーサポートを担当。',
      'ホテル運営スタッフと連携し、日々のゲスト要望を迅速に解決。',
      '東京中心部のホテル環境で日本語と英語を使って接客。',
    ],
  },
  {
    company: 'Japan Airlines',
    role: 'Immigration Specialist',
    status: 'Done',
    statusJa: '完了',
    date: 'Feb 2023 - Apr 2023',
    dateJa: '2023年2月 - 2023年4月',
    icon: Plane,
    logo: 'https://www.jal.com/favicon.ico',
    url: 'https://www.jal.com/',
    tone: 'red',
    details: [
      'Assisted with immigration-related passenger handling and document checks.',
      'Worked in a structured airport operations environment with strict accuracy expectations.',
      'Communicated with travelers and staff across multilingual service situations.',
    ],
    roleJa: '入国管理サポート',
    detailsJa: [
      '入国関連の旅客対応と書類確認をサポート。',
      '正確性が求められる空港オペレーション環境で業務を遂行。',
      '多言語の接客場面で旅行者やスタッフと円滑にコミュニケーション。',
    ],
  },
];

const copy = {
  en: {
    lang: '日本語',
    building: 'Building AI agent tools',
    location: 'Tokyo, Japan',
    student: 'Tokai University student',
    intro: (
      <>
        Yup! I&apos;m a <b>full-stack developer</b> and third-year ICT student focused on{' '}
        <b>AI agent orchestration</b>. I build multi-agent systems, LLM tool-calling flows,
        secure <Highlight name="MCP" /> integrations, and production web apps across{' '}
        <Highlight name="TypeScript" />, <Highlight name="Python" />, <Highlight name="Swift" />,{' '}
        <Highlight name="Node" />, and <Highlight name="AWS" />. I use <Highlight name="React" /> to
        shape fast interfaces and work in English and Japanese with JLPT N2 business-level Japanese.
      </>
    ),
    contactOr: 'OR',
    email: 'Email Me',
    skills: 'My Skills',
    work: 'Work Experience',
    projects: 'My Projects',
    tech: 'Technologies Used:',
    live: 'Live',
    moreProjects: 'More Projects',
    thoughtsTitle: 'Thoughts in words.',
    thoughts: 'You really wanna read my notes? Head over to',
    thoughtsLink: 'My GitHub',
    thoughtsTail: 'for now.',
    connectTitle: "Let's Connect",
    connectText: 'Feel free to reach out through any of these platforms',
    resume: 'Resume',
    contribution: (total) => `This year, I shipped ${total} focused contributions`,
    months: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
    less: 'Less',
    more: 'More',
  },
  ja: {
    lang: 'English',
    building: 'AIツールを開発中',
    location: '東京都、日本',
    student: '東海大学 ICT 学生',
    intro: (
      <>
        はじめまして。私は<b>フルスタック開発者</b>で、AIエージェント連携に注力しているICT専攻の
        3年生です。マルチエージェントシステム、LLMのツール呼び出し、安全な
        <Highlight name="MCP" />連携、そして本番向けWebアプリを
        <Highlight name="TypeScript" />、<Highlight name="Python" />、<Highlight name="Swift" />、
        <Highlight name="Node" />、<Highlight name="AWS" />で開発しています。
        <Highlight name="React" />で高速なUIを作り、英語と日本語で業務対応できます。
      </>
    ),
    contactOr: 'または',
    email: 'メール',
    skills: 'スキル',
    work: '職務経験',
    projects: 'プロジェクト',
    tech: '使用技術:',
    live: '公開',
    moreProjects: '他のプロジェクト',
    thoughtsTitle: '言葉のメモ。',
    thoughts: '開発メモを読みたい方は、まず',
    thoughtsLink: 'GitHub',
    thoughtsTail: 'をご覧ください。',
    connectTitle: 'お問い合わせ',
    connectText: '以下のリンクからお気軽にご連絡ください',
    resume: '履歴書',
    contribution: (total) => `今年は ${total} 件のコントリビューションを行いました`,
    months: ['7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月'],
    less: '少',
    more: '多',
  },
};

const projects = [
  {
    title: 'WebDrop',
    badge: 'live app',
    image: '/assets/webdrop-site.jpg',
    icon: Radio,
    live: 'https://web-drop-lyart.vercel.app/',
    github: 'https://github.com/MohamedFuad16/WebDrop',
    description:
      'AirDrop-style browser file sharing with bump pairing, ultrasonic Web Audio handshake, WebRTC streams, and OPFS storage.',
    descriptionJa:
      'ブラウザだけで使えるAirDrop風ファイル共有アプリ。バンプペアリング、超音波Web Audioハンドシェイク、WebRTCストリーム、OPFS保存に対応。',
    tech: ['JavaScript', 'WebRTC', 'OPFS', 'Web Audio', 'PWA'],
  },
  {
    title: 'Tutor-System',
    badge: 'architecture',
    image: '/assets/tutor-site.jpg',
    icon: Sparkles,
    live: 'https://tutor-system-architecture.vercel.app/',
    github: 'https://github.com/MohamedFuad16/Tutor-System',
    description:
      'AI learning app with function-calling tutor tools, realtime voice tutoring, source-aware PDF chat, and learner memory.',
    descriptionJa:
      '関数呼び出し型のチューターツール、リアルタイム音声指導、出典つきPDFチャット、学習者メモリを備えたAI学習アプリ。',
    tech: ['React 19', 'TypeScript', 'OpenRouter', 'Deepgram', 'Dexie'],
  },
  {
    title: 'TokaiHub',
    badge: 'student PWA',
    image: '/assets/tokaihub-site.jpg',
    icon: Smartphone,
    live: 'https://mohamedfuad16.github.io/TokaiHub/',
    github: 'https://github.com/MohamedFuad16/TokaiHub',
    description:
      'Mobile-first bilingual student portal PWA for Tokai University with AWS Cognito authentication and OTP flows.',
    descriptionJa:
      '東海大学向けのモバイルファーストな日英バイリンガル学生ポータルPWA。AWS Cognito認証とOTPフローを実装。',
    tech: ['React', 'Tailwind', 'Amplify', 'Cognito', 'Vite'],
  },
  {
    title: 'Codex Account Switcher',
    badge: 'macOS tool',
    image: '/assets/codexacc-site.jpg',
    icon: Bot,
    live: 'https://github.com/MohamedFuad16/Codex-Acc-Switcher',
    github: 'https://github.com/MohamedFuad16/Codex-Acc-Switcher',
    description:
      'Native macOS menu bar utility for switching Codex accounts, showing usage budgets, and restarting sessions.',
    descriptionJa:
      'Codexアカウント切り替え、使用量表示、セッション再起動を行うネイティブmacOSメニューバーアプリ。',
    tech: ['Swift', 'AppKit', 'QuartzCore', 'Shell', 'macOS'],
  },
];

function SectionTitle({ children }) {
  return <h2 className="section-title">{children}</h2>;
}

function Logo({ src, label }) {
  return <img src={src} alt="" aria-hidden="true" loading="lazy" />;
}

function BrandIcon({ name }) {
  const Icon = brandIcons[name];
  return <Icon aria-hidden="true" />;
}

function Highlight({ name, children }) {
  return (
    <b className="inline-logo">
      <Logo src={highlightLogos[name]} label={name} />
      {children || name}
    </b>
  );
}

function SkillPill({ skill }) {
  const Icon = skill.Icon;
  return (
    <li className="skill">
      <span className="skill-mark">
        <Icon style={{ color: skill.color }} aria-hidden="true" />
      </span>
      <span>{skill.label}</span>
    </li>
  );
}

function useContributionData() {
  const fallbackCells = useMemo(() => Array.from({ length: 245 }, (_, index) => {
    const wave = Math.sin(index * 0.43) + Math.cos(index * 0.17);
    const highlighted = index > 88 && index < 118 ? 2 : 0;
    return Math.max(0, Math.min(4, Math.round(wave + highlighted + (index % 13 === 0 ? 2 : 0))));
  }), []);
  const [data, setData] = useState({ cells: fallbackCells, total: 392 });

  useEffect(() => {
    let cancelled = false;
    fetch('https://github-contributions-api.jogruber.de/v4/MohamedFuad16?y=last')
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('GitHub calendar unavailable'))))
      .then((payload) => {
        if (cancelled || !Array.isArray(payload.contributions)) return;
        const cells = payload.contributions.slice(-245).map((day) => Number(day.level) || 0);
        setData({ cells, total: Number(payload.total?.lastYear) || 392 });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  return data;
}

function ContributionGrid({ t }) {
  const { cells, total } = useContributionData();

  return (
    <section className="dashed contribution" aria-label="Contribution grid">
      <div className="calendar-scroll">
        <div className="months">
          {t.months.map((month) => (
            <span key={month}>{month}</span>
          ))}
        </div>
        <div className="grid" aria-hidden="true">
          {cells.map((level, index) => (
            <span key={index} className={`cell level-${level}`} />
          ))}
        </div>
        <div className="contribution-foot">
          <span>{t.contribution(total)}</span>
          <span className="legend">
            {t.less}
            {[0, 1, 2, 3, 4].map((level) => (
              <i key={level} className={`cell level-${level}`} />
            ))}
            {t.more}
          </span>
        </div>
      </div>
    </section>
  );
}

function ExperienceItem({ item, locale }) {
  const [open, setOpen] = useState(false);
  const Icon = item.icon;
  const role = locale === 'ja' ? item.roleJa : item.role;
  const status = locale === 'ja' ? item.statusJa : item.status;
  const date = locale === 'ja' ? item.dateJa : item.date;
  const details = locale === 'ja' ? item.detailsJa : item.details;
  return (
    <article className={`experience-item ${open ? 'open' : ''}`}>
      <div className="experience-summary">
        <span className={`dot ${item.tone}`} />
        <span className="company-icon">
          {item.logo ? (
            <>
              <img
                src={item.logo}
                alt=""
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                  event.currentTarget.parentElement?.classList.add('logo-fallback');
                }}
              />
              <Icon size={24} />
            </>
          ) : (
            <Icon size={24} />
          )}
        </span>
        <div className="experience-copy">
          <h3>
            <a href={item.url} target="_blank" rel="noreferrer">
              {item.company}
              <ExternalLink size={13} />
            </a>
            <small className={item.tone}>
              <span>•</span>
              {status}
            </small>
          </h3>
          <p>{role}</p>
        </div>
        <time>{date}</time>
        <button
          className="chevron"
          type="button"
          aria-expanded={open}
          aria-label={`Toggle ${item.company} details`}
          onClick={() => setOpen((current) => !current)}
        >
          <ChevronDown size={15} />
        </button>
      </div>
      <div className="experience-details" aria-hidden={!open}>
        <ul>
          {details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function ProjectCard({ project, t, locale }) {
  const Icon = project.icon;
  return (
    <article className="project dashed">
      <div className="project-shot">
        <img src={project.image} alt={`${project.title} interface preview`} />
        <span>{project.badge}</span>
      </div>
      <div className="project-body">
        <div className="project-heading">
          <h3>
            {project.title}
            <Icon size={17} />
          </h3>
          <div className="project-actions">
            <a href={project.live} target="_blank" rel="noreferrer">
              <ExternalLink size={14} />
              {t.live}
            </a>
            <a href={project.github} target="_blank" rel="noreferrer">
              <BrandIcon name="github" />
              GitHub
            </a>
          </div>
        </div>
        <p>{locale === 'ja' ? project.descriptionJa : project.description}</p>
        <strong>{t.tech}</strong>
        <div className="tags">
          {project.tech.map((tech) => (
            <span key={tech}>{tech}</span>
          ))}
        </div>
      </div>
    </article>
  );
}

function playChime(volume = 0.08) {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const context = new AudioContext();
  const now = context.currentTime;
  const notes = [659.25, 880, 1174.66];

  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, now + index * 0.055);
    gain.gain.setValueAtTime(0.0001, now + index * 0.055);
    gain.gain.exponentialRampToValueAtTime(volume, now + index * 0.055 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.055 + 0.18);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(now + index * 0.055);
    oscillator.stop(now + index * 0.055 + 0.2);
  });

  window.setTimeout(() => context.close(), 450);
}

function App() {
  const [locale, setLocale] = useState(() => {
    const saved = window.localStorage.getItem('portfolio-locale');
    if (saved === 'en' || saved === 'ja') return saved;
    return navigator.language?.toLowerCase().startsWith('ja') ? 'ja' : 'en';
  });
  const [burst, setBurst] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [clickBursts, setClickBursts] = useState([]);
  const t = copy[locale];

  useEffect(() => {
    window.localStorage.setItem('portfolio-locale', locale);
  }, [locale]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (event.target.closest('.name-action, .qr-toggle-btn')) return;
      playChime(0.055);
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setClickBursts((items) => [...items.slice(-5), { id, x: event.clientX, y: event.clientY }]);
      window.setTimeout(() => {
        setClickBursts((items) => items.filter((item) => item.id !== id));
      }, 900);
    };

    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  const toggleLocale = () => setLocale((current) => (current === 'en' ? 'ja' : 'en'));

  const handleNameAction = (event) => {
    event.stopPropagation();
    playChime(0.11);
    setBurst(false);
    requestAnimationFrame(() => setBurst(true));
    window.setTimeout(() => setBurst(false), 850);
  };

  return (
    <main>
      <div className="page-click-effects" aria-hidden="true">
        {clickBursts.map((item) => (
          <span className="click-burst" key={item.id} style={{ left: item.x, top: item.y }}>
            {Array.from({ length: 6 }).map((_, index) => (
              <i key={index} />
            ))}
          </span>
        ))}
      </div>
      <section className="profile">
        <div className={`avatar ${showQr ? 'is-flipped' : ''}`}>
          <div className="avatar-card">
            <div className="avatar-face avatar-front">
              <img className="profile-photo" src="/assets/profile-yacht.jpg" alt="Mohamed Fuad on a yacht" />
            </div>
            <div className="avatar-face avatar-back">
              <img src="/assets/linkedin-qr.png" alt="LinkedIn QR code" />
            </div>
          </div>
          <button
            className="qr-toggle-btn"
            type="button"
            aria-label={showQr ? 'Show profile photo' : 'Show LinkedIn QR code'}
            onClick={(event) => {
              event.stopPropagation();
              setShowQr((current) => !current);
              playChime(0.08);
            }}
          >
            <QrCode size={17} />
          </button>
        </div>
        <div className="identity">
          <h1>
            Mohamed Fuad
            <button className={`name-action ${burst ? 'bursting' : ''}`} type="button" onClick={handleNameAction}>
              <Rocket size={19} fill="currentColor" />
              <i />
              <i />
              <i />
            </button>
          </h1>
          <p className="handle">
            @MohamedFuad16
            <button className="locale-toggle" type="button" onClick={toggleLocale}>
              {t.lang}
            </button>
          </p>
          <a className="building" href="#projects">
            {t.building}
            <Sparkles size={14} />
          </a>
          <p className="meta">
            <MapPin size={14} />
            {t.location}
            <span>•</span>
            <GraduationCap size={14} />
            {t.student}
          </p>
        </div>
      </section>

      <p className="intro">{t.intro}</p>

      <nav className="actions" aria-label="Contact links">
        <a href="https://www.linkedin.com/in/mohamed-fuad-6b8483278" target="_blank" rel="noreferrer">
          <span className="btn-icon">
            <BrandIcon name="linkedin" />
          </span>
          LinkedIn
        </a>
        <span>{t.contactOr}</span>
        <a href="mailto:mohamed.fuad.jp@gmail.com">
          <Mail size={15} />
          {t.email}
        </a>
        <i />
        <a className="square" href="https://github.com/MohamedFuad16" target="_blank" rel="noreferrer">
          <BrandIcon name="github" />
        </a>
        <a className="square" href="/resume/Mohamed_Fuad_CV.pdf" target="_blank" rel="noreferrer">
          <FileDown size={16} />
        </a>
      </nav>

      <SectionTitle>{t.skills}</SectionTitle>
      <div className="skills-marquees" aria-label="Technical skills carousel">
        {skillRows.map((row, rowIndex) => (
          <div className="skills-marquee" data-direction={rowIndex === 0 ? 'left' : 'right'} key={rowIndex}>
            <ul className="skills">
              {[...row, ...row, ...row].map((skill, index) => (
                <SkillPill key={`${skill.label}-${rowIndex}-${index}`} skill={skill} />
              ))}
            </ul>
          </div>
        ))}
      </div>

      <SectionTitle>{t.work}</SectionTitle>
      <section className="dashed timeline">
        <div className="line" />
        {experience.map((item) => (
          <ExperienceItem key={item.company} item={item} locale={locale} />
        ))}
      </section>

      <ContributionGrid t={t} />

      <SectionTitle>{t.projects}</SectionTitle>
      <section className="projects" id="projects">
        {projects.map((project) => (
          <ProjectCard key={project.title} project={project} t={t} locale={locale} />
        ))}
      </section>

      <div className="more-projects-row">
        <a className="view-all-btn" href="https://github.com/MohamedFuad16" target="_blank" rel="noreferrer">
          {t.moreProjects}
          <ArrowUpRight size={17} />
        </a>
      </div>

      <SectionTitle>{t.thoughtsTitle}</SectionTitle>
      <section className="dashed blog-content">
        <p>
          {t.thoughts}{' '}
          <a href="https://github.com/MohamedFuad16" target="_blank" rel="noreferrer">
            {t.thoughtsLink}
          </a>{' '}
          {t.thoughtsTail}
        </p>
      </section>

      <section className="dashed contact-card" id="contact">
        <h3>{t.connectTitle}</h3>
        <p>{t.connectText}</p>
        <nav className="contact-links" aria-label="More contact links">
          <a href="mailto:mohamed.fuad.jp@gmail.com">
            <Mail size={14} />
            Email
          </a>
          <a href="https://github.com/MohamedFuad16" target="_blank" rel="noreferrer">
            <BrandIcon name="github" />
            GitHub
          </a>
          <a href="/resume/Mohamed_Fuad_CV.pdf" target="_blank" rel="noreferrer">
            <FileDown size={14} />
            {t.resume}
          </a>
          <a href="https://www.linkedin.com/in/mohamed-fuad-6b8483278" target="_blank" rel="noreferrer">
            <span className="btn-icon">
              <BrandIcon name="linkedin" />
            </span>
            LinkedIn
          </a>
        </nav>
      </section>

      <footer>
        <Terminal size={14} />
        Mohamed Fuad
        <span>•</span>
        <Code2 size={14} />
        Full Stack + AI Agents
        <span>•</span>
        <Server size={14} />
        Tokyo
        <span>•</span>
        <Database size={14} />
        2026
      </footer>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
