import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { pageview } from '@vercel/analytics';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { CustomEase } from 'gsap/CustomEase';
import { useGSAP } from '@gsap/react';
import { signatureGlyphs, signatureViewBox, signatureFontSize } from './data/signature-path';
import { DaijinMascot } from './components/DaijinMascot';
import { SilkWave } from './components/SilkWave';
import { pixelCover, pixelUncover, waitForCalm } from './components/pixelTransition';
import Scritto from '@scritto/react';

// The photo's border beam is 70 KB of script, so it loads after first paint;
// until then the same frame renders without the glow.
const BorderBeam = React.lazy(() => import('border-beam').then((module) => ({ default: module.BorderBeam })));
import {
  ArrowLeft,
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Code2,
  Database,
  ExternalLink,
  FileDown,
  FileSearch,
  Languages,
  Lock,
  Mail,
  Network,
  MapPin,
  Plane,
  QrCode,
  Rocket,
  Radio,
  Server,
  Smartphone,
  Sparkles,
  CornerDownLeft,
  X,
  SearchX,
  Search,
  Sun,
  Moon,
  Target,
  Terminal,
  Users,
} from 'lucide-react';
import { FaCss3Alt, FaHtml5, FaLinkedin } from 'react-icons/fa';
import {
  SiDeepgram,
  SiGit,
  SiGithub,
  SiJavascript,
  SiModelcontextprotocol,
  SiNodedotjs,
  SiPython,
  SiQiita,
  SiReact,
  SiSwift,
  SiTailwindcss,
  SiTypescript,
  SiVercel,
  SiVite,
} from 'react-icons/si';
// Self-hosted fonts (fontsource): no third-party request blocking first paint,
// and unicode-range means only the subsets a page uses are downloaded.
import '@fontsource-variable/figtree';
import '@fontsource-variable/jetbrains-mono';
import '@fontsource/instrument-serif/400.css';
import './styles/global.css';
import './styles/theme-light.css';
import './styles/daijin.css';

gsap.registerPlugin(
  ScrollTrigger,
  ScrollToPlugin,
  ScrollSmoother,
  DrawSVGPlugin,
  CustomEase,
  useGSAP
);

const cardExpandEase = CustomEase.create('card-expand', '0.32, 0.72, 0, 1');

/**
 * Freeze `.project-detail-inner` at the width and offset it settles on when the
 * overlay fills the viewport. The mobile open/close animates the overlay's
 * width, and the inner column is sized `min(760px, 100% - 32px)`; letting that
 * track the animation re-wraps the tagline mid-flight and shoves every heading
 * below it up and down. Pinning it keeps the text layout still while only the
 * frame moves (ADR-036).
 */
function pinnedInnerLayout() {
  const width = Math.min(760, window.innerWidth - 32);
  return {
    width,
    marginLeft: Math.max(0, (window.innerWidth - width) / 2),
    marginRight: 0,
  };
}

/**
 * Freeze the cloned card inside `.pd-expand-face` at the size of the card it
 * was copied from. The clone is styled `width: 100%` of the overlay, and the
 * overlay's width is what the open/close animates — so without this the clone
 * re-lays out on every frame of the morph. Recorded at 390px: as the overlay
 * grew 350 -> 390, the clone's grid column went 306 -> 338 -> 350, its preview
 * image grew from 343 to 379 wide, and every line of text re-wrapped under it.
 * That reflow is the "realigning" glitch — the same failure ADR-036 fixed for
 * `.project-detail-inner`, which was never applied to the clone (ADR-046).
 */
function pinnedFaceLayout(origin) {
  // Units are explicit on purpose. GSAP defaults `width` to px but `minHeight`
  // to *percent* — passing the bare number wrote `min-height: 404.75%`, which
  // made the clone 3121px tall and pushed its title, description and tags far
  // below the frame (ADR-046).
  return { width: `${origin.width}px`, minHeight: `${origin.height}px` };
}

const skills = [
  { label: 'JavaScript', Icon: SiJavascript, color: '#f7df1e' },
  { label: 'TypeScript', Icon: SiTypescript, color: '#3178c6' },
  { label: 'Python', Icon: SiPython, color: '#3776ab' },
  { label: 'Swift', Icon: SiSwift, color: '#f05138' },
  { label: 'React', Icon: SiReact, color: '#61dafb' },
  { label: 'NodeJS', Icon: SiNodedotjs, color: '#68a063' },
  { label: 'HTML', Icon: FaHtml5, color: '#e34c26' },
  { label: 'CSS', Icon: FaCss3Alt, color: '#2965f1' },
  { label: 'Tailwind', Icon: SiTailwindcss, color: '#38bdf8' },
  { label: 'Vite', Icon: SiVite, color: '#a855f7' },
  { label: 'Git', Icon: SiGit, color: '#f34f29' },
  { label: 'GitHub', Icon: SiGithub, color: '#fff' },
  { label: 'MCP', Icon: SiModelcontextprotocol, color: '#f3f3f3' },
  { label: 'Deepgram', Icon: SiDeepgram, color: '#13ef93' },
  { label: 'Vercel', Icon: SiVercel, color: '#fff' },
];

const skillRows = [
  skills.slice(0, 8),
  skills.slice(8).concat(skills.slice(0, 1)),
];

// Pinned, not `@latest`: an unpinned CDN tag silently re-points at whatever the
// upstream project ships next, so an icon can be renamed or restyled without a
// commit here. Each URL below was verified to resolve at this version.
const DEVICON = 'https://cdn.jsdelivr.net/gh/devicons/devicon@v2.17.0/icons';
const SIMPLE_ICONS = 'https://cdn.jsdelivr.net/npm/simple-icons@16.27.1/icons';

const highlightLogos = {
  React: `${DEVICON}/react/react-original.svg`,
  TypeScript: `${DEVICON}/typescript/typescript-original.svg`,
  Python: `${DEVICON}/python/python-original.svg`,
  Swift: `${DEVICON}/swift/swift-original.svg`,
  Node: `${DEVICON}/nodejs/nodejs-original.svg`,
  AWS: `${DEVICON}/amazonwebservices/amazonwebservices-original-wordmark.svg`,
  MCP: `${SIMPLE_ICONS}/modelcontextprotocol.svg`,
};

const brandIcons = {
  github: SiGithub,
  linkedin: FaLinkedin,
  qiita: SiQiita,
};

const QIITA_PROFILE = 'https://qiita.com/mfuad16';

const experience = [
  {
    company: 'Altius Link (formerly KDDI Evolva)',
    companyJa: 'アルティウスリンク（旧KDDIエボルバ）',
    role: 'Translation Specialist',
    status: 'Active',
    statusJa: '在職中',
    date: 'Jun 2023 - Now',
    start: '2023-06',
    end: null,
    dateJa: '2023年6月 - 現在',
    icon: Languages,
    logo: '/media/logos/altius-link.png',
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
    start: '2023-04',
    end: '2023-07',
    dateJa: '2023年4月 - 2023年7月',
    icon: BriefcaseBusiness,
    logo: '/media/logos/hotel-sui-akasaka.ico',
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
    start: '2023-02',
    end: '2023-04',
    dateJa: '2023年2月 - 2023年4月',
    icon: Plane,
    logo: '/media/logos/japan-airlines.png',
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
    buildingLead: 'Building',
    roles: ['AI agent tools', 'multi-agent runtimes', 'document AI pipelines', 'native macOS apps', 'bilingual web apps'],
    location: 'Tokyo, Japan',
    student: 'Tokai University, ICT',
    graduation: 'Graduating March 2028',
    introParagraphs: [
      <>
        I&apos;m a <b>full-stack developer</b> and a third-year Information and Communication
        Technology student at Tokai University, graduating in March 2028. I want to work as a{' '}
        <b>Forward Deployed Engineer</b> or <b>AI Engineer</b>, owning a product end to end:
        designing the architecture, building it, and shipping it to production alongside the
        people who use it.
      </>,
      <>
        I&apos;m comfortable working with LLMs, agent workflows, tool calling, and secure{' '}
        <Highlight name="MCP" /> integrations, alongside production apps built with{' '}
        <Highlight name="TypeScript" />, <Highlight name="Python" />, <Highlight name="Swift" />,{' '}
        <Highlight name="Node" />, <Highlight name="AWS" />, and <Highlight name="React" />. I work
        in English and Japanese, with JLPT N2 business-level Japanese.
      </>,
    ],
    contactOr: 'OR',
    email: 'Email Me',
    footerRole: 'Full Stack + AI Agents',
    footerCity: 'Tokyo',
    skills: 'My Skills',
    work: 'Work Experience',
    projects: 'My Projects',
    tech: 'Technologies Used:',
    techHeading: 'Technologies used',
    live: 'Live',
    privateRepo: 'Private repo',
    visitors: (n) => ` ${n === 1 ? 'visitor' : 'visitors'}`,
    moreProjects: 'More Projects',
    filterLabel: 'Filter projects by technology',
    tenure: (months) => {
      const years = Math.floor(months / 12);
      const rest = months % 12;
      const parts = [];
      if (years) parts.push(`${years} yr${years === 1 ? '' : 's'}`);
      if (rest) parts.push(`${rest} mo${rest === 1 ? '' : 's'}`);
      return parts.join(' ');
    },
    command: {
      label: 'Command menu',
      placeholder: 'Search projects, sections, links…',
      empty: 'Nothing matches that.',
      sections: 'Go to',
      actions: 'Actions',
      settings: 'Settings',
      contributions: 'Contributions',
      copyEmail: 'Copy email address',
      resume: 'Open résumé',
      move: 'move',
      open: 'open',
      close: 'close',
      button: 'Open command menu',
      search: 'Search',
      clear: 'Clear search',
      suggestions: ['AI', 'Swift', 'React', 'résumé'],
      light: 'Switch to light theme',
      dark: 'Switch to dark theme',
    },
    filterAll: 'All',
    thoughtsTitle: 'Thoughts in words.',
    thoughts: 'I write about the things I build and learn. Browse all of my posts on',
    thoughtsLink: 'my Qiita profile',
    thoughtsTail: '.',
    connectTitle: "Let's Connect",
    connectText: 'Feel free to reach out through any of these platforms',
    resume: 'Resume',
    back: 'Back to projects',
    overview: 'Overview',
    keyFeatures: 'What it does',
    howItWorks: 'How it works',
    figures: 'By the numbers',
    glance: 'At a glance',
    glanceType: 'Type',
    gallery: (title) => `${title} screenshots`,
    galleryPrev: 'Previous screenshot',
    galleryNext: 'Next screenshot',
    galleryGoTo: (n) => `Show screenshot ${n}`,
    systemMap: 'System map',
    architecture: 'System architecture',
    viewDetails: 'View details',
    contribution: (total) => `${total} contributions in the last 12 months`,
    less: 'Less',
    more: 'More',
    dayTooltip: (count, dateLabel) => `${count} contribution${count === 1 ? '' : 's'} on ${dateLabel}`,
    contributionStats: {
      total: 'Contributions',
      window: 'last 12 months',
      active: 'Active days',
      activeOf: (days) => `of ${days} days`,
      longest: 'Longest streak',
      days: (n) => `${n} day${n === 1 ? '' : 's'}`,
      current: (n) => `current: ${n} day${n === 1 ? '' : 's'}`,
      best: 'Busiest day',
      count: (n) => (n === 0 ? 'No contributions' : `${n} contribution${n === 1 ? '' : 's'}`),
      month: (label, count, active) => `${label}: ${count} contribution${count === 1 ? '' : 's'} across ${active} active day${active === 1 ? '' : 's'}`,
      gridHint: 'Contribution calendar. Use the arrow keys to move between days.',
      other: 'Other',
    },
    // Screen-reader-only strings. These used to be hardcoded English, so a
    // Japanese visitor got a fully translated page with English controls.
    a11y: {
      language: 'Language',
      skillsCarousel: 'Technical skills carousel',
      contributionGrid: 'Contribution grid',
      contactLinks: 'Contact links',
      moreContactLinks: 'More contact links',
      toggleDetails: (company) => `Toggle ${company} details`,
      viewPhoto: 'View photo',
      profilePhoto: 'Profile photo',
      enlargedPhoto: 'Mohamed Fuad, enlarged',
      showPhoto: 'Show profile photo',
      showQr: 'Show LinkedIn QR code',
      linkedinQr: 'LinkedIn QR code',
      preview: (title) => `${title} interface preview`,
      closeDialog: 'Close',
    },
  },
  ja: {
    lang: 'English',
    building: 'AIエージェントツールを開発中',
    buildingLead: '',
    roles: ['AIエージェントツールを開発中', 'マルチエージェント基盤を開発中', '文書AIパイプラインを開発中', 'macOSネイティブアプリを開発中', '日英対応のWebアプリを開発中'],
    location: '東京都、日本',
    student: '東海大学 情報通信学部',
    graduation: '2028年3月卒業予定',
    introParagraphs: [
      // Japanese takes no inter-word spaces, but JSX condenses a newline that
      // falls mid-text into one — so these lines must break only where they sit
      // next to a tag (those newlines are dropped) or not at all. Breaking after
      // 「机上の要件から」 rendered 「机上の要件から 推測するのではなく」.
      <>
        東海大学情報通信学部3年の<b>フルスタック開発者</b>で、2028年3月に卒業予定です。<b>フォワードデプロイドエンジニア</b>または<b>AIエンジニア</b>として、アーキテクチャの設計だけでなく、使う人のそばで実装から本番環境への公開まで一貫して作り切る仕事がしたいと考えています。
      </>,
      <>
        LLM、エージェントワークフロー、ツール呼び出し、安全な<Highlight name="MCP" />連携に加え、
        <Highlight name="TypeScript" />、<Highlight name="Python" />、<Highlight name="Swift" />、
        <Highlight name="Node" />、<Highlight name="AWS" />、<Highlight name="React" />を使った本番向けアプリ開発に取り組んでいます。英語と日本語で業務対応ができ、日本語力はJLPT N2相当です。
      </>,
    ],
    contactOr: 'または',
    email: 'メール',
    footerRole: 'フルスタック開発 / AIエージェント',
    footerCity: '東京',
    skills: 'スキル',
    work: '職務経験',
    projects: 'プロジェクト',
    tech: '使用技術:',
    techHeading: '使用技術',
    live: '公開',
    privateRepo: '非公開リポジトリ',
    visitors: () => '人の訪問者',
    moreProjects: '他のプロジェクト',
    filterLabel: '技術でプロジェクトを絞り込む',
    tenure: (months) => {
      const years = Math.floor(months / 12);
      const rest = months % 12;
      return `${years ? `${years}年` : ''}${rest ? `${rest}か月` : ''}`;
    },
    command: {
      label: 'コマンドメニュー',
      placeholder: 'プロジェクト、セクション、リンクを検索…',
      empty: '一致する項目がありません。',
      sections: '移動',
      actions: '操作',
      settings: '設定',
      contributions: 'コントリビューション',
      copyEmail: 'メールアドレスをコピー',
      resume: '履歴書を開く',
      move: '移動',
      open: '開く',
      close: '閉じる',
      button: 'コマンドメニューを開く',
      search: '検索',
      clear: '検索をクリア',
      suggestions: ['AI', 'Swift', 'React', '履歴書'],
      light: 'ライトテーマに切り替え',
      dark: 'ダークテーマに切り替え',
    },
    filterAll: 'すべて',
    thoughtsTitle: '言葉のメモ。',
    thoughts: '開発や学びについて書いています。すべての記事は',
    thoughtsLink: 'Qiitaプロフィール',
    thoughtsTail: 'からご覧いただけます。',
    connectTitle: 'お問い合わせ',
    connectText: '以下のリンクからお気軽にご連絡ください',
    resume: '履歴書',
    back: 'プロジェクト一覧へ戻る',
    overview: '概要',
    keyFeatures: '主な機能',
    howItWorks: '仕組み',
    figures: '数字で見る',
    glance: '概要',
    glanceType: '種類',
    gallery: (title) => `${title}のスクリーンショット`,
    galleryPrev: '前のスクリーンショット',
    galleryNext: '次のスクリーンショット',
    galleryGoTo: (n) => `スクリーンショット${n}を表示`,
    systemMap: 'システムの流れ',
    architecture: 'システム構成',
    viewDetails: '詳細を見る',
    contribution: (total) => `直近12か月で ${total} 件のコントリビューション`,
    less: '少',
    more: '多',
    dayTooltip: (count, dateLabel) => `${dateLabel}に${count}件のコントリビューション`,
    contributionStats: {
      total: 'コントリビューション',
      window: '直近12か月',
      active: '活動日数',
      activeOf: (days) => `${days}日中`,
      longest: '最長連続記録',
      days: (n) => `${n}日`,
      current: (n) => `現在 ${n}日連続`,
      best: '最多の日',
      count: (n) => (n === 0 ? 'コントリビューションなし' : `${n}件のコントリビューション`),
      month: (label, count, active) => `${label}：${active}日間で${count}件のコントリビューション`,
      gridHint: 'コントリビューションカレンダー。矢印キーで日付を移動できます。',
      other: 'その他',
    },
    a11y: {
      language: '言語',
      skillsCarousel: '技術スキルのカルーセル',
      contributionGrid: 'コントリビューショングリッド',
      contactLinks: '連絡先リンク',
      moreContactLinks: 'その他の連絡先リンク',
      toggleDetails: (company) => `${company}の詳細を開閉`,
      viewPhoto: '写真を表示',
      profilePhoto: 'プロフィール写真',
      enlargedPhoto: 'モハメド・フアド（拡大表示）',
      showPhoto: 'プロフィール写真を表示',
      showQr: 'LinkedInのQRコードを表示',
      linkedinQr: 'LinkedInのQRコード',
      preview: (title) => `${title}の画面プレビュー`,
      closeDialog: '閉じる',
    },
  },
};

// Warm field for transitions that have no project of their own.
const DEFAULT_PALETTE = ['#fbe9d0', '#f6b26b', '#f07a3a', '#e2431d'];

const projects = [
  {
    title: 'Ledger',
    slug: 'ledger',
    gallery: [
      { src: '/media/gallery/ledger-1.jpg', caption: { en: 'Overview with the headline results', ja: '結果をまとめた概要画面' } },
      { src: '/media/gallery/ledger-2.jpg', caption: { en: 'Strategy 3, the page-scoring gate', ja: '戦略3：ページ採点ゲート' } },
      { src: '/media/gallery/ledger-3.jpg', caption: { en: 'Speed and accuracy benchmarks', ja: '速度と精度のベンチマーク' } },
      { src: '/media/gallery/ledger-4.jpg', caption: { en: 'The report corpus, built with Firecrawl', ja: 'Firecrawlで構築した報告書コーパス' } },
    ],
    palette: ['#e8eef6', '#9fbde8', '#3f7ad6', '#1f4fa3'],
    // #3f7ad6 from the palette, one step darker so white text on it reaches
    // 4.7:1 instead of 4.4:1.
    accents: ['#3771cc', '#9fbde8', '#1f4fa3'],
    badge: 'AI pipeline',
    badgeJa: 'AIパイプライン',
    image: '/media/projects/ledger-en-card.webp',
    imageJa: '/media/projects/ledger-ja-card.webp',
    video: '/media/video/ledger.mp4',
    icon: FileSearch,
    live: 'https://assignment.mohamedfuad.com',
    github: 'https://github.com/MohamedFuad16/ledger-financial-report-system',
    description:
      'Reads a 100-page annual report, finds the few pages that matter, and returns a checked balance sheet.',
    descriptionJa:
      '100ページを超える年次報告書から必要なページだけを見つけ、検証済みの貸借対照表を返します。',
    tech: ['Python', 'pdf-inspector', 'Firecrawl', 'LLM', 'React'],
    detail: {
      tagline: {
        en: 'Turn an annual report PDF into 27 verified balance-sheet rows, using a tenth of the tokens a whole-document prompt needs.',
        ja: '年次報告書のPDFを、文書全体を渡す場合の約10分の1のトークンで、検証済みの貸借対照表27行に変換します。',
      },
      // Re-derived on 2026-09-23 from the live /api/benchmark-summary and
      // /api/benchmark-runs endpoints, not from the repo README, whose corpus
      // figures (75 reports, 34 companies) predate the published summary.
      // Speed and tokens use the same cohort as the site's own charts: Gemini
      // 3.7 Flash runs on the 46 reports every strategy processed (whole
      // report without OCR 36.7s and 92.9k tokens, gate 31.0s and 8.9k).
      highlights: [
        { value: '100%', label: { en: 'exact match on 966 rows', ja: '966行すべて完全一致' } },
        { value: '47', label: { en: 'annual reports, 10 companies', ja: '10社の年次報告書' } },
        { value: '31s', label: { en: 'per report, end to end', ja: '1件あたりの処理時間' } },
        { value: '90%', label: { en: 'fewer tokens than the whole PDF', ja: '全文送信よりトークン削減' } },
      ],
      // Same cohort as the highlights: Gemini 3.7 Flash, the 46 reports every
      // method processed, mean per report (re-derived 2026-09-24 from
      // /api/benchmark-runs). One chart per measure; they never share an axis.
      benchmark: {
        caption: {
          en: 'Mean of the 46 reports every method processed, on Gemini 3.7 Flash. From Ledger\'s published runs.',
          ja: '全方式が処理した46件の平均（Gemini 3.7 Flash）。Ledgerの公開ベンチマークより。',
        },
        charts: [
          {
            title: { en: 'Time per report', ja: '1件あたりの処理時間' },
            unit: 's',
            digits: 1,
            rows: [
              { label: { en: 'Whole report, no OCR', ja: '文書全体（OCRなし）' }, value: 36.7 },
              { label: { en: 'Whole report, with OCR', ja: '文書全体（OCRあり）' }, value: 34.7 },
              { label: { en: 'Ledger, best 3 to 5 pages', ja: 'Ledger（上位3〜5ページ）' }, value: 31.0, ours: true },
            ],
          },
          {
            title: { en: 'Input tokens per report', ja: '1件あたりの入力トークン' },
            unit: 'k',
            digits: 1,
            rows: [
              { label: { en: 'Whole report, no OCR', ja: '文書全体（OCRなし）' }, value: 92.9 },
              { label: { en: 'Whole report, with OCR', ja: '文書全体（OCRあり）' }, value: 93.2 },
              { label: { en: 'Ledger, best 3 to 5 pages', ja: 'Ledger（上位3〜5ページ）' }, value: 8.9, ours: true },
            ],
          },
        ],
      },
      overview: {
        en: 'Annual reports run past a hundred pages, but the balance sheet is only a few of them. Ledger finds those pages locally and sends only the best three to five to the model. The answer maps to a fixed 27-row schema and is checked arithmetically before it is scored.',
        ja: '年次報告書は100ページを超えますが、貸借対照表はそのうちの数ページです。Ledgerはそのページをローカルで見つけ、上位3〜5ページだけをモデルに送ります。回答は27行の固定スキーマに対応付けられ、採点前に計算チェックを通ります。',
      },
      features: [
        {
          title: { en: 'OCR only where needed', ja: '必要なページだけOCR' },
          en: 'Readable pages keep their text. Only broken pages go through local OCR.',
          ja: '読めるページはそのまま使い、崩れたページだけをローカルOCRに回します。',
        },
        {
          title: { en: 'Page scoring gate', ja: 'ページ採点ゲート' },
          en: 'A 132-page 3M report shrinks to 5 pages and about 8,500 tokens.',
          ja: '132ページの3Mの報告書が5ページ、約8,500トークンになります。',
        },
        {
          title: { en: 'Checked answers', ja: '検証済みの回答' },
          en: 'Every answer must fit 27 rows and balance. Doubtful values are flagged.',
          ja: '27行の契約と貸借の一致を検証し、疑わしい値は明示します。',
        },
        {
          title: { en: 'Sealed answer key', ja: '正解データは非公開' },
          en: 'Gold values are pinned to each PDF by SHA-256 and never reach the model.',
          ja: '正解値はSHA-256で各PDFに固定され、モデルには渡りません。',
        },
        {
          title: { en: 'Report corpus', ja: '報告書コーパス' },
          en: 'Firecrawl finds official reports, and each is screened and pinned before use.',
          ja: 'Firecrawlで公式報告書を探し、検査と固定を経てから使います。',
        },
      ],
      flow: {
        en: 'A report goes in, the best pages are picked, one model call fills 27 rows, and the checks decide whether the result is stored or flagged.',
        ja: '報告書を取り込み、最適なページを選び、モデル1回で27行を埋め、チェックの結果で保存かレビューかが決まります。',
      },
      architecture: [
        { label: { en: 'Inspect', ja: '解析' }, detail: { en: 'Native text or OCR per page', ja: 'ページごとにテキストかOCR' } },
        { label: { en: 'Select', ja: '選別' }, detail: { en: 'Top 3 to 5 pages', ja: '上位3〜5ページ' } },
        { label: { en: 'Map', ja: '対応付け' }, detail: { en: 'One model call, 27 rows', ja: 'モデル1回で27行' } },
        { label: { en: 'Verify', ja: '検証' }, detail: { en: 'Contract and arithmetic', ja: '契約と計算チェック' } },
      ],
      stack: [
        {
          kind: 'terminal',
          title: { en: 'Annual report PDF', ja: '年次報告書PDF' },
          sub: { en: 'Upload or corpus', ja: 'アップロード/コーパス' },
          edge: { en: 'inspect', ja: '解析' },
        },
        {
          title: { en: 'pdf-inspector', ja: 'pdf-inspector' },
          sub: { en: 'Classifies every page', ja: '全ページを分類' },
          edge: { en: 'pages', ja: 'ページ' },
          branch: {
            title: { en: 'Local OCR', ja: 'ローカルOCR' },
            edge: { en: 'broken pages', ja: '崩れたページ' },
          },
        },
        {
          title: { en: 'Page scoring gate', ja: 'ページ採点ゲート' },
          sub: { en: 'Keeps the top 3 to 5', ja: '上位3〜5ページ' },
          edge: { en: 'evidence', ja: '根拠' },
        },
        {
          title: { en: 'LLM mapping', ja: 'LLMで対応付け' },
          sub: { en: '27 rows as JSON', ja: '27行のJSON' },
          edge: { en: 'validate', ja: '検証' },
        },
        {
          kind: 'decision',
          title: { en: 'Checks pass?', ja: '検証を通過？' },
          sub: { en: 'Schema and arithmetic', ja: 'スキーマと計算' },
          edge: { en: 'yes', ja: 'はい' },
          branch: {
            title: { en: 'Flag for review', ja: 'レビューへ回す' },
            edge: { en: 'no', ja: 'いいえ' },
          },
        },
        {
          kind: 'terminal',
          title: { en: 'Verified balance sheet', ja: '検証済みの貸借対照表' },
          sub: { en: 'Stored and scored', ja: '保存して採点' },
        },
      ],
    },
  },
  {
    title: 'WebDrop',
    slug: 'webdrop',
    gallery: [
      { src: '/media/gallery/webdrop-1.jpg', caption: { en: 'Onboarding: bump to connect', ja: 'オンボーディング：近づけて接続' } },
      { src: '/media/gallery/webdrop-2.jpg', caption: { en: 'Settings: name and profile icon', ja: '設定：名前とプロフィールアイコン' } },
      { src: '/media/gallery/webdrop-3.jpg', caption: { en: 'Settings in Japanese', ja: '日本語の設定画面' } },
      { src: '/media/gallery/webdrop-4.jpg', caption: { en: 'The nearby radar in dark mode', ja: 'ダークモードの近接レーダー' } },
    ],
    palette: ['#eef1fb', '#b4c2ff', '#7fa0ff', '#8f7ae6'],
    accents: ['#7fa0ff', '#b4c2ff', '#8f7ae6'],
    badge: 'live app',
    badgeJa: '公開中のアプリ',
    image: '/media/projects/webdrop-en-card.webp',
    imageJa: '/media/projects/webdrop-ja-card.webp',
    video: '/media/video/webdrop.mp4',
    icon: Radio,
    live: 'https://webdrop.mohamedfuad.com/',
    github: 'https://github.com/MohamedFuad16/WebDrop',
    description:
      'Nearby file sharing in the browser, with proximity checks and direct WebRTC transfers.',
    descriptionJa:
      '近くの端末へ、ブラウザだけでファイルを送れるアプリ。近接を確認したうえでWebRTCで直接転送します。',
    tech: ['JavaScript', 'WebRTC', 'OPFS', 'Web Audio', 'PWA'],
    detail: {
      tagline: {
        en: 'A browser-based way to send files to someone nearby without uploading them first.',
        ja: 'ブラウザだけで、近くの相手へファイルを送れます。どこかへアップロードする必要はありません。',
      },
      overview: {
        en: 'WebDrop sends files to a nearby device straight from the browser. Devices find each other over WebSocket, prove they are close with ultrasound, motion or a QR code, then connect over WebRTC. The server only sets up the connection, and the file goes device to device.',
        ja: 'WebDropはブラウザから近くの端末へ直接ファイルを送ります。端末はWebSocketで互いを見つけ、超音波、動き、QRコードで近さを確かめてからWebRTCで接続します。サーバーは接続の準備だけを行い、ファイルは端末間を直接移動します。',
      },
      features: [
        {
          title: { en: 'Nearby radar', ja: '近接レーダー' },
          en: 'Pick a person on an orbit-style radar instead of typing a code.',
          ja: '軌道型のレーダーから相手を選ぶだけで、コード入力は不要です。',
        },
        {
          title: { en: 'Proximity check', ja: '近接確認' },
          en: 'Ultrasound and motion confirm the pair, with a short-lived QR fallback.',
          ja: '超音波と動きで確認し、使えないときは短時間のQRコードで代替します。',
        },
        {
          title: { en: 'Verified transfer', ja: '検証付きの転送' },
          en: '256 KB chunks, a SHA-256 manifest, retry, and files up to 500 MB.',
          ja: '256KBのチャンク、SHA-256照合、再送、最大500MBに対応します。',
        },
        {
          title: { en: 'Best local storage', ja: '最適な保存先' },
          en: 'Writes to OPFS, IndexedDB, StreamSaver or memory, whichever the browser supports.',
          ja: 'OPFS、IndexedDB、StreamSaver、メモリからブラウザが対応する先を選びます。',
        },
        {
          title: { en: 'Bilingual PWA', ja: '日英対応のPWA' },
          en: 'An offline shell, plus mock peers for testing without a server.',
          ja: 'オフラインで開くシェルと、サーバーなしで試せる疑似端末があります。',
        },
      ],
      flow: {
        en: 'Find a nearby device, confirm it is close, exchange connection details, then stream chunks straight into the receiver\'s storage.',
        ja: '近くの端末を見つけて近さを確認し、接続情報を交換してから、チャンクを受信側のストレージへ直接送ります。',
      },
      architecture: [
        { label: { en: 'Discover', ja: '検出' }, detail: { en: 'WebSocket presence', ja: 'WebSocketプレゼンス' } },
        { label: { en: 'Verify', ja: '近接確認' }, detail: { en: 'Audio, motion, or QR', ja: '音声・動き・QR' } },
        { label: { en: 'Connect', ja: '接続' }, detail: { en: 'SDP and ICE exchange', ja: 'SDP・ICE交換' } },
        { label: { en: 'Transfer', ja: '転送' }, detail: { en: 'WebRTC to local storage', ja: 'WebRTCから端末保存' } },
      ],
      stack: [
        {
          kind: 'terminal',
          title: { en: 'Sender browser', ja: '送信側ブラウザ' },
          sub: { en: 'Installable PWA', ja: 'インストール可能なPWA' },
          edge: { en: 'presence', ja: '在席通知' },
        },
        {
          title: { en: 'Signaling server', ja: 'シグナリングサーバー' },
          sub: { en: 'Node WebSocket', ja: 'Node WebSocket' },
          edge: { en: 'peer found', ja: '端末を検出' },
        },
        {
          kind: 'decision',
          title: { en: 'Close enough?', ja: '十分に近いか' },
          edge: { en: 'yes', ja: 'はい' },
          branch: {
            title: { en: 'QR pairing', ja: 'QRペアリング' },
            edge: { en: 'no', ja: 'いいえ' },
          },
        },
        {
          title: { en: 'WebRTC data channel', ja: 'WebRTCデータチャネル' },
          sub: { en: 'SDP + ICE, TURN relay', ja: 'SDP + ICE / TURN' },
          edge: { en: '256 KB chunks', ja: '256KBチャンク' },
          branch: {
            // Trimmed for the 116-unit phone branch box: the full
            // "SHA-256マニフェスト" measured 112.6 and left no margin at all.
            title: { en: 'SHA-256 manifest', ja: 'SHA-256照合' },
            edge: { en: 'verify', ja: '検証' },
          },
        },
        {
          kind: 'store',
          title: { en: 'Receiver storage', ja: '受信側ストレージ' },
          sub: { en: 'OPFS / IndexedDB / StreamSaver', ja: 'OPFS / IndexedDB / StreamSaver' },
        },
      ],
    },
  },
  {
    title: 'Internship Portal',
    slug: 'internship-portal',
    gallery: [
      { src: '/media/gallery/internship-portal-1.jpg', caption: { en: 'Sign in, in Japanese', ja: 'ログイン（日本語）' } },
      { src: '/media/gallery/internship-portal-2.jpg', caption: { en: 'Sign in', ja: 'ログイン' } },
      { src: '/media/gallery/internship-portal-3.jpg', caption: { en: 'Sign up', ja: '新規登録' } },
    ],
    palette: ['#f8ead9', '#f4b183', '#a8c5e8', '#6d93c9'],
    accents: ['#f4b183', '#a8c5e8', '#6d93c9'],
    badge: 'in progress',
    badgeJa: '開発中',
    image: '/media/projects/internship-portal-en-card.webp',
    imageJa: '/media/projects/internship-portal-ja-card.webp',
    video: '/media/video/internship-portal.mp4',
    icon: Target,
    live: 'https://portal.mohamedfuad.com',
    github: 'https://github.com/MohamedFuad16/resume-studio-dashboard',
    description:
      'A bilingual app for finding internships and keeping every application in one list, on the web and on iOS.',
    descriptionJa:
      'インターンを探し、応募をひとつのリストで管理できる日英対応のWeb・iOSアプリ。',
    tech: ['React', 'SwiftUI', 'Firestore', 'Express', 'AWS'],
    detail: {
      tagline: {
        en: 'A place to search for internships and keep every application in one list, on the web and on iOS.',
        ja: 'インターンを探して、応募をひとつのリストで管理できる場所。WebとiOSの両方で使えます。',
      },
      overview: {
        en: 'Search internships with a match score for each, and track every application in one list until a decision. It ships as a React web app and a SwiftUI iOS app from one repository, both in English and Japanese. Your own data stays in Firestore under owner-only rules and never reaches my server.',
        ja: 'インターンを適合スコア付きで検索し、応募は結果が出るまでひとつのリストで管理できます。ひとつのリポジトリからReactのWebアプリとSwiftUIのiOSアプリを提供し、どちらも日英に対応しています。自分のデータは所有者限定ルールのFirestoreに保存され、私のサーバーには届きません。',
      },
      features: [
        {
          title: { en: 'Match scores', ja: '適合スコア' },
          en: 'Every posting is scored against your profile.',
          ja: 'すべての求人をプロフィールと照らして採点します。',
        },
        {
          title: { en: 'One tracker', ja: 'ひとつのトラッカー' },
          en: 'Saved, applying, applied, interview and rejected, all in one list.',
          ja: '保存から面接、不採用まで、ひとつのリストで管理します。',
        },
        {
          title: { en: 'Gmail ingest', ja: 'Gmail取り込み' },
          en: 'An application is queued only when a quote from the email proves it.',
          ja: 'メール本文の引用で裏付けられた応募だけをキューに積みます。',
        },
        {
          title: { en: 'iOS app', ja: 'iOSアプリ' },
          en: 'Background sync, and a notification with the company logo.',
          ja: 'バックグラウンドで同期し、企業ロゴ付きの通知を送ります。',
        },
        {
          title: { en: 'Company research', ja: '企業リサーチ' },
          en: 'Live research over official company and hiring pages.',
          ja: '企業の公式ページや採用ページをもとにその場で調べます。',
        },
      ],
      flow: {
        en: 'Clients write personal data straight to Firestore. The catalog, company research and the Gmail queue come from an Express server on AWS EC2 in Tokyo.',
        ja: 'クライアントは個人データをFirestoreへ直接書き込みます。求人カタログ、企業リサーチ、GmailのキューはAWS EC2（東京）上のExpressサーバーが提供します。',
      },
      architecture: [
        { label: { en: 'Find', ja: '探す' }, detail: { en: 'Search the shared catalog', ja: '共有カタログを検索' } },
        { label: { en: 'Track', ja: '管理' }, detail: { en: 'Saved through to interview', ja: '保存から面接まで' } },
        { label: { en: 'Your data', ja: '自分のデータ' }, detail: { en: 'Firestore, owner-only', ja: 'Firestore・所有者限定' } },
        { label: { en: 'Shared server', ja: '共有サーバー' }, detail: { en: 'Express on AWS EC2', ja: 'AWS EC2上のExpress' } },
      ],
      stack: [
        {
          kind: 'terminal',
          title: { en: 'Web and iOS clients', ja: 'Web・iOSクライアント' },
          sub: { en: 'React SPA + SwiftUI', ja: 'React SPA + SwiftUI' },
          edge: { en: 'sign in', ja: 'サインイン' },
        },
        {
          kind: 'decision',
          title: { en: 'Whose data is it?', ja: 'どちらのデータか' },
          edge: { en: 'shared', ja: '共有' },
          branch: {
            kind: 'store',
            // Kept short on purpose: the compact (phone) branch box is 116 user
            // units wide, and "Firestore（所有者限定）" measured 126 and spilled
            // out of the viewBox. The owner-only rule is stated in the prose.
            title: { en: 'Firestore', ja: 'Firestore' },
            edge: { en: 'personal data', ja: '個人データ' },
          },
        },
        {
          title: { en: 'Express on AWS EC2', ja: 'AWS EC2上のExpress' },
          sub: { en: 'Catalog, research, Gmail queue', ja: 'カタログ・リサーチ・Gmail' },
          edge: { en: 'snapshot', ja: 'スナップショット' },
          branch: {
            title: { en: 'Gmail ingest', ja: 'Gmail取り込み' },
            edge: { en: 'queued', ja: 'キュー' },
          },
        },
        {
          kind: 'store',
          title: { en: 'SQLite catalog', ja: 'SQLiteカタログ' },
          sub: { en: 'Copied to durable storage', ja: '永続ストレージへ保存' },
        },
      ],
    },
  },
  {
    title: 'CCFT',
    slug: 'ccft',
    gallery: [
      { src: '/media/gallery/ccft-1.jpg', caption: { en: 'A new thread', ja: '新しいスレッド' } },
      { src: '/media/gallery/ccft-2.jpg', caption: { en: 'Planning a task graph with Haiku 4.5', ja: 'Haiku 4.5でタスクグラフを計画' } },
      { src: '/media/gallery/ccft-3.jpg', caption: { en: 'Model picker', ja: 'モデル選択' } },
      { src: '/media/gallery/ccft-4.jpg', caption: { en: 'Agent roles', ja: 'エージェントの役割' } },
      { src: '/media/gallery/ccft-5.jpg', caption: { en: 'General settings', ja: '一般設定' } },
      { src: '/media/gallery/ccft-6.jpg', caption: { en: 'About', ja: 'アプリについて' } },
    ],
    // Teal, so it no longer reads as a second Ledger (both were blue).
    palette: ['#0f2a26', '#0e7a69', '#1fb39a', '#9fe3d3'],
    accents: ['#1fb39a', '#9fe3d3', '#0e7a69'],
    badge: 'multi-agent runtime',
    badgeJa: 'マルチエージェント実行基盤',
    image: '/media/projects/ccft-card.webp',
    video: '/media/video/ccft.mp4',
    icon: Network,
    private: true,
    description:
      'A leader model plans the work as a task graph, and a scheduler runs parallel worker agents through it, with a native macOS app on top.',
    descriptionJa:
      'リーダーモデルが作業をタスクグラフとして計画し、スケジューラが並列のワーカーエージェントを実行します。操作はネイティブのmacOSアプリから行います。',
    tech: ['Go', 'SwiftUI', 'Claude Code', 'tmux', 'DAG'],
    detail: {
      tagline: {
        en: 'One model plans, a team of workers builds, and nothing counts as done until it passes a check.',
        ja: '一つのモデルが計画し、ワーカーのチームが作り、チェックを通るまで何も完了とみなしません。',
      },
      // Figures from the engine's own status write-up (CCFT-OVERVIEW.md,
      // 19 Sep 2026) and its guardrail table, not estimates.
      highlights: [
        { value: '20', label: { en: 'guardrail rules', ja: 'ガードレールのルール' } },
        { value: '11', label: { en: 'failure cases tested', ja: '検証した障害ケース' } },
        { value: '133', label: { en: 'macOS app tests', ja: 'macOSアプリのテスト' } },
        { value: '2.8k', label: { en: 'tokens per worker brief', ja: 'ワーカー指示のトークン' } },
      ],
      overview: {
        en: 'You talk to one leader model, and it never does the work itself. It plans the job as a task graph, and a scheduler runs every ready node as a wave of parallel workers. A node counts as done only after its checks pass.',
        ja: 'リーダーとなる一つのモデルと会話し、リーダー自身は作業をしません。仕事をタスクグラフとして計画し、スケジューラが実行可能なノードを並列ワーカーのウェーブとして走らせます。ノードはチェックを通って初めて完了になります。',
      },
      features: [
        {
          title: { en: 'Validated graph', ja: '実行前の検証' },
          en: 'Clashing writes and uncheckable nodes are refused before anything runs.',
          ja: '同時書き込みや検証できないノードは、実行前に拒否します。',
        },
        {
          title: { en: 'Quota-aware scheduler', ja: 'クォータを守るスケジューラ' },
          en: 'Capacity is reserved per account before each dispatch.',
          ja: '送信の前に、アカウントごとに枠を確保します。',
        },
        {
          title: { en: 'Clear failure routes', ja: '失敗時の道筋' },
          en: 'A failure retries, replans or continues, and names the next command.',
          ja: '失敗は再試行、再計画、続行に分かれ、次のコマンドを示します。',
        },
        {
          title: { en: 'Role fences', ja: '役割の制限' },
          en: 'Hooks stop the leader writing code and workers leaving their paths.',
          ja: 'リーダーのコード記述やワーカーの範囲外への書き込みをフックが止めます。',
        },
        {
          title: { en: 'Mixed models', ja: '複数のモデル' },
          en: 'Workers can be Claude, Codex, GLM or Grok, each with its quota shown.',
          ja: 'Claude、Codex、GLM、Grokをワーカーに使え、それぞれのクォータを表示します。',
        },
      ],
      flow: {
        en: 'The leader registers a graph, the controller hands out ready nodes, workers answer in JSON contracts, and accepted nodes unlock the next wave.',
        ja: 'リーダーがグラフを登録し、コントローラーが実行可能なノードを配り、ワーカーはJSONの契約で答え、受理されたノードが次のウェーブを解放します。',
      },
      architecture: [
        { label: { en: 'Leader', ja: 'リーダー' }, detail: { en: 'Plans a task graph', ja: 'タスクグラフを計画' } },
        { label: { en: 'Scheduler', ja: 'スケジューラ' }, detail: { en: 'Dispatches ready waves', ja: '実行可能なウェーブを送信' } },
        { label: { en: 'Workers', ja: 'ワーカー' }, detail: { en: 'Parallel, role-fenced', ja: '並列・役割を制限' } },
        { label: { en: 'Verify', ja: '検証' }, detail: { en: 'Contract and checks', ja: '契約とチェック' } },
      ],
      stack: [
        {
          kind: 'terminal',
          title: { en: 'Request in the app', ja: 'アプリでの依頼' },
          sub: { en: 'SwiftUI on macOS', ja: 'macOSのSwiftUI' },
          edge: { en: 'plan', ja: '計画' },
        },
        {
          title: { en: 'Leader model', ja: 'リーダーモデル' },
          sub: { en: 'Registers a task graph', ja: 'タスクグラフを登録' },
          edge: { en: 'register', ja: '登録' },
        },
        {
          title: { en: 'Runtime scheduler', ja: 'ランタイムスケジューラ' },
          sub: { en: 'Ready nodes as a wave', ja: '実行可能なノードをまとめて送信' },
          edge: { en: 'dispatch', ja: '送信' },
          branch: {
            title: { en: 'Parallel workers', ja: '並列ワーカー' },
            edge: { en: 'wave', ja: 'ウェーブ' },
          },
        },
        {
          kind: 'decision',
          title: { en: 'Report accepted?', ja: '報告を受理？' },
          sub: { en: 'Contract and checks', ja: '契約とチェック' },
          edge: { en: 'yes', ja: 'はい' },
          branch: {
            title: { en: 'Retry or replan', ja: '再試行か再計画' },
            edge: { en: 'no', ja: 'いいえ' },
          },
        },
        {
          kind: 'terminal',
          title: { en: 'Leader answers', ja: 'リーダーが回答' },
          sub: { en: 'After the last node', ja: '最後のノードの後' },
        },
      ],
    },
  },
  {
    title: 'Tutor-System',
    slug: 'tutor-system',
    gallery: [
      { src: '/media/gallery/tutor-system-1.jpg', caption: { en: 'Study: upload a document', ja: '学習：資料をアップロード' } },
      { src: '/media/gallery/tutor-system-2.jpg', caption: { en: 'Tutor chat', ja: 'チューターとのチャット' } },
      { src: '/media/gallery/tutor-system-3.jpg', caption: { en: 'Cognitive analytics', ja: '学習分析' } },
      { src: '/media/gallery/tutor-system-4.jpg', caption: { en: 'Revision library', ja: '復習ライブラリ' } },
      { src: '/media/gallery/tutor-system-5.jpg', caption: { en: 'App settings', ja: 'アプリ設定' } },
    ],
    palette: ['#2a1a10', '#ff7a1a', '#ffb066', '#fbe3c8'],
    // The palette's cream (#fbe3c8) vanishes on the light page, so the third
    // accent is a deeper step of the same ember hue.
    accents: ['#ff7a1a', '#ffb066', '#c94f0e'],
    badge: 'long-term project',
    badgeJa: '長期プロジェクト',
    image: '/media/projects/tutor-en-card.webp',
    imageJa: '/media/projects/tutor-ja-card.webp',
    video: '/media/video/tutor-system.mp4',
    icon: Sparkles,
    live: 'https://tutor-system-architecture.vercel.app/',
    github: 'https://github.com/MohamedFuad16/Tutor-System',
    description:
      'A study workspace for papers and textbooks that keeps track of where every answer came from.',
    descriptionJa:
      '論文や教科書を読むためのワークスペース。回答の根拠がどこにあるのかを見失わずに学べます。',
    tech: ['React 19', 'TypeScript', 'OpenRouter', 'Deepgram', 'Dexie'],
    detail: {
      tagline: {
        en: 'Ask a question about a PDF and the answer comes back with the page it came from.',
        ja: 'PDFについて質問すると、根拠になったページと一緒に答えが返ってきます。',
      },
      overview: {
        en: 'Tutor is a study workspace for papers and textbooks. Ask about a PDF by text or voice, and every answer keeps the page it came from. Books, evidence and corrections are stored as local records you can inspect.',
        ja: 'Tutorは論文や教科書のための学習ワークスペースです。PDFについてテキストか音声で質問でき、回答には根拠のページが付きます。書籍、根拠、訂正は、中身を確認できるローカルの記録として保存されます。',
      },
      features: [
        {
          title: { en: 'Context packet', ja: 'コンテキスト構築' },
          en: 'Each answer starts from the page, the selection, the history and your learner state.',
          ja: 'ページ、選択範囲、履歴、学習状態から回答を組み立てます。',
        },
        {
          title: { en: 'Rich answers', ja: '読みやすい回答' },
          en: 'Streamed with citations, diagrams, math and code, with optional speech.',
          ja: '引用、図、数式、コード付きでストリーミングし、読み上げもできます。',
        },
        {
          title: { en: 'Voice mode', ja: '音声モード' },
          en: 'Deepgram through a local broker, sharing context with the chat.',
          ja: 'ローカル経由のDeepgramを使い、チャットと同じ文脈を共有します。',
        },
        {
          title: { en: 'Background jobs', ja: 'バックグラウンド処理' },
          en: 'Quick answers come first. Slow retrieval runs later and stays traceable.',
          ja: 'まずすぐに答え、重い検索は後で実行して履歴を残します。',
        },
        {
          title: { en: 'Local records', ja: 'ローカルの記録' },
          en: 'SQLite and files per user, with Dexie as a light browser cache.',
          ja: 'ユーザー単位のSQLiteとファイルに保存し、Dexieは軽いキャッシュです。',
        },
      ],
      flow: {
        en: 'A question gathers its page, history and evidence, the tutor answers straight away, and slow work finishes in the background.',
        ja: '質問から関連ページ、履歴、根拠を集め、チューターがすぐに答え、重い処理はバックグラウンドで続きます。',
      },
      architecture: [
        { label: { en: 'Study input', ja: '学習入力' }, detail: { en: 'PDF, text, or voice', ja: 'PDF・文章・音声' } },
        { label: { en: 'Context', ja: 'コンテキスト' }, detail: { en: 'Sources and learner state', ja: '出典と学習状態' } },
        { label: { en: 'Tutor', ja: 'チューター' }, detail: { en: 'LLM, voice, and tools', ja: 'LLM・音声・ツール' } },
        { label: { en: 'Learning record', ja: '学習記録' }, detail: { en: 'SQLite, files, and Dexie', ja: 'SQLite・ファイル・Dexie' } },
      ],
      stack: [
        {
          kind: 'terminal',
          title: { en: 'Question', ja: '質問' },
          sub: { en: 'Chat, PDF selection, or voice', ja: 'チャット・PDF選択・音声' },
          edge: { en: 'assemble', ja: '構築' },
          branch: {
            title: { en: 'Deepgram STT', ja: 'Deepgram STT' },
            edge: { en: 'if voice', ja: '音声時' },
          },
        },
        {
          title: { en: 'Context packet', ja: 'コンテキストパケット' },
          sub: { en: 'Sources + learner state', ja: '出典 + 学習者状態' },
          edge: { en: 'prompt', ja: 'プロンプト' },
        },
        {
          title: { en: 'Tutor model', ja: 'チューターモデル' },
          sub: { en: 'OpenRouter LLM + tools', ja: 'OpenRouter LLM + ツール' },
          edge: { en: 'answer', ja: '回答' },
          branch: {
            title: { en: 'Background tasks', ja: 'バックグラウンド処理' },
            edge: { en: 'slow work', ja: '重い処理' },
          },
        },
        {
          kind: 'store',
          title: { en: 'Local learning record', ja: 'ローカル学習記録' },
          sub: { en: 'SQLite, Dexie, artifacts', ja: 'SQLite・Dexie・成果物' },
        },
      ],
    },
  },
  {
    title: 'TokaiHub',
    slug: 'tokaihub',
    gallery: [
      { src: '/media/gallery/tokaihub-1.jpg', caption: { en: "Home with today's classes", ja: 'ホームと今日の授業' } },
      { src: '/media/gallery/tokaihub-2.jpg', caption: { en: 'Weekly schedule', ja: '週間スケジュール' } },
      { src: '/media/gallery/tokaihub-3.jpg', caption: { en: 'Classes', ja: '授業一覧' } },
    ],
    palette: ['#fbe7a0', '#f9d64a', '#f4a3b4', '#b9e0a5'],
    accents: ['#f9d64a', '#f4a3b4', '#b9e0a5'],
    badge: 'student PWA',
    badgeJa: '学生向けPWA',
    image: '/media/projects/tokaihub-en-card.webp',
    imageJa: '/media/projects/tokaihub-ja-card.webp',
    video: '/media/video/tokaihub.mp4',
    icon: Smartphone,
    live: 'https://tokaihub.mohamedfuad.com/',
    github: 'https://github.com/MohamedFuad16/TokaiHub',
    description:
      'A bilingual Tokai University student app that reads the TIPS portal: timetable, syllabi, grades and credits.',
    descriptionJa:
      '東海大学のTIPSポータルを読み込み、時間割、シラバス、成績、単位をまとめる日英対応の学生アプリ。',
    tech: ['React', 'TypeScript', 'Tailwind', 'Playwright', 'Passkeys'],
    detail: {
      tagline: {
        en: 'One place on a phone for the university things a student checks every week.',
        ja: 'スマートフォンから、毎週確認する大学の情報をまとめて開ける場所です。',
      },
      overview: {
        en: 'TokaiHub puts timetable, syllabi, grades, attendance and notices on one phone screen. TIPS has no API, so a small bridge signs in like a browser and turns its pages into JSON. The hosted app unlocks only with the owner\'s passkey.',
        ja: 'TokaiHubは、時間割、シラバス、成績、出席、お知らせをスマートフォンの一画面にまとめます。TIPSにはAPIがないため、小さなブリッジがブラウザと同じようにログインし、ページをJSONに変換します。公開版はオーナーのパスキーでのみ開きます。',
      },
      features: [
        {
          title: { en: 'Timetable', ja: '時間割' },
          en: "Today's classes and the week, for the active term.",
          ja: '今日の授業と今学期の週間時間割を表示します。',
        },
        {
          title: { en: 'Course pages', ja: '授業ページ' },
          en: 'Full syllabus, files and one grading panel per course.',
          ja: 'シラバス全文、添付ファイル、授業ごとの評価パネルを表示します。',
        },
        {
          title: { en: 'Credits to graduate', ja: '卒業までの単位' },
          en: 'Credits earned, credits still needed, and a planner.',
          ja: '取得単位と残りの必要単位を示し、履修計画に使えます。',
        },
        {
          title: { en: 'Passkey unlock', ja: 'パスキーで解除' },
          en: 'The hosted app only answers the owner\'s device.',
          ja: '公開版はオーナーの端末にだけ応答します。',
        },
        {
          title: { en: 'Two languages, two themes', ja: '日英と2つのテーマ' },
          en: 'English or Japanese, in a light or a dark theme.',
          ja: '日本語と英語、ライトとダークのテーマを選べます。',
        },
      ],
      flow: {
        en: 'The PWA asks the bridge, the bridge reads TIPS in headless Chromium, and the parsed pages come back as typed JSON.',
        ja: 'PWAがブリッジに問い合わせ、ブリッジがヘッドレスChromiumでTIPSを読み、解析したページを型付きJSONで返します。',
      },
      architecture: [
        { label: { en: 'React PWA', ja: 'React PWA' }, detail: { en: 'Bilingual mobile UI', ja: '日英モバイルUI' } },
        { label: { en: 'Bridge', ja: 'ブリッジ' }, detail: { en: 'Express, passkey unlock', ja: 'Express・パスキー解除' } },
        { label: { en: 'TIPS session', ja: 'TIPSセッション' }, detail: { en: 'Playwright Chromium', ja: 'Playwright Chromium' } },
        { label: { en: 'Parsers', ja: 'パーサー' }, detail: { en: 'HTML to typed JSON', ja: 'HTMLを型付きJSONへ' } },
      ],
      stack: [
        {
          kind: 'terminal',
          title: { en: 'Student opens PWA', ja: '学生がPWAを開く' },
          sub: { en: 'React + Tailwind, EN / JA', ja: 'React + Tailwind / 日英' },
          edge: { en: 'request', ja: 'リクエスト' },
        },
        {
          kind: 'decision',
          title: { en: 'Owner device?', ja: 'オーナーの端末？' },
          edge: { en: 'yes', ja: 'はい' },
          branch: {
            title: { en: 'Passkey unlock', ja: 'パスキーで解除' },
            edge: { en: 'no', ja: 'いいえ' },
          },
        },
        {
          title: { en: 'Bridge server', ja: 'ブリッジサーバー' },
          sub: { en: 'Express, one TIPS request at a time', ja: 'Express・TIPSへ1件ずつ' },
          edge: { en: 'read', ja: '読み込み' },
        },
        {
          title: { en: 'TIPS in Chromium', ja: 'ChromiumでTIPS' },
          sub: { en: 'Signed-in session, cheerio parsers', ja: 'ログイン済みセッション・cheerio' },
          edge: { en: 'cache', ja: 'キャッシュ' },
        },
        {
          kind: 'store',
          title: { en: 'Encrypted cache', ja: '暗号化キャッシュ' },
          sub: { en: 'Screens paint cached data first', ja: 'キャッシュを先に表示' },
        },
      ],
    },
  },
];


// Number pop-in, after transitions.dev's transition of the same name. Their
// measured parameters: 500ms, cubic-bezier(0.34, 1.45, 0.64, 1), 70ms stagger
// per character, each rising from translateY(8px) with opacity 0 and a 2px
// blur. Digits are laid out with tabular-nums so a changing value never shifts
// the characters beside it (ADR-048).
const POP_DURATION = 0.5;
const POP_STAGGER = 0.07;
const POP_DISTANCE = 8;
const POP_BLUR = 2;
const popEase = CustomEase.create('number-pop', '0.34, 1.45, 0.64, 1');

/**
 * A number whose digits pop in one after another — replayed whenever the
 * element scrolls into view, and again whenever the value itself changes, so a
 * new visit visibly ticks the counter over.
 */
function PopInNumber({ value, className = '' }) {
  const wrapRef = useRef(null);
  const chars = String(value).split('');

  const play = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const targets = el.querySelectorAll('.pop-char');
    gsap.fromTo(
      targets,
      { yPercent: 0, y: POP_DISTANCE, opacity: 0, filter: `blur(${POP_BLUR}px)` },
      {
        y: 0,
        opacity: 1,
        filter: 'blur(0px)',
        duration: POP_DURATION,
        stagger: POP_STAGGER,
        ease: popEase,
        overwrite: true,
      }
    );
  };

  // Replay on every entry into view, in both scroll directions.
  useGSAP(
    () => {
      const el = wrapRef.current;
      if (!el) return;
      const trigger = ScrollTrigger.create({
        trigger: el,
        start: 'top bottom-=20',
        onEnter: play,
        onEnterBack: play,
      });
      return () => trigger.kill();
    },
    { dependencies: [] }
  );

  // Replay when the number changes — a fresh visit arriving.
  useEffect(() => {
    play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <span className={`pop-number ${className}`.trim()} ref={wrapRef}>
      {chars.map((c, i) => (
        <span className="pop-char" key={`${i}-${c}`} aria-hidden="true">
          {c}
        </span>
      ))}
      {/* The split characters are decorative; expose the plain value once. */}
      <span className="sr-only">{value}</span>
    </span>
  );
}

// How often to re-read the counter so someone else's visit ticks the number
// over while the page is open. Only polls while the tab is actually visible.
const VISITS_POLL_MS = 45000;
const VISITED_FLAG = 'portfolio-counted';

/**
 * Reads the visitor count from /api/visits, incrementing once per browser. The
 * server also dedupes by hashed IP, so this flag is just about not making a
 * pointless write on every reload.
 *
 * Returns `null` until a real number arrives, and stays `null` if the endpoint
 * is unavailable — the footer then renders without the counter rather than
 * showing a zero or a broken placeholder.
 */
function useVisitorCount() {
  const [count, setCount] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const read = async (increment) => {
      try {
        const response = await fetch('/api/visits', {
          method: increment ? 'POST' : 'GET',
          cache: 'no-store',
        });
        if (!response.ok) return;
        const payload = await response.json();
        if (cancelled || !Number.isFinite(Number(payload.count))) return;
        setCount(Number(payload.count));
      } catch {
        /* offline, blocked, or not deployed yet — leave the counter hidden */
      }
    };

    let firstVisit = false;
    try {
      firstVisit = !window.localStorage.getItem(VISITED_FLAG);
      if (firstVisit) window.localStorage.setItem(VISITED_FLAG, '1');
    } catch {
      /* private mode: fall back to a plain read */
    }
    read(firstVisit);

    const tick = () => {
      if (document.visibilityState === 'visible') read(false);
    };
    const timer = window.setInterval(tick, VISITS_POLL_MS);
    document.addEventListener('visibilitychange', tick);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);

  return count;
}

/** Live prefers-reduced-motion flag, so decorative loops can stand down. */
// The page ships build-time HTML (scripts/prerender.mjs): English, dark, home
// route. React's first client render has to produce that same markup, so any
// state read from the browser starts from those defaults while hydrating (and
// on the server), then App corrects it in a layout effect before paint.
const IS_SERVER = typeof window === 'undefined';
const PRERENDERED = !IS_SERVER && Boolean(document.getElementById('root')?.firstElementChild);
let hydratingPrerender = PRERENDERED;
const fromBrowser = (read, fallback) => (IS_SERVER || hydratingPrerender ? fallback : read());

function readLocale() {
  try {
    const saved = window.localStorage.getItem('portfolio-locale');
    if (saved === 'en' || saved === 'ja') return saved;
  } catch {
    /* storage unavailable */
  }
  return navigator.language?.toLowerCase().startsWith('ja') ? 'ja' : 'en';
}

// public/theme-init.js has already set <html data-theme> before this bundle
// ran (saved choice, else the system setting), so there is no dark-then-light
// flash on first paint.
const readTheme = () => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');

// Nothing saved yet means the visitor never chose, so keep following the
// system if it changes while the page is open.
function readThemeChosen() {
  try {
    return Boolean(window.localStorage.getItem('portfolio-theme'));
  } catch {
    return false;
  }
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    fromBrowser(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, false)
  );
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(query.matches);
    const onChange = (event) => setReduced(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return reduced;
}


// The hero line rolls through what Mohamed builds; only the characters that
// differ move (Scritto). Its own component so the 2.8s tick re-renders one
// line, not the whole page (the App-level version cost ~33ms per tick and
// stuttered the project transition). Held still under reduced motion.
function RollingRole({ roles, reducedMotion }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (reducedMotion) return undefined;
    const timer = window.setInterval(() => setIndex((value) => value + 1), 2800);
    return () => window.clearInterval(timer);
  }, [reducedMotion]);
  return <Scritto className="building-roll" value={roles[index % roles.length]} transition={{ duration: 520 }} />;
}

// Cmd/Ctrl+K search, after the REMODY palette: it animates in and out, a
// highlight glides between results instead of jumping, the active result's
// icon tile turns ember, and results are grouped with counts. Every entry does
// something a visitor can already do somewhere on the page. Plain CSS and one
// measured highlight, so it adds no animation library to the bundle.
const COMMAND_EXIT_MS = 220;

function CommandMenu({ items, suggestions, t }) {
  // Owns its open state, so opening re-renders only the palette and not the
  // whole page (which used to eat the entrance animation's first frames).
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  // 'enter' paints the hidden start state first; two frames later 'shown'
  // runs the transition, so the entrance can never be skipped.
  const [phase, setPhase] = useState('enter');
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const [highlight, setHighlight] = useState(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const returnFocusRef = useRef(null);
  const onClose = () => setOpen(false);

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    const onRequest = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('command:open', onRequest);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('command:open', onRequest);
    };
  }, []);

  useEffect(() => {
    if (open) {
      returnFocusRef.current = document.activeElement;
      setQuery('');
      setCursor(0);
      setMounted(true);
      setPhase('enter');
      return undefined;
    }
    if (!mounted) return undefined;
    setPhase('leave');
    returnFocusRef.current?.focus?.({ preventScroll: true });
    const timer = window.setTimeout(() => setMounted(false), COMMAND_EXIT_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Once the dialog is in the DOM in its hidden 'enter' state, force the
  // browser to lay that state out, then switch to 'shown' on the next frame,
  // so the transition always has a painted starting point.
  const backdropRef = useRef(null);
  React.useLayoutEffect(() => {
    if (!open || !mounted || phase !== 'enter' || !backdropRef.current) return undefined;
    backdropRef.current.getBoundingClientRect();
    const frame = requestAnimationFrame(() => setPhase('shown'));
    return () => cancelAnimationFrame(frame);
  }, [open, mounted, phase]);

  // Focus once the dialog is actually in the DOM.
  useEffect(() => {
    if (open && mounted) inputRef.current?.focus();
  }, [open, mounted]);

  const needle = query.trim().toLowerCase();
  const matches = needle
    ? items.filter((item) =>
        `${item.label} ${item.sub || ''} ${item.group} ${item.keywords || ''}`.toLowerCase().includes(needle)
      )
    : items;
  const counts = matches.reduce((all, item) => ({ ...all, [item.group]: (all[item.group] || 0) + 1 }), {});

  // Measure the active row and glide the highlight to it.
  React.useLayoutEffect(() => {
    const row = listRef.current?.querySelector('[aria-selected="true"]');
    if (!row) {
      setHighlight(null);
      return;
    }
    setHighlight({ top: row.offsetTop, height: row.offsetHeight });
    row.scrollIntoView({ block: 'nearest' });
  }, [cursor, needle, mounted]);

  if (!mounted) return null;

  const run = (item) => {
    onClose();
    // Let the dialog close (and focus return) before the action scrolls or navigates.
    window.setTimeout(() => item.run(), COMMAND_EXIT_MS);
  };

  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      // Only this layer closes; the project overlay underneath stays open.
      event.preventDefault();
      event.stopPropagation();
      onClose();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setCursor((index) => (matches.length ? (index + 1) % matches.length : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setCursor((index) => (matches.length ? (index - 1 + matches.length) % matches.length : 0));
    } else if (event.key === 'Enter' && matches[cursor]) {
      event.preventDefault();
      run(matches[cursor]);
    } else if (event.key === 'Tab') {
      // The input is the only focusable element, so focus stays in the dialog.
      event.preventDefault();
    }
  };

  let lastGroup = null;
  return (
    <div
      ref={backdropRef}
      className={`command-backdrop is-${phase}`}
      onPointerDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div className="command-menu" role="dialog" aria-modal="true" aria-label={t.command.label} onKeyDown={onKeyDown}>
        <div className="command-field">
          <Search size={18} aria-hidden="true" />
          <input
            ref={inputRef}
            className="command-input"
            type="text"
            value={query}
            placeholder={t.command.placeholder}
            onChange={(event) => {
              setQuery(event.target.value);
              setCursor(0);
            }}
            role="combobox"
            aria-label={t.command.label}
            aria-expanded="true"
            aria-controls="command-list"
            aria-autocomplete="list"
            aria-activedescendant={matches[cursor] ? `command-${matches[cursor].id}` : undefined}
            spellCheck={false}
          />
          {query && (
            <button
              type="button"
              className="command-clear"
              aria-label={t.command.clear}
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
        {!needle && suggestions.length > 0 && (
          <p className="command-suggest">
            {suggestions.map((word) => (
              <button type="button" key={word} onClick={() => setQuery(word)}>
                {word}
              </button>
            ))}
          </p>
        )}
        <ul className="command-list" id="command-list" role="listbox" ref={listRef}>
          {highlight && (
            <li
              className="command-highlight"
              role="presentation"
              style={{ transform: `translateY(${highlight.top}px)`, height: highlight.height }}
            />
          )}
          {matches.length === 0 && (
            <li className="command-empty" role="option" aria-disabled="true" aria-selected="false">
              <SearchX size={18} aria-hidden="true" />
              {t.command.empty}
            </li>
          )}
          {matches.map((item, index) => {
            const heading = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            const Icon = item.icon;
            const active = index === cursor;
            return (
              <React.Fragment key={item.id}>
                {heading && (
                  <li className="command-group" role="presentation">
                    {heading}
                    <span>{counts[heading]}</span>
                  </li>
                )}
                <li
                  id={`command-${item.id}`}
                  role="option"
                  aria-selected={active}
                  className={active ? 'on' : ''}
                  onPointerMove={() => cursor !== index && setCursor(index)}
                  onClick={() => run(item)}
                >
                  <span className="command-icon">{Icon && <Icon size={15} aria-hidden="true" />}</span>
                  <span className="command-text">
                    <span className="command-title">{item.label}</span>
                    {item.sub && <span className="command-sub">{item.sub}</span>}
                  </span>
                  {active && <CornerDownLeft size={14} className="command-enter" aria-hidden="true" />}
                </li>
              </React.Fragment>
            );
          })}
        </ul>
        <p className="command-foot" aria-hidden="true">
          <span><kbd>↑</kbd><kbd>↓</kbd> {t.command.move}</span>
          <span><kbd>↵</kbd> {t.command.open}</span>
          <span><kbd>esc</kbd> {t.command.close}</span>
        </p>
      </div>
    </div>
  );
}

// Theme switch: a track with a sliding knob, the sun/moon morph riding in
// the knob. role="switch" so screen readers announce it as on/off.
function ThemeSwitch({ theme, onToggle, label }) {
  const light = theme === 'light';
  return (
    <button
      type="button"
      className={`theme-switch${light ? ' is-light' : ''}`}
      role="switch"
      aria-checked={light}
      aria-label={label}
      title={label}
      onClick={onToggle}
    >
      <span className="theme-switch-track" aria-hidden="true">
        <i className="theme-star" />
        <i className="theme-star" />
        <i className="theme-star" />
      </span>
      <span className="theme-switch-knob" aria-hidden="true">
        <SunMoonIcon />
      </span>
    </button>
  );
}

function SunMoonIcon() {
  return (
    <svg className="sun-moon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <mask id="sun-moon-mask">
        <rect width="24" height="24" fill="#fff" />
        <circle className="sun-moon-cut" cx="24" cy="10" r="6" fill="#000" />
      </mask>
      <circle className="sun-moon-core" cx="12" cy="12" r="5" fill="currentColor" mask="url(#sun-moon-mask)" />
      <g className="sun-moon-rays" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="12" y1="1.5" x2="12" y2="3.5" />
        <line x1="12" y1="20.5" x2="12" y2="22.5" />
        <line x1="1.5" y1="12" x2="3.5" y2="12" />
        <line x1="20.5" y1="12" x2="22.5" y2="12" />
        <line x1="4.6" y1="4.6" x2="6" y2="6" />
        <line x1="18" y1="18" x2="19.4" y2="19.4" />
        <line x1="4.6" y1="19.4" x2="6" y2="18" />
        <line x1="18" y1="6" x2="19.4" y2="4.6" />
      </g>
    </svg>
  );
}



function EmailLink({ label }) {
  return (
    <a href="mailto:mohamed.fuad.jp@gmail.com" className="contact-email">
      <Mail size={14} />
      {label}
    </a>
  );
}

function SectionTitle({ children }) {
  return (
    <h2 className="section-title">
      {children}
    </h2>
  );
}

// Spell UI's Signature, ported without motion or opentype.js: the glyph
// outlines are generated ahead of time (scripts/make-signature.mjs) and GSAP
// draws them. Each glyph gets a thin outline that traces in, and a thick stroke
// inside a mask that reveals the filled letter behind it, one glyph after the
// next. Markup is the finished state, so reduced motion shows it as is.
function Signature() {
  return (
    <div className="signature-wrap">
      <svg
        className="signature"
        viewBox={signatureViewBox}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Mohamed Fuad signature"
      >
        {/* Spell's mask stroke is 0.22 x font size, sized for a 16px label. At
            this size it left the wide M loop and F bar partly unrevealed. */}
        <defs>
          <mask id="sig-reveal" maskUnits="userSpaceOnUse">
            {signatureGlyphs.map((d, index) => (
              <path
                key={index}
                className="sig-reveal"
                d={d}
                stroke="#fff"
                strokeWidth={signatureFontSize * 0.45}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            ))}
          </mask>
        </defs>
        {signatureGlyphs.map((d, index) => (
          <path key={index} className="sig-outline" d={d} />
        ))}
        <g className="sig-fill" mask="url(#sig-reveal)">
          {signatureGlyphs.map((d, index) => (
            <path key={index} d={d} />
          ))}
        </g>
      </svg>
    </div>
  );
}

const waveHeights = [4, 7, 11, 16, 22, 28, 22, 16, 12, 34, 38, 34, 30, 18, 12, 8, 5];

function WaveDivider() {
  return (
    <div className="wave-divider" aria-hidden="true">
      <span className="wave-line" />
      <span className="wave-bars">
        {waveHeights.map((height, index) => (
          <i key={index} style={{ '--h': `${height}px` }} />
        ))}
      </span>
      <span className="wave-line" />
    </div>
  );
}

/**
 * The label is decorative *only while the image renders* — the technology name
 * is repeated as text right beside it. If the third-party CDN is blocked or the
 * icon 404s, `onError` drops the element entirely rather than leaving a broken
 * image glyph inline in a sentence.
 */
function Logo({ src, label }) {
  return (
    <img
      src={src}
      alt=""
      title={label}
      aria-hidden="true"
      loading="lazy"
      onError={(event) => {
        event.currentTarget.style.display = 'none';
      }}
    />
  );
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

function SkillPill({ skill, copy }) {
  const Icon = skill.Icon;
  return (
    <li className="skill" aria-hidden={copy || undefined}>
      <span className="skill-mark">
        <Icon style={{ color: skill.color }} aria-hidden="true" />
      </span>
      <span>{skill.label}</span>
    </li>
  );
}

// Contribution data has three tiers, newest wins:
//   1. a synthetic placeholder so the grid never renders empty,
//   2. public/media/data/contributions.json — refreshed every 6 hours by the
//      "Update contributions" GitHub Action, so a fresh page load is accurate
//      even when the third-party API is slow or down,
//   3. the live API, which catches anything committed since the last run.
// See ADR-033.
// 52 whole weeks, so the grid actually covers the "last 12 months" its caption
// claims and each column is one week — which is what lets the month labels line
// up with the days underneath them (ADR-042).
const CONTRIBUTION_WEEKS = 52;
const CONTRIBUTION_DAYS = CONTRIBUTION_WEEKS * 7;

const sumCounts = (cells) => cells.reduce((total, day) => total + (Number(day.count) || 0), 0);

function useContributionData() {
  const fallbackCells = useMemo(() => {
    const today = new Date();
    return Array.from({ length: CONTRIBUTION_DAYS }, (_, index) => {
      const wave = Math.sin(index * 0.43) + Math.cos(index * 0.17);
      const highlighted = index > 88 && index < 118 ? 2 : 0;
      const level = Math.max(0, Math.min(4, Math.round(wave + highlighted + (index % 13 === 0 ? 2 : 0))));
      const count = level === 0 ? 0 : level * 2 + (index % 3);
      const cellDate = new Date(today);
      cellDate.setDate(cellDate.getDate() - (CONTRIBUTION_DAYS - 1 - index));
      return { date: cellDate.toISOString().slice(0, 10), count, level };
    });
  }, []);
  // Derived from the placeholder itself rather than a hardcoded number, which
  // went stale the moment the real total moved past it.
  const [data, setData] = useState(() => ({
    cells: fallbackCells,
    total: sumCounts(fallbackCells),
    activity: {},
    repos: {},
  }));

  useEffect(() => {
    let cancelled = false;

    // Drop any day the source sent without a usable date: everything
    // downstream (the tooltip formatter, the month labels) parses it, and one
    // malformed entry would otherwise throw during render.
    //
    const normalise = (days) =>
      days
        .filter((day) => typeof day?.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day.date))
        .slice(-CONTRIBUTION_DAYS)
        .map((day) => ({
          date: day.date,
          count: Number(day.count) || 0,
          level: Number(day.level) || 0,
        }));

    const loadSnapshot = fetch('/media/data/contributions.json', { cache: 'no-cache' })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('no snapshot'))))
      .then((payload) => {
        if (cancelled || !Array.isArray(payload.cells)) return;
        const cells = normalise(payload.cells);
        if (!cells.length) return;
        // Only the snapshot knows which repositories each day went to; the
        // live read below refreshes the counts and keeps this breakdown.
        const activity = payload.activity && typeof payload.activity === 'object' ? payload.activity : {};
        const repos = payload.repos && typeof payload.repos === 'object' ? payload.repos : {};
        setData({ cells, total: sumCounts(cells), activity, repos });
      })
      .catch(() => {});

    // Always follow the snapshot with a live read so same-day pushes show up.
    loadSnapshot.then(() =>
      fetch('https://github-contributions-api.jogruber.de/v4/MohamedFuad16?y=last')
        .then((response) => (response.ok ? response.json() : Promise.reject(new Error('GitHub calendar unavailable'))))
        .then((payload) => {
          if (cancelled || !Array.isArray(payload.contributions)) return;
          const today = new Date().toISOString().slice(0, 10);
          const cells = normalise(payload.contributions.filter((day) => day.date <= today));
          if (!cells.length) return;
          // Always the sum of the days actually on screen, never the source's
          // own year total. The API computes `total.lastYear` over its whole
          // returned range, which is not the range the grid draws: measured
          // across a fortnight of dates, the caption disagreed with the grid on
          // 13 days out of 14. The snapshot's own total is already the sum of
          // its cells, so this changes nothing there.
          setData((current) => ({ ...current, cells, total: sumCounts(cells) }));
        })
        .catch(() => {})
    );

    return () => {
      cancelled = true;
    };
  }, []);

  return data;
}

function formatCellDate(dateStr, locale, { weekday = false } = {}) {
  // Belt and braces: `normalise` already drops undated entries, but this runs
  // once per cell during render, so a bad value here would take the page down.
  if (typeof dateStr !== 'string') return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!Number.isFinite(year)) return dateStr;
  const date = new Date(year, (month || 1) - 1, day || 1);
  return new Intl.DateTimeFormat(locale === 'ja' ? 'ja-JP' : 'en-US', {
    ...(weekday ? { weekday: 'short' } : {}),
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

// GitHub repository names that differ from the project titles on this page.
const REPO_TITLES = {
  'resume-studio-dashboard': 'Internship Portal',
  'ledger-financial-report-system': 'Ledger',
  'portfolio-mine': 'This portfolio',
  'Codex-Acc-Switcher': 'Codex Account Switcher',
};
const repoLabel = (name) => REPO_TITLES[name] || name;

// Streaks and peaks are computed from the cells actually drawn, so every
// figure above the grid can be checked against the squares below it.
function summariseContributions(cells) {
  let longest = 0;
  let run = 0;
  let best = null;
  let active = 0;
  cells.forEach((day) => {
    if (day.count > 0) {
      active += 1;
      run += 1;
      longest = Math.max(longest, run);
      if (!best || day.count > best.count) best = day;
    } else {
      run = 0;
    }
  });
  // Today usually has no pushes yet when someone visits, so a zero on the
  // last day does not break the current streak; it starts from yesterday.
  let current = 0;
  let index = cells.length - 1;
  if (index >= 0 && cells[index].count === 0) index -= 1;
  for (; index >= 0 && cells[index].count > 0; index -= 1) current += 1;
  return { longest, current, best, active };
}

function ContributionGrid({ t, locale }) {
  const { cells, total, activity } = useContributionData();
  const [activeIndex, setActiveIndex] = useState(null);
  const [focusMonth, setFocusMonth] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const gridRef = useRef(null);
  const viewportRef = useRef(null);

  // `cells` swaps from synthetic fallback data to the real snapshot/API data
  // after mount. Cells share `key={day.date}`, and recent dates commonly
  // coincide between the two data sets, so React reuses those DOM nodes
  // instead of remounting them — which means the cell-reveal ScrollTrigger's
  // cached trigger position (measured against the fallback layout) never
  // updates, and the tween it queued can be left stuck at its opacity:0
  // "from" state forever if that position no longer lines up. Refresh once
  // the real data lands so ScrollTrigger re-measures the final layout.
  useEffect(() => {
    ScrollTrigger.refresh();
  }, [cells, total]);

  // On phones the calendar scrolls sideways; open it on the recent end, which
  // is the part anyone looking at it wants to see.
  useEffect(() => {
    const viewport = viewportRef.current;
    if (viewport) viewport.scrollLeft = viewport.scrollWidth;
  }, [cells]);

  // The tooltip is fixed to the viewport, and ScrollSmoother keeps emitting
  // scroll events while it eases to rest, so re-anchor it to the active cell
  // on every scroll rather than hiding it (which made it vanish mid-hover).
  useEffect(() => {
    if (activeIndex == null) return undefined;
    let frame = 0;
    const follow = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = gridRef.current?.children[activeIndex]?.getBoundingClientRect();
        if (rect) setTooltip((tip) => tip && { ...tip, x: rect.left + rect.width / 2, y: rect.top });
      });
    };
    window.addEventListener('scroll', follow, { passive: true });
    window.addEventListener('resize', follow);
    const viewport = viewportRef.current;
    viewport?.addEventListener('scroll', follow, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', follow);
      window.removeEventListener('resize', follow);
      viewport?.removeEventListener('scroll', follow);
    };
  }, [activeIndex]);

  // The grid flows column-first with seven rows, so cell N lives in week
  // `floor(N / 7)`. Anchoring each month label to the column its first day
  // falls in — and spanning it to the next month — is what makes the header
  // describe the days underneath it. Previously nine labels were spread evenly
  // over a row-major grid, where a column meant nothing at all (ADR-042).
  // A column is only a real week if the first cell sits in the row for its own
  // weekday. The window ends on whatever day it is today, so its first day is a
  // Sunday one time in seven — the snapshot pulled on 2026-08-02 starts on a
  // Monday. Rather than trimming to the next Sunday (which would throw away up
  // to six days of history and quietly shrink the total), offset the first cell
  // into its weekday row and let column one be partial, which is what GitHub
  // does. Everything downstream counts from `leadIn` instead of from zero.
  const leadIn = cells.length ? new Date(`${cells[0].date}T00:00:00Z`).getUTCDay() : 0;
  const weekCount = Math.max(1, Math.ceil((leadIn + cells.length) / 7));
  const monthLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale === 'ja' ? 'ja-JP' : 'en-US', {
      month: 'short',
    });
    const marks = [];
    let previousMonth = '';
    cells.forEach((day, index) => {
      const [year, month] = day.date.split('-').map(Number);
      const key = `${year}-${month}`;
      if (key === previousMonth) return;
      previousMonth = key;
      marks.push({
        key,
        column: Math.floor((index + leadIn) / 7) + 1,
        label: formatter.format(new Date(year, (month || 1) - 1, 1)),
      });
    });
    return marks
      .map((mark, index) => ({
        ...mark,
        span: (marks[index + 1]?.column ?? weekCount + 1) - mark.column,
      }))
      // A month showing only a column or two has no room for its name and
      // would sit on top of the next one. GitHub drops those too.
      .filter((mark) => mark.span >= 3);
  }, [cells, locale, weekCount, leadIn]);

  const stats = useMemo(() => summariseContributions(cells), [cells]);

  const monthTotal = useMemo(() => {
    if (!focusMonth) return null;
    const days = cells.filter((day) => day.date.startsWith(focusMonth));
    const [year, month] = focusMonth.split('-').map(Number);
    const label = new Intl.DateTimeFormat(locale === 'ja' ? 'ja-JP' : 'en-US', {
      month: 'long',
      year: 'numeric',
    }).format(new Date(year, month - 1, 1));
    return { label, count: sumCounts(days), active: days.filter((day) => day.count > 0).length };
  }, [cells, focusMonth, locale]);

  // Sunday-first to match the grid's rows; only Mon/Wed/Fri get a label so
  // the column stays as quiet as GitHub's.
  const weekdayLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale === 'ja' ? 'ja-JP' : 'en-US', { weekday: 'short' });
    return Array.from({ length: 7 }, (_, row) =>
      row % 2 === 1 ? formatter.format(new Date(Date.UTC(2023, 0, 1 + row, 12))) : ''
    );
  }, [locale]);

  const showDay = (index) => {
    const cell = gridRef.current?.children[index];
    const day = cells[index];
    if (!cell || !day) return;
    const rect = cell.getBoundingClientRect();
    setActiveIndex(index);
    setTooltip({
      x: rect.left + rect.width / 2,
      y: rect.top,
      count: day.count,
      date: formatCellDate(day.date, locale, { weekday: true }),
      repos: (activity[day.date] || []).slice(0, 3),
      // Whatever the listed repositories do not account for: private repos,
      // anything past the first three, or work newer than the snapshot.
      other: Math.max(0, day.count - (activity[day.date] || []).slice(0, 3).reduce((sum, [, n]) => sum + n, 0)),
    });
  };

  const clearDay = () => {
    setActiveIndex(null);
    setTooltip(null);
  };

  const handlePointer = (event) => {
    const index = Number(event.target?.dataset?.index);
    if (Number.isInteger(index)) {
      if (index !== activeIndex) showDay(index);
    } else if (event.type === 'pointerdown') {
      clearDay();
    }
  };

  // Up/down step one day, left/right one week, matching how the grid reads.
  const handleKey = (event) => {
    const steps = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -7, ArrowRight: 7 };
    if (event.key === 'Escape') {
      clearDay();
      return;
    }
    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      showDay(event.key === 'Home' ? 0 : cells.length - 1);
      return;
    }
    if (!(event.key in steps)) return;
    event.preventDefault();
    const from = activeIndex ?? cells.length - 1;
    showDay(Math.min(cells.length - 1, Math.max(0, from + steps[event.key])));
  };

  const activeDay = activeIndex != null ? cells[activeIndex] : null;
  const figures = [
    { key: 'total', label: t.contributionStats.total, value: total, note: t.contributionStats.window },
    {
      key: 'active',
      label: t.contributionStats.active,
      value: stats.active,
      note: t.contributionStats.activeOf(cells.length),
    },
    {
      key: 'streak',
      label: t.contributionStats.longest,
      value: t.contributionStats.days(stats.longest),
      note: t.contributionStats.current(stats.current),
    },
    {
      key: 'best',
      label: t.contributionStats.best,
      value: stats.best ? stats.best.count : 0,
      note: stats.best ? formatCellDate(stats.best.date, locale) : '',
    },
  ];

  return (
    <section className="dashed contribution" aria-label={t.a11y.contributionGrid}>
      <dl className="contribution-stats">
        {figures.map((figure) => (
          <div key={figure.key} className="contribution-stat">
            <dt>{figure.label}</dt>
            <dd>
              {/* Rolls from the placeholder figures to the real ones once the
                  snapshot lands; only the digits that change move. */}
              <strong>
                <Scritto value={String(figure.value)} transition={{ duration: 700 }} />
              </strong>
              <span>{figure.note}</span>
            </dd>
          </div>
        ))}
      </dl>
      <div className="calendar-viewport" ref={viewportRef}>
        <div className="calendar-scroll" style={{ '--grid-columns': weekCount }}>
          <span aria-hidden="true" />
          <div className="months">
            {monthLabels.map((mark) => {
              const monthKey = `${mark.key.split('-')[0]}-${mark.key.split('-')[1].padStart(2, '0')}`;
              return (
                <button
                  type="button"
                  key={mark.key}
                  className={focusMonth === monthKey ? 'is-active' : ''}
                  style={{ gridColumn: `${mark.column} / span ${mark.span}` }}
                  aria-pressed={focusMonth === monthKey}
                  onPointerEnter={() => setFocusMonth(monthKey)}
                  onPointerLeave={() => setFocusMonth(null)}
                  onFocus={() => setFocusMonth(monthKey)}
                  onBlur={() => setFocusMonth(null)}
                >
                  {mark.label}
                </button>
              );
            })}
          </div>
          <div className="weekdays" aria-hidden="true">
            {weekdayLabels.map((label, row) => (
              <span key={row}>{label}</span>
            ))}
          </div>
          <div
            ref={gridRef}
            className={`grid${focusMonth ? ' is-filtering' : ''}`}
            role="application"
            tabIndex={0}
            aria-label={t.contributionStats.gridHint}
            aria-describedby="contribution-live"
            onPointerMove={handlePointer}
            onPointerDown={handlePointer}
            onPointerLeave={(event) => event.pointerType === 'mouse' && clearDay()}
            onKeyDown={handleKey}
            onBlur={clearDay}
          >
            {cells.map((day, index) => (
              <span
                key={day.date || index}
                data-index={index}
                className={[
                  'cell',
                  `level-${day.level}`,
                  index === activeIndex ? 'is-active' : '',
                  focusMonth && day.date.startsWith(focusMonth) ? 'in-month' : '',
                ].join(' ')}
                // Only the first cell is placed explicitly; the rest auto-flow
                // down its column and on into the next, so every column below
                // lines up on the same weekday.
                style={index === 0 && leadIn ? { gridRowStart: leadIn + 1 } : undefined}
              />
            ))}
          </div>
        </div>
      </div>
      <div className="contribution-foot">
        <span className="contribution-caption" aria-live="polite" id="contribution-live">
          {activeDay
            ? t.dayTooltip(activeDay.count, formatCellDate(activeDay.date, locale))
            : monthTotal
              ? t.contributionStats.month(monthTotal.label, monthTotal.count, monthTotal.active)
              : t.contribution(total)}
        </span>
        <span className="legend" aria-hidden="true">
          {t.less}
          {[0, 1, 2, 3, 4].map((level) => (
            <i key={level} className={`cell level-${level}`} />
          ))}
          {t.more}
        </span>
      </div>
      {tooltip &&
        createPortal(
          <div
            className="contribution-tooltip"
            role="presentation"
            style={{
              // Clamped so the first and last weeks never push it off-screen.
              left: Math.min(window.innerWidth - 96, Math.max(96, tooltip.x)),
              top: tooltip.y,
              '--arrow-shift': `${tooltip.x - Math.min(window.innerWidth - 96, Math.max(96, tooltip.x))}px`,
            }}
          >
            <strong>{t.contributionStats.count(tooltip.count)}</strong>
            <span>{tooltip.date}</span>
            {tooltip.repos.length > 0 && (
              <ul className="contribution-tooltip-repos">
                {tooltip.repos.map(([name, count]) => (
                  <li key={name}>
                    <b>{repoLabel(name)}</b>
                    <i>{count}</i>
                  </li>
                ))}
                {tooltip.other > 0 && (
                  <li>
                    <b>{t.contributionStats.other}</b>
                    <i>{tooltip.other}</i>
                  </li>
                )}
              </ul>
            )}
          </div>,
          document.body
        )}
    </section>
  );
}

// Months between two "YYYY-MM" stamps, counting both ends, so Feb to Apr is
// three months. `end: null` means the job is current.
const monthIndex = (stamp) => {
  const [year, month] = stamp.split('-').map(Number);
  return year * 12 + month - 1;
};
const currentMonth = () => {
  const now = new Date();
  return now.getFullYear() * 12 + now.getMonth();
};
function tenure(item) {
  return (item.end ? monthIndex(item.end) : currentMonth()) - monthIndex(item.start) + 1;
}
// The span every bar is drawn against: first start to today.
const EXPERIENCE_RANGE = (() => {
  const first = Math.min(...experience.map((item) => monthIndex(item.start)));
  return { first, length: currentMonth() - first + 1 };
})();

function ExperienceItem({ item, locale, t }) {
  const [open, setOpen] = useState(false);
  const Icon = item.icon;
  const role = locale === 'ja' ? item.roleJa : item.role;
  const status = locale === 'ja' ? item.statusJa : item.status;
  const date = locale === 'ja' ? item.dateJa : item.date;
  const details = locale === 'ja' ? item.detailsJa : item.details;
  const company = locale === 'ja' && item.companyJa ? item.companyJa : item.company;
  const months = tenure(item);
  const barStart = ((monthIndex(item.start) - EXPERIENCE_RANGE.first) / EXPERIENCE_RANGE.length) * 100;
  const barWidth = (months / EXPERIENCE_RANGE.length) * 100;
  const result = locale === 'ja' ? item.resultJa : item.result;
  return (
    <article className={`experience-item ${open ? 'open' : ''}`}>
      <div className="experience-summary">
        {/* Lives inside the summary so it centres on the row at any height —
            the summary is the positioned ancestor (ADR-032). */}
        <span className={`dot ${item.tone}`} aria-hidden="true">
          {item.tone !== 'green' && <Check size={7.5} strokeWidth={3} />}
        </span>
        <span className="company-icon">
          {item.logo ? (
            <>
              <img
                src={item.logo}
                alt=""
                loading="lazy"
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
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              <span className="company-name">{company}</span>
              <ExternalLink size={13} />
            </a>
            <small className={item.tone}>
              <span>•</span>
              {status}
            </small>
          </h3>
          <p>{role}</p>
          {result && <p className="experience-result">{result}</p>}
          {/* Where this job sits between the first start date and today. */}
          <span className={`experience-span ${item.tone}`} aria-hidden="true">
            <i style={{ left: `${barStart}%`, width: `${barWidth}%` }} />
          </span>
        </div>
        <time>
          {date}
          <small>{t.tenure(months)}</small>
        </time>
        <button
          className="chevron"
          type="button"
          aria-expanded={open}
          aria-label={t.a11y.toggleDetails(company)}
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

/** Badge text for the active locale. Every project defines both, so a Japanese
 *  visitor no longer sees "live app" / "in progress" on an otherwise translated
 *  page; `badge` is the fallback if one is ever added without a translation. */
function badgeLabel(project, locale) {
  return locale === 'ja' && project.badgeJa ? project.badgeJa : project.badge;
}

function ProjectCard({ project, t, locale, onOpen }) {
  const Icon = project.icon;
  const image = locale === 'ja' && project.imageJa ? project.imageJa : project.image;
  const open = (event) => onOpen(project.slug, event.currentTarget);
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  // The loop only runs while a mouse is over the preview (or it has keyboard
  // focus). Touch devices and reduced-motion visitors keep the still image,
  // and `preload="none"` means nobody downloads a clip they never hover.
  const play = (event) => {
    const video = videoRef.current;
    if (!video || (event.pointerType && event.pointerType !== 'mouse')) return;
    // Focus plays only for keyboard focus, not when focus is handed back to
    // the card after the overlay closes or a touch tap focuses it.
    if (event.type === 'focus' && !event.currentTarget.matches(':focus-visible')) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    video.play().then(() => setPlaying(true)).catch(() => {});
  };
  const stop = () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    setPlaying(false);
  };
  return (
    <article className={`project project-${project.slug} dashed`}>
      <button
        type="button"
        className={`project-shot${playing ? ' is-playing' : ''}`}
        onClick={open}
        onPointerEnter={play}
        onPointerLeave={stop}
        onFocus={play}
        onBlur={stop}
        aria-label={`${project.title}: ${t.viewDetails}`}
      >
        <img src={image} alt={t.a11y.preview(project.title)} loading="lazy" decoding="async" />
        {project.video && (
          <video
            ref={videoRef}
            className="project-video"
            src={project.video}
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
            tabIndex={-1}
          />
        )}
        <span className="project-badge">{badgeLabel(project, locale)}</span>
        <span className="project-shot-hint">
          {t.viewDetails}
          <ArrowUpRight size={14} />
        </span>
      </button>
      <div className="project-body">
        <div className="project-heading">
          <h3>
            <span className="project-title">{project.title}</span>
            <Icon size={17} />
          </h3>
          <div className="project-actions">
            {project.live && (
              <a href={project.live} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={14} />
                {t.live}
              </a>
            )}
            {/* A private repo has no link worth offering — the URL 404s for
                everyone but the owner. Say so instead of dangling a dead link. */}
            {project.github ? (
              <a href={project.github} target="_blank" rel="noopener noreferrer">
                <BrandIcon name="github" />
                GitHub
              </a>
            ) : (
              <span className="repo-private">
                <Lock size={13} />
                {t.privateRepo}
              </span>
            )}
          </div>
        </div>
        <p>{locale === 'ja' ? project.descriptionJa : project.description}</p>
      </div>
      <div className="project-tech">
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

// Horizontal bars, one measure per chart, each chart on its own zero-based
// axis. Our row carries the accent; the baselines stay neutral so the
// comparison reads without a legend. Values are labelled directly.
function BenchmarkBars({ benchmark, locale }) {
  const pick = (value) => (locale === 'ja' ? value.ja : value.en);
  return (
    <div className="pd-bench">
      {benchmark.charts.map((chart) => {
        const max = Math.max(...chart.rows.map((row) => row.value));
        return (
          <figure className="pd-bench-chart" key={chart.title.en}>
            <figcaption>{pick(chart.title)}</figcaption>
            <table className="sr-only">
              <tbody>
                {chart.rows.map((row) => (
                  <tr key={row.label.en}>
                    <th scope="row">{pick(row.label)}</th>
                    <td>
                      {row.value.toFixed(chart.digits)}
                      {chart.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul aria-hidden="true">
              {chart.rows.map((row) => {
                const value = `${row.value.toFixed(chart.digits)}${chart.unit}`;
                return (
                  <li key={row.label.en} className={row.ours ? 'is-ours' : ''} title={`${pick(row.label)}: ${value}`}>
                    <span className="pd-bench-label">{pick(row.label)}</span>
                    <span className="pd-bench-track">
                      <i style={{ '--w': `${(row.value / max) * 100}%` }} />
                    </span>
                    <span className="pd-bench-value">{value}</span>
                  </li>
                );
              })}
            </ul>
          </figure>
        );
      })}
      <p className="pd-bench-caption">{pick(benchmark.caption)}</p>
    </div>
  );
}

function ProjectArchitecture({ steps, locale, tones }) {
  const pick = (value) => (locale === 'ja' ? value.ja : value.en);
  return (
    <ol className="pd-map" style={{ '--map-columns': steps.length }}>
      {steps.map((step, index) => (
        <li className="pd-map-step" key={step.label.en} style={toneStyle(tones, index)}>
          <span className="pd-map-number">{String(index + 1).padStart(2, '0')}</span>
          <strong>{pick(step.label)}</strong>
          <small>{pick(step.detail)}</small>
        </li>
      ))}
    </ol>
  );
}

/**
 * A real system flow chart, drawn as SVG so boxes and arrows always line up at
 * any width (ADR-035). Data drives it: `stages` run down a centre lane, and a
 * stage may carry a `branch` that hangs off to the right — the shape a genuine
 * flow chart needs. Shapes follow flow-chart convention: rounded terminators
 * for the start/end, rectangles for processes, a diamond for a decision, and a
 * cylinder for storage.
 */
// Lane geometry, in SVG user units. Two tunings: `wide` for desktop and
// `compact` for phones, where the viewBox is close to the rendered width so the
// type stays legible instead of being scaled down to nothing (ADR-035).
// The branch gap is sized to fit an edge label above the connecting arrow.
const FLOW_WIDE = {
  width: 620,
  laneX: 40,
  boxW: 250,
  boxH: 58,
  gapY: 56, // vertical arrow length between stages
  branchGap: 76,
  branchW: 214,
  branchH: 48,
  titleSize: 13.5,
  subSize: 10.5,
  edgeSize: 10,
  padY: 14,
};

const FLOW_COMPACT = {
  width: 344,
  laneX: 6,
  boxW: 194,
  boxH: 60,
  gapY: 46,
  branchGap: 24,
  branchW: 116,
  branchH: 44,
  titleSize: 11,
  subSize: 8.2,
  edgeSize: 8.2,
  padY: 14,
  // The side arrow is too short here to carry a label, so branch labels sit
  // above their box instead of across the arrow.
  branchLabelAbove: true,
};

// Each stage role takes one of the project's own accents, so the chart is
// in the same colours as the rest of its page. Shapes still carry the role
// (pill, box, diamond, cylinder) when a palette has only close hues.
const FLOW_ROLE_TONE = { terminal: 0, process: 1, decision: 2, store: 0 };

function FlowBox({ x, y, w, h, kind, title, sub, geo, tones }) {
  const cx = x + w / 2;
  const gap = geo.subSize + 3;
  const { bg, ink } = tones[(FLOW_ROLE_TONE[kind] ?? 1) % tones.length];
  const tone = { '--fc-tone': bg, '--fc-ink': ink };
  const mid = y + h / 2;
  // A rectangle is the same width at every height, so a two-line label can sit
  // slightly low inside it. A diamond cannot: it is only full width at its
  // vertical midline and tapers to a point above and below, so a subtitle
  // placed a whole `gap` below the midline lands where the shape has already
  // narrowed. AI Brain's "Did it pass?" subtitle overhung the outline by 9.6
  // units per side in Japanese at the wide geometry for exactly this reason.
  // Straddling the midline puts both lines in the widest band (ADR-050).
  const straddle = kind === 'decision' && Boolean(sub);
  const lineOffset = gap / 2 + 1.5;
  const titleY = straddle ? mid - lineOffset : sub ? mid - gap / 2 + 1 : mid + 1;
  const subY = straddle ? mid + lineOffset : mid + gap;
  const label = (
    <>
      <text x={cx} y={titleY} className="fc-title" style={{ fontSize: geo.titleSize }}>
        {title}
      </text>
      {sub && (
        <text x={cx} y={subY} className="fc-sub" style={{ fontSize: geo.subSize }}>
          {sub}
        </text>
      )}
    </>
  );

  if (kind === 'decision') {
    const mx = x + w / 2;
    const my = y + h / 2;
    return (
      <g style={tone}>
        <path
          className="fc-shape"
          d={`M ${mx} ${y - 8} L ${x + w} ${my} L ${mx} ${y + h + 8} L ${x} ${my} Z`}
        />
        {label}
      </g>
    );
  }

  if (kind === 'store') {
    const ry = 7;
    return (
      <g style={tone}>
        <path
          className="fc-shape"
          d={`M ${x} ${y + ry} a ${w / 2} ${ry} 0 0 1 ${w} 0 v ${h - ry * 2} a ${w / 2} ${ry} 0 0 1 ${-w} 0 Z`}
        />
        <path className="fc-store-lip" d={`M ${x} ${y + ry} a ${w / 2} ${ry} 0 0 0 ${w} 0`} />
        {label}
      </g>
    );
  }

  return (
    <g style={tone}>
      <rect
        className="fc-shape"
        x={x}
        y={y}
        width={w}
        height={h}
        rx={kind === 'terminal' ? h / 2 : Math.min(18, h / 2.6)}
      />
      {label}
    </g>
  );
}

function FlowArrow({ from, to, label, variant = 'down', geo }) {
  const path =
    variant === 'down'
      ? `M ${from.x} ${from.y} L ${to.x} ${to.y}`
      : `M ${from.x} ${from.y} H ${to.x}`;
  return (
    <g>
      <path className="fc-edge" d={path} markerEnd="url(#fc-arrow)" />
      {label && (
        <text
          className="fc-edge-label"
          style={{ fontSize: geo.edgeSize }}
          x={variant === 'down' ? from.x + 10 : (from.x + to.x) / 2}
          y={variant === 'down' ? (from.y + to.y) / 2 + geo.edgeSize / 3 : from.y - 9}
          textAnchor={variant === 'down' ? 'start' : 'middle'}
        >
          {label}
        </text>
      )}
    </g>
  );
}

/** Live flag for the compact (phone) flow-chart tuning. */
function useCompactFlow() {
  const [compact, setCompact] = useState(
    () => window.matchMedia('(max-width: 640px)').matches
  );
  useEffect(() => {
    const query = window.matchMedia('(max-width: 640px)');
    const onChange = (event) => setCompact(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return compact;
}

function ProjectFlowChart({ stages, locale, label, tones }) {
  const pick = (value) => (value ? (locale === 'ja' ? value.ja : value.en) : null);
  const geo = useCompactFlow() ? FLOW_COMPACT : FLOW_WIDE;
  const { width, laneX, boxW, boxH, gapY, branchGap, branchW, branchH, padY } = geo;
  const branchX = laneX + boxW + branchGap;
  const rowH = boxH + gapY;
  const height = stages.length * boxH + (stages.length - 1) * gapY + padY * 2;
  const laneMid = laneX + boxW / 2;

  return (
    <div className="pd-flow">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="pd-flow-svg"
        role="img"
        aria-label={label}
        preserveAspectRatio="xMidYMin meet"
      >
        <defs>
          <marker
            id="fc-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" className="fc-arrowhead" />
          </marker>
          {/* There used to be an `#fc-sketch` turbulence/displacement filter
              here, meant to give every stroke a hand-drawn wobble (ADR-039,
              ADR-041). Measured at 3.2x magnification it was invisible: with
              `baseFrequency 0.02` the noise varies over ~50-unit periods and
              `scale 2.4` displaces by at most ~1 unit, so filtered and
              unfiltered renders came out pixel-identical (max channel delta 0).
              Raising the scale to 18 proved the chain worked — it was simply
              too subtle to see. So the chart was machine-perfect geometry
              wearing a handwriting font, which is what read as "not clean":
              the two halves disagreed. It now commits to a precise diagram,
              and stops allocating 13 chart-sized filter buffers per render for
              no visible effect (ADR-044). */}
        </defs>

        {stages.map((stage, index) => {
          const y = padY + index * rowH;
          const next = stages[index + 1];
          const branch = stage.branch;
          // A diamond's tip sits 8 units past the box, so the arrow starts there.
          const tip = stage.kind === 'decision' ? 8 : 0;
          return (
            <g key={stage.title.en}>
              {next && (
                <FlowArrow
                  geo={geo}
                  from={{ x: laneMid, y: y + boxH + tip }}
                  to={{ x: laneMid, y: y + rowH - 3 }}
                  label={pick(stage.edge)}
                />
              )}
              {branch && (
                <>
                  <FlowArrow
                    geo={geo}
                    from={{ x: laneX + boxW + 3, y: y + boxH / 2 }}
                    to={{ x: branchX - 3, y: y + boxH / 2 }}
                    label={geo.branchLabelAbove ? null : pick(branch.edge)}
                    variant="right"
                  />
                  {geo.branchLabelAbove && branch.edge && (
                    <text
                      className="fc-edge-label"
                      style={{ fontSize: geo.edgeSize }}
                      x={branchX + branchW / 2}
                      y={y + (boxH - branchH) / 2 - 6}
                      textAnchor="middle"
                    >
                      {pick(branch.edge)}
                    </text>
                  )}
                  <FlowBox
                    geo={geo}
                    tones={tones}
                    x={branchX}
                    y={y + (boxH - branchH) / 2}
                    w={branchW}
                    h={branchH}
                    kind={branch.kind || 'process'}
                    title={pick(branch.title)}
                  />
                </>
              )}
              <FlowBox
                geo={geo}
                tones={tones}
                x={laneX}
                y={y}
                w={boxW}
                h={boxH}
                kind={stage.kind || 'process'}
                title={pick(stage.title)}
                sub={pick(stage.sub)}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// Screenshot carousel for the detail page: slides crossfade with a slow
// zoom, auto-advance every 4.2s (paused on hover, focus, or reduced motion),
// and answer to arrows, dots, keys and swipes. Only the first slide loads
// eagerly.
const GALLERY_MS = 4200;

function ProjectGallery({ slides, locale, title, reducedMotion, t }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const startX = useRef(null);
  const count = slides.length;
  const go = (step) => setIndex((current) => (current + step + count) % count);

  useEffect(() => {
    if (reducedMotion || paused || count < 2) return undefined;
    const timer = window.setTimeout(() => go(1), GALLERY_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, paused, reducedMotion, count]);

  const pick = (value) => (locale === 'ja' ? value.ja : value.en);
  return (
    <div
      className={`pd-gallery${paused ? ' is-paused' : ''}`}
      role="region"
      aria-roledescription="carousel"
      aria-label={t.gallery(title)}
      onPointerEnter={(event) => event.pointerType === 'mouse' && setPaused(true)}
      onPointerLeave={(event) => event.pointerType === 'mouse' && setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(event) => {
        if (event.key === 'ArrowRight') go(1);
        if (event.key === 'ArrowLeft') go(-1);
      }}
    >
      <div
        className="pd-gallery-frame"
        onPointerDown={(event) => {
          startX.current = event.clientX;
        }}
        onPointerUp={(event) => {
          if (startX.current === null) return;
          const dx = event.clientX - startX.current;
          startX.current = null;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
        }}
      >
        {slides.map((slide, i) => (
          <figure key={slide.src} className={i === index ? 'is-active' : ''} aria-hidden={i !== index}>
            <img
              src={slide.src}
              alt={pick(slide.caption)}
              loading={i === 0 ? 'eager' : 'lazy'}
              decoding="async"
              draggable="false"
            />
          </figure>
        ))}
        {count > 1 && (
          <>
            <button type="button" className="pd-gallery-nav is-prev" onClick={() => go(-1)} aria-label={t.galleryPrev}>
              <ChevronLeft size={18} />
            </button>
            <button type="button" className="pd-gallery-nav is-next" onClick={() => go(1)} aria-label={t.galleryNext}>
              <ChevronRight size={18} />
            </button>
          </>
        )}
      </div>
      <div className="pd-gallery-foot">
        <p className="pd-gallery-caption" aria-live="polite">
          <span>
            {String(index + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
          </span>
          {pick(slides[index].caption)}
        </p>
        {count > 1 && (
          <div className="pd-gallery-dots">
            {slides.map((slide, i) => (
              <button
                type="button"
                key={slide.src}
                className={i === index ? 'is-active' : ''}
                aria-label={t.galleryGoTo(i + 1)}
                aria-current={i === index}
                onClick={() => setIndex(i)}
              >
                <i style={{ animationDuration: `${GALLERY_MS}ms` }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// The detail page's lower half is coloured with the project's own accents.
// Each accent carries the ink (near-black or white) with the higher WCAG
// contrast on it, so a pale yellow and a deep blue both hold readable text.
function relativeLuminance(hex) {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

const TONE_DARK_INK = '#16130f';

function projectTones(project) {
  const accents = project.accents || DEFAULT_PALETTE.slice(1);
  return accents.map((bg) => {
    const l = relativeLuminance(bg);
    const onDark = (l + 0.05) / (relativeLuminance(TONE_DARK_INK) + 0.05);
    const onWhite = 1.05 / (l + 0.05);
    return { bg, ink: onDark >= onWhite ? TONE_DARK_INK : '#ffffff' };
  });
}

/** CSS custom properties for the i-th tone, cycling through the accents. */
function toneStyle(tones, i) {
  const tone = tones[i % tones.length];
  return { '--tone': tone.bg, '--tone-ink': tone.ink };
}

// Figures as solid colour tiles: one big number and one short label each.
// Values roll in with Scritto once the page has settled.
function FigureTiles({ figures, locale, reducedMotion, tones }) {
  const [shown, setShown] = useState(reducedMotion);
  useEffect(() => {
    if (reducedMotion) return undefined;
    const timer = window.setTimeout(() => setShown(true), 260);
    return () => window.clearTimeout(timer);
  }, [reducedMotion]);
  const pick = (value) => (locale === 'ja' ? value.ja : value.en);
  return (
    <ol className="pd-kpis">
      {figures.map((figure, i) => {
        // Before the roll, show the same shape with zeros so the width holds.
        const start = figure.value.replace(/\d/g, '0');
        return (
          <li key={figure.label.en} style={toneStyle(tones, i)}>
            <strong>
              <Scritto value={shown ? figure.value : start} transition={{ duration: 900 }} />
            </strong>
            <span>{pick(figure.label)}</span>
          </li>
        );
      })}
    </ol>
  );
}

function ProjectDetailView({ project, t, locale, onClose, viewRef, originMarkup, reducedMotion }) {
  const Icon = project.icon;
  const d = project.detail;
  const pick = (obj) => (locale === 'ja' ? obj.ja : obj.en);
  const image = locale === 'ja' && project.imageJa ? project.imageJa : project.image;
  const tones = projectTones(project);
  return (
    <div
      className="project-detail"
      ref={viewRef}
      role="dialog"
      aria-modal="true"
      aria-label={project.title}
    >
      {originMarkup && (
        <div
          className="pd-expand-face"
          aria-hidden="true"
          inert={true}
          dangerouslySetInnerHTML={{ __html: originMarkup }}
        />
      )}
      <div className="project-detail-inner" style={toneStyle(tones, 0)}>
        <div className="pd-topbar">
          <button type="button" className="pd-back pd-animate" onClick={onClose}>
            <ArrowLeft size={16} />
            {t.back}
          </button>
          <div className="pd-actions">
            {project.live && (
              <a href={project.live} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={15} />
                {t.live}
              </a>
            )}
            {project.github ? (
              <a href={project.github} target="_blank" rel="noopener noreferrer">
                <BrandIcon name="github" />
                GitHub
              </a>
            ) : (
              <span className="repo-private">
                <Lock size={14} />
                {t.privateRepo}
              </span>
            )}
          </div>
        </div>

        <header className="pd-hero pd-headline pd-animate">
          <p className="pd-eyebrow">
            <Icon size={15} />
            {badgeLabel(project, locale)}
          </p>
          <h1>{project.title}</h1>
          <p className="pd-tagline">{pick(d.tagline)}</p>
        </header>

        <div className="pd-shot pd-animate">
          {project.gallery?.length ? (
            <ProjectGallery
              slides={project.gallery}
              locale={locale}
              title={project.title}
              reducedMotion={reducedMotion}
              t={t}
            />
          ) : (
            <img src={image} alt={t.a11y.preview(project.title)} loading="lazy" decoding="async" />
          )}
        </div>

        {d.highlights && (
          <section className="pd-block pd-animate pd-reveal">
            <h2 className="pd-h">{t.figures}</h2>
            <FigureTiles figures={d.highlights} locale={locale} reducedMotion={reducedMotion} tones={tones} />
            {d.benchmark && <BenchmarkBars benchmark={d.benchmark} locale={locale} />}
          </section>
        )}

        <section className="pd-block pd-split pd-animate pd-reveal">
          <div className="pd-intro">
            <h2 className="pd-h">{t.overview}</h2>
            <p className="pd-overview">{pick(d.overview)}</p>
            {d.status && <p className="pd-status">{pick(d.status)}</p>}
          </div>
          <aside className="pd-glance" aria-label={t.glance}>
            <dl>
              <div>
                <dt>{t.glanceType}</dt>
                <dd>
                  <span className="pd-type">
                    <Icon size={14} aria-hidden="true" />
                    {badgeLabel(project, locale)}
                  </span>
                </dd>
              </div>
              <div>
                <dt>{t.techHeading}</dt>
                <dd className="pd-chips">
                  {project.tech.map((tech, i) => (
                    <span key={tech} style={toneStyle(tones, i)}>
                      {tech}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
          </aside>
        </section>

        <section className="pd-block pd-animate pd-reveal">
          <h2 className="pd-h">{t.keyFeatures}</h2>
          <ol className="pd-features">
            {d.features.map((f, i) => (
              <li key={f.en} style={toneStyle(tones, i)}>
                <span className="pd-feature-index" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {f.title && <h3>{pick(f.title)}</h3>}
                <p>{pick(f)}</p>
              </li>
            ))}
          </ol>
        </section>

        {(d.flow || d.architecture || d.stack) && (
          <section className="pd-block pd-animate pd-reveal">
            <h2 className="pd-h">{t.howItWorks}</h2>
            {d.flow && <p className="pd-flow-lead">{pick(d.flow)}</p>}
            {d.architecture && (
              <div className="pd-sub">
                <h3 className="pd-h3">{t.systemMap}</h3>
                <ProjectArchitecture steps={d.architecture} locale={locale} tones={tones} />
              </div>
            )}
            {d.stack && (
              <div className="pd-sub">
                <h3 className="pd-h3">{t.architecture}</h3>
                <ProjectFlowChart stages={d.stack} locale={locale} label={t.architecture} tones={tones} />
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [locale, setLocale] = useState(() => fromBrowser(readLocale, 'en'));
  const [burst, setBurst] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [photoPrimed, setPhotoPrimed] = useState(false);
  const [route, setRoute] = useState(() => fromBrowser(() => window.location.hash, ''));
  const [shownProject, setShownProject] = useState(null);
  const [daijinWave, setDaijinWave] = useState(0);
  const [theme, setTheme] = useState(() => fromBrowser(readTheme, 'dark'));
  const [themeChosen, setThemeChosen] = useState(() => fromBrowser(readThemeChosen, false));
  // True for the hydration commit only. Effects that write the language or
  // theme back to the page or storage skip it, because that commit still holds
  // the prerender defaults rather than the visitor's own values.
  const bootRef = useRef(hydratingPrerender);
  // Both depend on the browser, so they start in the prerendered state: the
  // lazy beam cannot be server-rendered (React error 419 on hydration), and
  // the shortcut label depends on the platform.
  const [beamReady, setBeamReady] = useState(false);
  const [isApple, setIsApple] = useState(() => fromBrowser(() => /Mac|iPhone|iPad/.test(navigator.platform), false));
  useEffect(() => {
    setBeamReady(true);
    setIsApple(/Mac|iPhone|iPad/.test(navigator.platform));
  }, []);
  React.useLayoutEffect(() => {
    if (!bootRef.current) return;
    hydratingPrerender = false;
    setLocale(readLocale());
    setRoute(window.location.hash);
    setTheme(readTheme());
    setThemeChosen(readThemeChosen());
  }, []);
  const reducedMotion = useReducedMotion();
  const visitorCount = useVisitorCount();
  const mainRef = useRef(null);
  const smoothWrapperRef = useRef(null);
  const smoothContentRef = useRef(null);
  const lightboxRef = useRef(null);
  const lightboxImgRef = useRef(null);
  const lightboxTlRef = useRef(null);
  const detailRef = useRef(null);
  const detailOriginCardRef = useRef(null);
  const detailOriginMarkupRef = useRef('');
  // True only when this app pushed the #/project/... entry, so closing knows
  // whether stepping back stays on the site.
  const pushedDetailRef = useRef(false);
  // The control that opened the overlay, so focus can go back to it on close.
  const detailReturnFocusRef = useRef(null);

  const t = copy[locale];
  const activeProject = projects.find((p) => route === `#/project/${p.slug}`) || null;
  const openProject = (slug, trigger, { direct = false } = {}) => {
    // The pixel transition covers the page, the detail view mounts under it,
    // then the cells clear. It replaces the mobile card-clone expand, so the
    // direct path below only runs for reduced motion or from inside it.
    if (!direct && !reducedMotion) {
      const project = projects.find((item) => item.slug === slug);
      const rect = trigger?.getBoundingClientRect?.();
      const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
      const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
      // Decode the detail hero screenshot while the cells are covering, so the
      // decode is not the frame that stutters during the uncover.
      const hero = new Image();
      hero.src = locale === 'ja' && project?.imageJa ? project.imageJa : project?.image || '';
      const decoded = hero.decode ? hero.decode().catch(() => {}) : Promise.resolve();
      Promise.all([pixelCover({ x, y, palette: project?.palette || DEFAULT_PALETTE }), decoded]).then(() => {
        openProject(slug, trigger, { direct: true });
        waitForCalm().then(pixelUncover);
      });
      return;
    }
    const mobile = !direct && window.matchMedia('(max-width: 640px)').matches;
    const card = mobile ? trigger?.closest('.project') : null;
    detailReturnFocusRef.current = trigger || null;
    if (card) {
      // Each card carries its own scroll-reveal `gsap.from(card, {y:36,
      // opacity:0, scale:0.985})`. Tapping a card while that tween is still
      // running used to snapshot its in-flight inline styles into the clone —
      // measured as `opacity: 0; transform: translate(0px, 36px)
      // scale(0.985)`, so the clone morphed as a featureless black rectangle
      // with its title 266px out of place, and `measureOrigin()` (which
      // neutralises `main`'s transform but not the card's own) returned the
      // scaled box, 344.75x398.68 instead of 350x404.75. Settle the card
      // first: it is about to be hidden by `is-expand-origin` anyway, and on
      // close it should be at rest, which is exactly what clearProps leaves.
      gsap.killTweensOf(card);
      gsap.set(card, { clearProps: 'opacity,transform,translate,rotate,scale' });
      detailOriginMarkupRef.current = card.outerHTML;
      detailOriginCardRef.current = card;
      card.classList.add('is-expand-origin');
    } else {
      detailOriginMarkupRef.current = '';
      detailOriginCardRef.current = null;
    }
    // Assigning the hash pushes a history entry, so closing may step back.
    pushedDetailRef.current = true;
    window.location.hash = `#/project/${slug}`;
  };
  // The hash change re-renders asynchronously, and GSAP ScrollSmoother's
  // touch-flick momentum can still be settling the list between the tap and
  // that render — a gap a synthetic click never has, which is why this only
  // ever showed up on a real phone. Re-measuring the live card at the moment
  // each animation actually builds (instead of trusting a rect captured at
  // click time) keeps the origin and the animation perfectly in sync no
  // matter how much the page kept moving in between (ADR-038).
  const measureOrigin = () => {
    const card = detailOriginCardRef.current;
    if (!card) return null;
    // While the overlay is open, `main` is left scaled to 0.95 — so on the way
    // OUT, getBoundingClientRect reported the card's *scaled* box and the close
    // animated to the wrong target. Recorded on mobile: it landed at
    // [30, 130, 333, 385] instead of the card's real [20, 183, 350, 405] — 53px
    // too high and 17px too narrow, visible as the card settling beside itself
    // before it blinked away. Neutralise the transform for the measurement;
    // reading a rect forces layout but never a paint, so nothing flashes
    // (ADR-047).
    const main = mainRef.current;
    const saved = main ? main.style.transform : null;
    if (main) main.style.transform = 'none';
    const rect = card.getBoundingClientRect();
    if (main) main.style.transform = saved || '';
    return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
  };
  // `history.length > 1` only says the tab has history — not that the previous
  // entry belongs to this site. Someone opening a shared #/project/... link in
  // a tab they arrived in from LinkedIn was sent *back to LinkedIn* by the
  // "Back to projects" button. Only step back through an entry this app pushed
  // itself; otherwise clear the hash, which lands on the project list either
  // way (ADR-042).
  const closeProject = ({ direct = false } = {}) => {
    if (!direct && !reducedMotion) {
      const project = projects.find((item) => route === `#/project/${item.slug}`);
      pixelCover({ x: 40, y: 40, palette: project?.palette || DEFAULT_PALETTE }).then(() => {
        closeProject({ direct: true });
        waitForCalm().then(pixelUncover);
      });
      return;
    }
    if (pushedDetailRef.current) {
      pushedDetailRef.current = false;
      window.history.back();
      return;
    }
    // Deep-linked visit: strip the hash in place rather than pushing another
    // entry that Back would only re-open. replaceState fires no hashchange,
    // so drive the route directly.
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    setRoute('');
  };
  // Japanese visitors get the Japanese-language CV; everyone else the English
  // one. This branch was disabled for a while because the JA file was a
  // byte-for-byte copy of the English CV; it is now the real 履歴書・職務経歴書.
  const resumeHref =
    locale === 'ja' ? '/resume/Mohamed_Fuad_CV_JA.pdf' : '/resume/Mohamed_Fuad_CV.pdf';

  useEffect(() => {
    if (bootRef.current) return;
    window.localStorage.setItem('portfolio-locale', locale);
    // `index.html` ships `lang="en"`, so without this a Japanese visitor gets a
    // fully translated page that still declares itself English — screen readers
    // then read Japanese with an English voice.
    document.documentElement.lang = locale === 'ja' ? 'ja' : 'en';
  }, [locale]);

  useEffect(() => {
    if (!import.meta.env.PROD || bootRef.current) return;
    const path = activeProject ? `/project/${activeProject.slug}` : '/';
    pageview({ route: path, path });
  }, [route, activeProject]);

  // Project detail routing: keep `route` in sync with the URL hash.
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Mount the detail view when navigating in; animate it out then unmount when
  // navigating away (hash cleared or browser back).
  useEffect(() => {
    if (activeProject) {
      setShownProject(activeProject);
      return;
    }
    const el = detailRef.current;
    if (!shownProject || !el) return;
    const origin = measureOrigin();
    const face = el.querySelector('.pd-expand-face');
    const inner = el.querySelector('.project-detail-inner');
    const mobile = window.matchMedia('(max-width: 640px)').matches;
    const releaseOrigin = () => {
      detailOriginCardRef.current?.classList.remove('is-expand-origin');
      detailOriginCardRef.current = null;
      detailOriginMarkupRef.current = '';
      gsap.set(mainRef.current, { clearProps: 'transform,opacity,transformOrigin' });
      setShownProject(null);
    };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      releaseOrigin();
      return;
    }

    gsap.killTweensOf([el, face, inner, mainRef.current]);
    if (mobile && origin && face && inner) {
      el.scrollTop = 0;
      gsap.set(face, { visibility: 'visible' });
      // The closing frame shrinks, so the clone would reflow on the way out
      // too without being pinned to the card it is returning to (ADR-046).
      gsap.set(face.querySelector('.project'), pinnedFaceLayout(origin));
      // Same pin as the open: the closing container shrinks, so without it the
      // content would re-wrap and jump on the way out too (ADR-036).
      gsap.set(inner, pinnedInnerLayout());
      gsap
        .timeline({ onComplete: releaseOrigin })
        .to(inner, { autoAlpha: 0, y: 18, duration: 0.18, ease: 'power2.in' }, 0)
        .to(face, { autoAlpha: 1, duration: 0.18, ease: 'power1.out' }, 0.1)
        .to(
          el,
          {
            left: origin.left,
            top: origin.top,
            width: origin.width,
            height: origin.height,
            borderRadius: 10,
            duration: 0.38,
            ease: cardExpandEase,
          },
          0
        )
        .to(mainRef.current, { scale: 1, opacity: 1, duration: 0.38, ease: cardExpandEase }, 0)
        .to(el, { autoAlpha: 0, duration: 0.06, ease: 'none' }, 0.35);
      return;
    }

    gsap.to(el, {
      autoAlpha: 0,
      y: 16,
      duration: 0.28,
      ease: 'power2.in',
      onComplete: releaseOrigin,
    });
  }, [activeProject]); // eslint-disable-line react-hooks/exhaustive-deps

  // Smooth GSAP entrance each time a detail view mounts.
  useGSAP(
    () => {
      const el = detailRef.current;
      if (!shownProject || !el) return;
      el.scrollTop = 0;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set(el, { autoAlpha: 1, y: 0, inset: 0, width: 'auto', height: 'auto' });
        gsap.set(el.querySelector('.pd-expand-face'), { display: 'none' });
        gsap.set(el.querySelector('.project-detail-inner'), { autoAlpha: 1 });
        return;
      }
      const origin = measureOrigin();
      const mobile = window.matchMedia('(max-width: 640px)').matches;
      const timeline = gsap.timeline();

      gsap.set(el, { autoAlpha: 0, y: 0 });

      if (mobile && origin) {
        const face = el.querySelector('.pd-expand-face');
        const inner = el.querySelector('.project-detail-inner');
        const reveal = el.querySelectorAll('.pd-reveal');
        if (!face || !inner) return;

        gsap.set(el, {
          autoAlpha: 1,
          // `right`/`bottom` explicitly, never the `inset` shorthand. GSAP's
          // CSSPlugin builds its PropTween list by prepending, so the vars are
          // applied in REVERSE of the order written here — `inset: 'auto'` was
          // therefore landing after `left`/`top` and resetting both to auto.
          // The open then tweened left/top from a computed 0,0, so the overlay
          // grew out of the viewport's top-left corner instead of the tapped
          // card: measured start error of 241.86px vertically on a card sitting
          // mid-page, scaling with scroll position. The close was never affected
          // because it does not touch `inset`, which is why this survived the
          // ADR-046 sampling (that compared clone children against their
          // originals — all relative — not the overlay's absolute origin).
          right: 'auto',
          bottom: 'auto',
          left: origin.left,
          top: origin.top,
          width: origin.width,
          height: origin.height,
          borderRadius: 10,
          overflow: 'hidden',
        });
        gsap.set(face, { autoAlpha: 1, visibility: 'visible' });
        gsap.set(face.querySelector('.project'), pinnedFaceLayout(origin));
        // Pin the content to the width it will END at. Otherwise its
        // `calc(100% - 32px)` width tracks the animating container, the tagline
        // re-wraps mid-flight and every heading below it jumps (ADR-036).
        gsap.set(inner, { autoAlpha: 0, ...pinnedInnerLayout() });
        gsap.set(reveal, { y: 18, opacity: 0 });
        gsap.set(mainRef.current, {
          transformOrigin: `${origin.left + origin.width / 2}px ${origin.top + origin.height / 2}px`,
        });

        timeline
          .to(
            el,
            {
              left: 0,
              top: 0,
              width: window.innerWidth,
              height: window.innerHeight,
              borderRadius: 24,
              duration: 0.44,
              ease: cardExpandEase,
            },
            0
          )
          .to(mainRef.current, { scale: 0.95, opacity: 0.65, duration: 0.44, ease: cardExpandEase }, 0)
          // The clone and the real page are two different layouts: the cloned
          // card's title rests 110.3px above the detail page's <h1>, and its
          // preview image ~90px above `.pd-shot`. The old timing left both
          // layers over 10% opaque for ~200ms, so two vertically offset copies
          // of the same title and image visibly dissolved through each other —
          // the "displaced, shows low then jumps" the animation was reported
          // for. It is ~4x the box's own residual travel, so it dominates.
          //
          // Hand over instead of cross-fading: the clone is gone by 0.32 and
          // the real content starts after it. `.project-detail` and
          // `.pd-expand-face` share #0b0d0e, so the handover is invisible.
          // Waiting until 0.32 also all but removes the second defect —
          // `.project-detail-inner` is a normal-flow child of the box being
          // tweened, so it rides the box's remaining journey. cardExpandEase is
          // heavily front-loaded (95.5% covered by 0.22, which still left
          // 4.5% x origin.top = up to 36px of travel in plain sight); by 0.32
          // the residual is under a pixel or two.
          .to(face, { autoAlpha: 0, duration: 0.1, ease: 'power1.out' }, 0.22)
          .to(inner, { autoAlpha: 1, duration: 0.16, ease: 'power2.out' }, 0.32)
          .to(
            reveal,
            { y: 0, opacity: 1, duration: 0.34, stagger: 0.04, ease: 'power2.out' },
            0.36
          )
          .set(face, { visibility: 'hidden' })
          // Hand layout back to CSS once nothing is animating, so the page
          // stays responsive to rotation and resize.
          .set(inner, { clearProps: 'width,marginLeft,marginRight' })
          .set(el, { overflowY: 'auto' });
        return;
      }

      // The header block lands in place and only fades. It used to ride the
      // same `y: 26` stagger as everything else, which meant the panel was
      // fully opaque at ~290ms while its content was still sliding upward
      // until ~1130ms — content visibly arriving low and then travelling up,
      // which is what this animation kept getting reported for.
      //
      // Not tweening `y` here also fixes a real bug. `.pd-back` carries
      // `transition: ... transform 160ms` for its hover nudge, and GSAP's
      // `.from()` initialises lazily when the playhead reaches it — by then the
      // CSS transition had already carried the transform partway, GSAP read
      // that in-flight value as the element's resting `y`, and baked it in. The
      // button slid *down* ~26px instead of up and stayed there for the life of
      // the overlay (measured 25.57px at 1280x900, 18.34px at 1440x900 — a
      // race, not a constant), leaving its gap at ~18px instead of 44px. With
      // no transform written, the CSS keeps ownership and the hover nudge works
      // again too; it had been dead, overridden by GSAP's leftover inline
      // transform.
      const hero = el.querySelectorAll('.pd-back, .pd-shot, .pd-headline');
      const blocks = el.querySelectorAll('.pd-block');
      timeline
        .to(el, { autoAlpha: 1, duration: 0.28, ease: 'power2.out' }, 0)
        .fromTo(hero, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' }, 0.06)
        // Below the fold, so their rise is never seen arriving — but pin the
        // end explicitly with fromTo rather than `.from()`, so no stray CSS
        // transition can ever bake an offset in the way `.pd-back`'s did.
        .fromTo(
          blocks,
          { y: 18, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'power2.out' },
          0.12
        );
    },
    { dependencies: [shownProject] }
  );

  // Lock background scroll while the detail view is open.
  useEffect(() => {
    document.body.style.overflow = shownProject ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [shownProject]);

  // The overlay declares role="dialog" aria-modal="true", so it has to behave
  // like one: Escape closes it, focus moves inside on open and returns to the
  // card that opened it on close, and the page behind it leaves the tab order.
  // Previously none of that held — every background link stayed reachable by
  // Tab underneath a supposedly modal surface (ADR-042).
  useEffect(() => {
    if (!shownProject) return;
    const smoothWrapper = smoothWrapperRef.current;
    smoothWrapper?.setAttribute('inert', '');

    const onKey = (event) => {
      // A layer above (the command menu) that already handled Escape marks it
      // with preventDefault; only a bare Escape closes the project.
      if (event.key === 'Escape' && !event.defaultPrevented) {
        event.preventDefault();
        closeProject();
      }
    };
    window.addEventListener('keydown', onKey);

    // The entrance timeline starts the overlay at autoAlpha 0 — which is
    // `visibility: hidden` — and focusing a hidden element is silently a no-op.
    // Wait for the first frame it is actually painted rather than guessing a
    // delay that the open animation might outlast.
    let focusFrame = 0;
    let attempts = 0;
    const focusWhenVisible = () => {
      const dialog = detailRef.current;
      if (!dialog) return;
      if (getComputedStyle(dialog).visibility === 'visible') {
        dialog.querySelector('.pd-back')?.focus({ preventScroll: true });
        return;
      }
      if ((attempts += 1) > 90) return; // ~1.5s; give up rather than spin
      focusFrame = requestAnimationFrame(focusWhenVisible);
    };
    focusFrame = requestAnimationFrame(focusWhenVisible);

    return () => {
      cancelAnimationFrame(focusFrame);
      window.removeEventListener('keydown', onKey);
      smoothWrapper?.removeAttribute('inert');
      // Only pull focus back if it is still parked on the (now unmounted)
      // overlay — never yank it away from something the visitor chose.
      const active = document.activeElement;
      if (!active || active === document.body) {
        detailReturnFocusRef.current?.focus?.({ preventScroll: true });
      }
      detailReturnFocusRef.current = null;
    };
  }, [shownProject]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lightbox: rotate/scale the photo open; reverse to close.
  useGSAP(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    lightboxTlRef.current = gsap
      .timeline({
        paused: true,
        onReverseComplete: () => gsap.set(lightboxRef.current, { visibility: 'hidden' }),
      })
      .set(lightboxRef.current, { visibility: 'visible' })
      .fromTo(
        lightboxRef.current,
        { opacity: 0 },
        { opacity: 1, duration: reduceMotion ? 0 : 0.32, ease: 'power2.out' },
        0
      )
      .fromTo(
        lightboxImgRef.current,
        { scale: 0.15, rotation: -28, opacity: 0 },
        { scale: 1, rotation: 0, opacity: 1, duration: reduceMotion ? 0 : 0.7, ease: 'back.out(1.35)' },
        0.03
      );
  });

  useEffect(() => {
    const tl = lightboxTlRef.current;
    if (!tl) return;
    if (photoOpen) tl.timeScale(1).play();
    else tl.timeScale(1.4).reverse();
  }, [photoOpen]);

  useEffect(() => {
    if (!photoOpen) return;
    const onKey = (event) => {
      if (event.key === 'Escape') setPhotoOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [photoOpen]);

  useGSAP(
    (context, contextSafe) => {
      const mm = gsap.matchMedia();

      // Animate only when the visitor hasn't asked for reduced motion.
      mm.add('(prefers-reduced-motion: no-preference)', () => {
          const ease = 'power3.out';

          // Pass elements, not selectors: the useGSAP context is scoped to
          // mainRef, so selector strings can't resolve these ancestors.
          const smoother = ScrollSmoother.create({
            wrapper: smoothWrapperRef.current,
            content: smoothContentRef.current,
            smooth: 1.1,
            effects: false,
            smoothTouch: false,
          });

        // Hero: animate whole containers (not staggered children) with
        // clearProps so no inline transform can ever stick and misalign
        // flex rows (the earlier "OR pushed up" bug).
        // Movement only, no fade: text that starts at opacity 0 cannot count as
        // painted until the animation ends, which made the intro paragraph the
        // page's slowest paint (Lighthouse LCP) on phones.
        // The hero entrance and the name flourish are CSS animations now
        // (global.css, "Hero entrance"), so they start with the prerendered
        // paint instead of waiting for this bundle.

        // Skill icons drift gently, like icons floating along a pipeline.
        gsap.utils.toArray('.skill-mark').forEach((el) => {
          gsap.to(el, {
            y: gsap.utils.random(2.5, 4.5),
            duration: gsap.utils.random(1.1, 1.9),
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
            delay: -gsap.utils.random(0, 2),
          });
        });

        // Section headings slide in from the left as they appear.
        gsap.utils.toArray('.section-title').forEach((el) => {
          gsap.from(el, {
            scrollTrigger: { trigger: el, start: 'top 88%' },
            x: -18,
            opacity: 0,
            duration: 0.65,
            ease,
          });
        });

        // Generic blocks fade up when scrolled into view.
        gsap.utils
          .toArray(['.contribution', '.more-projects-row', '.blog-content', '.contact-card'])
          .forEach((el) => {
            gsap.from(el, {
              scrollTrigger: { trigger: el, start: 'top 90%' },
              y: 28,
              opacity: 0,
              duration: 0.7,
              ease,
            });
          });

        // Timeline: draw the dashed line, raise the rows, pop the nodes.
        gsap.from('.timeline .line', {
          scrollTrigger: { trigger: '.timeline', start: 'top 80%' },
          scaleY: 0,
          transformOrigin: 'top center',
          duration: 0.9,
          ease: 'power2.inOut',
        });
        gsap.from('.timeline .experience-item', {
          scrollTrigger: { trigger: '.timeline', start: 'top 80%' },
          y: 24,
          opacity: 0,
          duration: 0.6,
          stagger: 0.15,
          ease,
        });
        gsap.from('.timeline .dot', {
          scrollTrigger: { trigger: '.timeline', start: 'top 80%' },
          scale: 0,
          duration: 0.5,
          delay: 0.3,
          stagger: 0.15,
          ease: 'back.out(2.4)',
        });

        // Projects: each card reveals on its own, tags cascade in,
        // and the screenshot drifts (parallax) while the page scrolls past.
        gsap.utils.toArray('.projects .project').forEach((card) => {
          gsap.from(card, {
            scrollTrigger: { trigger: card, start: 'top 86%' },
            y: 36,
            opacity: 0,
            scale: 0.985,
            duration: 0.7,
            ease,
          });
          gsap.from(card.querySelectorAll('.tags span'), {
            scrollTrigger: { trigger: card, start: 'top 80%' },
            y: 10,
            opacity: 0,
            duration: 0.4,
            stagger: 0.05,
            ease,
          });
          const shot = card.querySelector('.project-shot img');
          if (shot) {
            gsap.fromTo(
              shot,
              { yPercent: -5, scale: 1.12 },
              {
                yPercent: 5,
                scale: 1.12,
                ease: 'none',
                scrollTrigger: { trigger: card, start: 'top bottom', end: 'bottom top', scrub: true },
              }
            );
          }
        });

        // Contribution grid sparkles in cell by cell.
        gsap.from('.contribution .grid .cell', {
          scrollTrigger: { trigger: '.contribution', start: 'top 78%' },
          scale: 0.3,
          opacity: 0,
          duration: 0.5,
          ease,
          stagger: { each: 0.005, from: 'random' },
          // A leftover `transform: translate(0, 0)` makes every cell its own
          // stacking context, which is how neighbouring cells used to paint
          // over the hover tooltip. Leave nothing inline once each cell lands.
          clearProps: 'transform,translate,rotate,scale,opacity',
        });

        // Signature: the Spell UI timing. Each glyph traces for 1.5s with
        // easeInOut, starting 0.2s after the previous one, once, on enter.
        const signatureTimeline = gsap.timeline({
          paused: true,
          defaults: { duration: 1.5, ease: 'power1.inOut' },
        });
        // Hidden until its turn, like Spell's opacity step: a round cap on a
        // zero-length dash would otherwise leave a dot at every glyph start.
        ['.signature .sig-outline', '.signature .sig-reveal'].forEach((selector) => {
          gsap.utils.toArray(selector).forEach((path, index) => {
            signatureTimeline
              .set(path, { opacity: 1 }, index * 0.2)
              .fromTo(path, { drawSVG: 0 }, { drawSVG: '100%', immediateRender: true }, index * 0.2);
          });
        });
        gsap.set('.signature .sig-outline, .signature .sig-reveal', { opacity: 0 });
        ScrollTrigger.create({
          trigger: '.signature-wrap',
          start: 'top 88%',
          once: true,
          onEnter: () => signatureTimeline.play(),
        });

        // Waveform divider grows outward, then keeps breathing like a
        // quiet equalizer.
        gsap.from('.wave-divider .wave-bars i', {
          scrollTrigger: { trigger: '.wave-divider', start: 'top 94%' },
          scaleY: 0.1,
          opacity: 0,
          duration: 0.6,
          ease: 'back.out(1.8)',
          stagger: { each: 0.03, from: 'center' },
          onComplete: () => {
            gsap.utils.toArray('.wave-bars i').forEach((bar) => {
              gsap.to(bar, {
                scaleY: 'random(0.3, 1)',
                duration: 'random(0.5, 1.1)',
                ease: 'sine.inOut',
                yoyo: true,
                repeat: -1,
                repeatRefresh: true,
              });
            });
          },
        });

        // Footer sits at the very bottom, so use a start it can always reach.
        gsap.from('footer', {
          scrollTrigger: { trigger: 'footer', start: 'top bottom-=40' },
          y: 22,
          opacity: 0,
          duration: 0.7,
          ease,
        });

        // Daijin lives in the contact card now and waves when it scrolls in.
        ScrollTrigger.create({
          trigger: '.contact-card',
          start: 'top 80%',
          onEnter: () => setDaijinWave((count) => count + 1),
        });

        // Smooth-scroll the hero's "#projects" link instead of jumping.
        const buildingLink = mainRef.current?.querySelector('.building');
        const smoothScroll = contextSafe((event) => {
          event.preventDefault();
          gsap.to(smoother, {
            scrollTop: smoother.offset('#projects', 'top 14px'),
            duration: 1,
            ease: 'power2.inOut',
          });
        });
        buildingLink?.addEventListener('click', smoothScroll);

        // Late-loading images can shift layout; recalc trigger positions.
        const onLoad = () => ScrollTrigger.refresh();
        window.addEventListener('load', onLoad);

        return () => {
          buildingLink?.removeEventListener('click', smoothScroll);
          window.removeEventListener('load', onLoad);
        };
        }
      );
    },
    { scope: mainRef }
  );



  useEffect(() => {
    if (bootRef.current) return;
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f5f0e8' : '#0e0c0b');
  }, [theme]);

  useEffect(() => {
    if (themeChosen) return undefined;
    const query = window.matchMedia('(prefers-color-scheme: light)');
    const follow = () => setTheme(query.matches ? 'light' : 'dark');
    query.addEventListener('change', follow);
    return () => query.removeEventListener('change', follow);
  }, [themeChosen]);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    setThemeChosen(true);
    try {
      window.localStorage.setItem('portfolio-theme', next);
    } catch {
      /* storage unavailable */
    }
  };

  const scrollToSection = (selector) => {
    const target = document.querySelector(selector);
    if (!target) return;
    const smoother = ScrollSmoother.get();
    if (smoother) smoother.scrollTo(target, true, 'top 120px');
    else target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const commandItems = [
    ...[
      ['skills', t.skills, '.skills-marquees', Code2],
      ['work', t.work, '.timeline', BriefcaseBusiness],
      ['contributions', t.command.contributions, '.contribution', Sparkles],
      ['projects', t.projects, '#projects', Rocket],
      ['writing', t.thoughtsTitle, '.blog-content', Terminal],
      ['contact', t.connectTitle, '#contact', Mail],
    ].map(([id, label, selector, icon]) => ({
      id: `go-${id}`,
      group: t.command.sections,
      label,
      keywords: id,
      icon,
      run: () => {
        if (!activeProject) {
          scrollToSection(selector);
          return;
        }
        // Closing steps history back and plays the close animation; scroll
        // once the page underneath is live again.
        closeProject();
        window.setTimeout(() => scrollToSection(selector), reducedMotion ? 650 : 1300);
      },
    })),
    ...projects.map((project) => ({
      id: `project-${project.slug}`,
      group: t.projects,
      label: project.title,
      sub: locale === 'ja' ? project.descriptionJa : project.description,
      keywords: project.tech.join(' '),
      icon: project.icon,
      run: () => openProject(project.slug, null),
    })),
    {
      id: 'copy-email',
      group: t.command.actions,
      label: t.command.copyEmail,
      icon: Mail,
      run: () => navigator.clipboard?.writeText('mohamed.fuad.jp@gmail.com').catch(() => {}),
    },
    {
      id: 'resume',
      group: t.command.actions,
      label: t.command.resume,
      icon: FileDown,
      run: () => window.open(resumeHref, '_blank', 'noopener'),
    },
    {
      id: 'github',
      group: t.command.actions,
      label: 'GitHub',
      icon: Code2,
      run: () => window.open('https://github.com/MohamedFuad16', '_blank', 'noopener'),
    },
    {
      id: 'linkedin',
      group: t.command.actions,
      label: 'LinkedIn',
      icon: Users,
      run: () => window.open('https://www.linkedin.com/in/mohamed-fuad-6b8483278', '_blank', 'noopener'),
    },
    {
      id: 'theme',
      group: t.command.settings,
      label: theme === 'light' ? t.command.dark : t.command.light,
      keywords: 'theme appearance light dark mode テーマ',
      icon: theme === 'light' ? Moon : Sun,
      run: toggleTheme,
    },
    {
      id: 'language',
      group: t.command.settings,
      label: locale === 'ja' ? 'Switch to English' : '日本語に切り替え',
      keywords: 'language locale english japanese 言語',
      icon: Languages,
      run: () => setLocale(locale === 'ja' ? 'en' : 'ja'),
    },
  ];


  const handleNameAction = (event) => {
    event.stopPropagation();
    setBurst(false);
    requestAnimationFrame(() => setBurst(true));
    window.setTimeout(() => setBurst(false), 850);
  };

  const avatarCard = (
    <div className={`avatar ${showQr ? 'is-flipped' : ''}`}>
      <div className="avatar-card">
        <div className="avatar-face avatar-front">
          <img
            className="profile-photo"
            onPointerEnter={() => setPhotoPrimed(true)}
            onFocus={() => setPhotoPrimed(true)}
            onTouchStart={() => setPhotoPrimed(true)}
            src="/media/images/profile-440.webp"
            width="440"
            height="330"
            alt="Mohamed Fuad"
            title={t.a11y.viewPhoto}
            onClick={() => {
              setPhotoPrimed(true);
              setPhotoOpen(true);
            }}
          />
        </div>
        <div className="avatar-face avatar-back">
          <img src="/media/images/linkedin-qr.png" alt={t.a11y.linkedinQr} loading="lazy" />
        </div>
      </div>
    </div>
  );

  // Declared after every effect that checks bootRef, so those skip the
  // hydration commit and run normally on the corrected re-render. A home-route
  // visit has no route change to trigger the pageview effect, so count it here.
  useEffect(() => {
    if (!bootRef.current) return;
    bootRef.current = false;
    document.documentElement.removeAttribute('data-hold-prerender');
    if (import.meta.env.PROD && !window.location.hash.startsWith('#/project/')) {
      pageview({ route: '/', path: '/' });
    }
  }, []);

  return (
    <>
      <CommandMenu items={commandItems} suggestions={t.command.suggestions} t={t} />
      <div
        className="avatar-lightbox"
        ref={lightboxRef}
        role="dialog"
        aria-modal="true"
        aria-label={t.a11y.profilePhoto}
        onClick={() => setPhotoOpen(false)}
      >
        <img
          ref={lightboxImgRef}
          // Full-size photo only once someone reaches for it: hover, focus or
          // touch on the avatar primes it ahead of the open animation.
          src={photoPrimed ? '/media/images/profile.jpg' : undefined}
          alt={t.a11y.enlargedPhoto}
          onClick={(event) => event.stopPropagation()}
        />
      </div>
      {shownProject && (
        <ProjectDetailView
          project={shownProject}
          t={t}
          locale={locale}
          onClose={closeProject}
          viewRef={detailRef}
          originMarkup={detailOriginMarkupRef.current}
          reducedMotion={reducedMotion}
        />
      )}
      <div id="smooth-wrapper" ref={smoothWrapperRef}>
        <div id="smooth-content" ref={smoothContentRef}>
          <main ref={mainRef}>
      {/* Page controls in one row, all the same height, clear of the hero. */}
      <div className="page-controls">
        <span className="locale-switch" role="group" aria-label={t.a11y.language}>
          <button
            type="button"
            className={locale === 'en' ? 'on' : ''}
            aria-pressed={locale === 'en'}
            onClick={() => setLocale('en')}
          >
            EN
          </button>
          <button
            type="button"
            className={locale === 'ja' ? 'on' : ''}
            aria-pressed={locale === 'ja'}
            onClick={() => setLocale('ja')}
          >
            日本語
          </button>
        </span>
        <ThemeSwitch
          theme={theme}
          onToggle={toggleTheme}
          label={theme === 'light' ? t.command.dark : t.command.light}
        />
        <button
          type="button"
          className="command-trigger"
          onClick={() => window.dispatchEvent(new Event('command:open'))}
          aria-label={t.command.button}
          aria-keyshortcuts="Meta+K Control+K"
        >
          <Search size={13} aria-hidden="true" />
          <span>{t.command.search}</span>
          <kbd>{isApple ? '⌘K' : 'Ctrl K'}</kbd>
        </button>
      </div>

      <section className="profile">
        {/* The beam traces the photo's edge; the QR toggle is a sibling of the
            beam, not a child, so BorderBeam keeps its own clipping and the
            button is never cut off or haloed (ADR-034). */}
        <div
          className="avatar-shell"
        >
        {beamReady ? (
        <React.Suspense fallback={<div className="avatar-beam">{avatarCard}</div>}>
        <BorderBeam
          className="avatar-beam"
          size="md"
          colorVariant="colorful"
          theme="dark"
          borderRadius={10}
          strength={1}
          brightness={1.9}
          saturation={1.6}
          duration={2.8}
          active={!reducedMotion}
        >
        {avatarCard}
        </BorderBeam>
        </React.Suspense>
        ) : (
          <div className="avatar-beam">{avatarCard}</div>
        )}
        <button
          className="qr-toggle-btn"
          type="button"
          aria-label={showQr ? t.a11y.showPhoto : t.a11y.showQr}
          onClick={(event) => {
            event.stopPropagation();
            setShowQr((current) => !current);
          }}
        >
          <QrCode size={17} />
        </button>
        </div>
        <div className="identity">
          <h1>
            {/* Split into letters in the markup itself, so the entrance can
                run in CSS from the first (prerendered) paint. The label keeps
                it one name for screen readers, as the split-text aria pattern does. */}
            <span className="name-text" aria-label="Mohamed Fuad">
              {['Mohamed', 'Fuad'].map((word, w) => (
                <React.Fragment key={word}>
                  {w > 0 && ' '}
                  {[...word].map((char, c) => (
                    <span key={c} className="name-char" aria-hidden="true" style={{ '--i': w * 8 + c }}>
                      {char}
                    </span>
                  ))}
                </React.Fragment>
              ))}
            </span>
            <button className={`name-action ${burst ? 'bursting' : ''}`} type="button" onClick={handleNameAction}>
              <Rocket size={19} fill="currentColor" />
              <i />
              <i />
              <i />
            </button>
          </h1>
          <a className="building" href="#projects">
            <span className="building-lead">{t.buildingLead}</span>
            <RollingRole roles={t.roles} reducedMotion={reducedMotion} />
          </a>
          <p className="meta">
            <span className="meta-location">
              <MapPin size={14} />
              {t.location}
            </span>
            <span className="meta-separator">•</span>
            <a
              className="university-meta"
              href="https://www.u-tokai.ac.jp/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src="/media/logos/tokai-university.svg" alt="" />
              <span>{t.student}</span>
              <span className="university-grad">{t.graduation}</span>
            </a>
          </p>
        </div>
      </section>

      <div className="intro">
        {t.introParagraphs.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      <nav className="actions" aria-label={t.a11y.contactLinks}>
        <a href="https://www.linkedin.com/in/mohamed-fuad-6b8483278" target="_blank" rel="noopener noreferrer">
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
        <a className="square" href="https://github.com/MohamedFuad16" target="_blank" rel="noopener noreferrer">
          <BrandIcon name="github" />
        </a>
        <a className="square" href={resumeHref} target="_blank" rel="noopener noreferrer">
          <FileDown size={16} />
        </a>
      </nav>

      <div className="silk-band" aria-hidden="true">
        <SilkWave reducedMotion={reducedMotion} />
      </div>

      <SectionTitle>{t.skills}</SectionTitle>
      <div className="skills-marquees" id="skills" aria-label={t.a11y.skillsCarousel}>
        {skillRows.map((row, rowIndex) => (
          <div className="skills-marquee" data-direction={rowIndex === 0 ? 'left' : 'right'} key={rowIndex}>
            <ul className="skills">
              {[...row, ...row, ...row].map((skill, index) => (
                <SkillPill
                  key={`${skill.label}-${rowIndex}-${index}`}
                  skill={skill}
                  // The row repeats three times for the seamless loop; only the
                  // first copy is reachable by keyboard and screen readers.
                  copy={index >= row.length}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>

      <SectionTitle>{t.work}</SectionTitle>
      <section className="dashed timeline" id="experience">
        <div className="line" />
        {experience.map((item) => (
          <ExperienceItem key={item.company} item={item} locale={locale} t={t} />
        ))}
      </section>

      <ContributionGrid t={t} locale={locale} />

      <SectionTitle>{t.projects}</SectionTitle>
      <section className="projects" id="projects">
        {projects.map((project) => (
          <ProjectCard
            key={project.title}
            project={project}
            t={t}
            locale={locale}
            onOpen={openProject}
          />
        ))}
      </section>

      <div className="more-projects-row">
        <a className="view-all-btn" href="https://github.com/MohamedFuad16" target="_blank" rel="noopener noreferrer">
          {t.moreProjects}
          <ArrowUpRight size={17} />
        </a>
      </div>

      <SectionTitle>{t.thoughtsTitle}</SectionTitle>
      <section className="dashed blog-content" id="writing">
        <p>
          {t.thoughts}{' '}
          <a className="qiita-link" href={QIITA_PROFILE} target="_blank" rel="noopener noreferrer">
            <BrandIcon name="qiita" />
            {t.thoughtsLink}
          </a>
          {t.thoughtsTail}
        </p>
      </section>

      <section className="dashed contact-card" id="contact">
        {/* Daijin waves when the card scrolls in, and again on hover. */}
        <div className="daijin-spot" onPointerEnter={() => setDaijinWave((count) => count + 1)}>
          <DaijinMascot mode="ambient" playKey={daijinWave} reducedMotion={reducedMotion} />
        </div>
        <h3>{t.connectTitle}</h3>
        <p>{t.connectText}</p>
        <nav className="contact-links" aria-label={t.a11y.moreContactLinks}>
          <EmailLink label={t.email} />
          <a href="https://github.com/MohamedFuad16" target="_blank" rel="noopener noreferrer">
            <BrandIcon name="github" />
            GitHub
          </a>
          <a href={resumeHref} target="_blank" rel="noopener noreferrer">
            <FileDown size={14} />
            {t.resume}
          </a>
          <a href="https://www.linkedin.com/in/mohamed-fuad-6b8483278" target="_blank" rel="noopener noreferrer">
            <span className="btn-icon">
              <BrandIcon name="linkedin" />
            </span>
            LinkedIn
          </a>
        </nav>
      </section>

      <Signature />

      <WaveDivider />

      <footer className="site-footer">
        <p className="footer-meta">
        <Terminal size={14} />
        Mohamed Fuad
        <span>•</span>
        <Code2 size={14} />
        {t.footerRole}
        <span>•</span>
        <Server size={14} />
        {t.footerCity}
        <span>•</span>
        <Database size={14} />
        2026
        {/* Only rendered once a real count arrives, so the footer never shows a
            placeholder zero if the endpoint is unconfigured or unreachable. */}
        {visitorCount !== null && (
          <>
            <span>•</span>
            <span className="visitor-count">
              <Users size={14} />
              <PopInNumber value={visitorCount.toLocaleString(locale === 'ja' ? 'ja-JP' : 'en-US')} />
              {t.visitors(visitorCount)}
            </span>
          </>
        )}
        </p>
        {/* Travellers walking toward a light on the horizon, generated by
            scripts/make-footer-art.py in a dark and a light edition whose sky
            is the page colour, so the page opens into the landscape. Only the
            edition for the current theme is displayed, and lazy images that
            are not displayed are never fetched. */}
        <div className="footer-art" aria-hidden="true">
          {['dark', 'light'].map((edition) => (
            <img
              key={edition}
              className={`footer-art-${edition}`}
              src={`/media/images/footer-${edition}-1200.webp`}
              srcSet={`/media/images/footer-${edition}-1200.webp 1200w, /media/images/footer-${edition}-2400.webp 2400w`}
              sizes="100vw"
              alt=""
              loading="lazy"
              decoding="async"
              width="2400"
              height="900"
            />
          ))}
        </div>
      </footer>
          </main>
        </div>
      </div>
    </>
  );
}

/**
 * The page renders third-party data (the GitHub contribution feed) straight
 * into JSX. Without a boundary, a single malformed row anywhere in the tree
 * unmounts the whole document and leaves a blank dark screen — the site's only
 * failure mode was "everything, silently". Keep it dumb: no retry loop, just a
 * readable fallback with the links that matter.
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error, info) {
    console.error('Portfolio failed to render:', error, info);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="fatal-error" role="alert">
        <h1>Something broke while rendering this page.</h1>
        <p>
          Sorry about that. Reloading usually fixes it. You can also reach me on{' '}
          <a href="https://github.com/MohamedFuad16" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>{' '}
          or by{' '}
          <a href="mailto:mohamed.fuad.jp@gmail.com">email</a>.
        </p>
        <button type="button" onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    );
  }
}
