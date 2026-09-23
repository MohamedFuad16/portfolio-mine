import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { pageview } from '@vercel/analytics';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';
import { useGSAP } from '@gsap/react';
import { BorderBeam } from 'border-beam';
import { signaturePath, signatureViewBox, signatureStrokeWidth } from './data/signature-path';
import { DaijinMascot } from './components/DaijinMascot';
import {
  ArrowLeft,
  ArrowUpRight,
  BriefcaseBusiness,
  Camera,
  Check,
  ChevronDown,
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
import './styles/global.css';
import './styles/theme-light.css';

gsap.registerPlugin(
  ScrollTrigger,
  ScrollToPlugin,
  ScrollSmoother,
  DrawSVGPlugin,
  SplitText,
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
    location: 'Tokyo, Japan',
    student: 'Information and Communication Technology student',
    introParagraphs: [
      <>
        I&apos;m a <b>full-stack developer</b> and a third-year Information and Communication
        Technology student at Tokai University. I want to be a{' '}
        <b>Forward Deployed Engineer</b>, sitting with the people who will use the thing and
        building it there rather than guessing at it from a backlog.
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
      placeholder: 'Jump to a section, open a project, copy my email…',
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
    location: '東京都、日本',
    student: '東海大学 情報通信学部',
    introParagraphs: [
      // Japanese takes no inter-word spaces, but JSX condenses a newline that
      // falls mid-text into one — so these lines must break only where they sit
      // next to a tag (those newlines are dropped) or not at all. Breaking after
      // 「机上の要件から」 rendered 「机上の要件から 推測するのではなく」.
      <>
        東海大学情報通信学部3年の<b>フルスタック開発者</b>です。使う人のそばで、机上の要件から推測するのではなく、その場で作りながら形にしていく<b>フォワードデプロイドエンジニア</b>になりたいと考えています。
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
      placeholder: 'セクションへ移動、プロジェクトを開く、メールをコピー…',
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

const projects = [
  {
    title: 'Ledger',
    slug: 'ledger',
    tags: ['AI', 'Python', 'React', 'TypeScript', 'AWS'],
    badge: 'AI pipeline',
    badgeJa: 'AIパイプライン',
    image: '/media/projects/ledger-en.jpg',
    imageJa: '/media/projects/ledger-ja.jpg',
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
        { value: '100%', label: { en: 'exact accuracy, all 966 rows correct', ja: '完全一致率（全966行が正解）' } },
        { value: '47', label: { en: 'annual reports tested across 10 companies', ja: '10社・47件の年次報告書で検証' } },
        { value: '31s', label: { en: 'average time per report, end to end', ja: '1件あたりの平均処理時間' } },
        { value: '90%', label: { en: 'fewer tokens than sending the whole report', ja: '文書全体を渡す場合より少ないトークン' } },
      ],
      // Same cohort as the highlights: Gemini 3.7 Flash, the 46 reports every
      // method processed, mean per report (re-derived 2026-09-24 from
      // /api/benchmark-runs). One chart per measure; they never share an axis.
      benchmark: {
        caption: {
          en: 'Mean per report on the 46 annual reports all three methods processed, with the same model (Gemini 3.7 Flash). From Ledger\'s published benchmark runs.',
          ja: '3つの方式すべてが処理した46件の年次報告書での1件あたり平均（同一モデル Gemini 3.7 Flash）。Ledgerが公開しているベンチマーク実行結果より。',
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
        en: 'Annual reports run past a hundred pages, and the balance sheet is a handful of them. Sending the whole PDF to a model is slow, expensive and gives it more places to pick the wrong number. Ledger reads the report locally with Firecrawl\'s pdf-inspector, which decides page by page whether the text layer can be trusted or needs OCR. A scoring gate then ranks every page against the fields it is looking for and sends only the best three to five to the model. The model maps those pages to a fixed 27-row asset schema, and the answer is validated and checked arithmetically before anything is scored. I built it as a benchmark, so it also compares four PDF parsers with and without OCR on the same reports and the same model.',
        ja: '年次報告書は100ページを超えますが、貸借対照表はそのうちの数ページです。PDF全体をモデルに渡すと遅く、費用がかかり、間違った数字を拾う余地も増えます。LedgerはFirecrawlのpdf-inspectorで報告書をローカルに読み込み、ページごとにテキスト層を信頼できるか、OCRが必要かを判定します。次にスコアリングゲートが全ページを探している項目と照らして順位付けし、上位3〜5ページだけをモデルに送ります。モデルはそのページを27行の固定スキーマに対応付け、回答は採点前に検証と計算チェックを通ります。ベンチマークとして作ったため、同じ報告書と同じモデルで4種類のPDFパーサーをOCRあり・なしで比較することもできます。',
      },
      features: [
        {
          en: 'pdf-inspector keeps native text where it is readable and sends only the broken pages through local OCR at 200 DPI, so a scanned appendix does not slow down the rest of the report.',
          ja: 'pdf-inspectorは読めるページはそのままのテキストを使い、崩れたページだけを200 DPIのローカルOCRに回します。スキャンされた付録があっても、他のページの処理は遅くなりません。',
        },
        {
          en: 'The page gate scores every page on schema vocabulary, financial headings, tables and numeric density. On a 132-page 3M report it kept 5 pages, and the model saw about 8,500 tokens instead of the whole document.',
          ja: 'ページゲートは、スキーマの語彙、財務の見出し、表、数値の密度で全ページを採点します。132ページある3Mの報告書では5ページだけを残し、モデルが読んだのは文書全体ではなく約8,500トークンでした。',
        },
        {
          en: 'Every answer has to match an exact 27-row contract, then passes balance-sheet identity checks. A low-confidence value stays visible and is flagged for review instead of being hidden.',
          ja: 'すべての回答は27行の厳密な契約に合致する必要があり、その後に貸借対照表の恒等式チェックを通ります。確信度が低い値も隠さずに表示し、レビュー対象として示します。',
        },
        {
          en: 'The answer key never reaches the model. Gold values are tied to the exact PDF by SHA-256, and a reviewer approves them beside the searchable source.',
          ja: '正解データがモデルに渡ることはありません。正解値はSHA-256で特定のPDFに紐づけ、レビュアーが検索可能な原本を見ながら承認します。',
        },
        {
          en: 'Firecrawl finds official reports for any company and year, and each download is screened and pinned before it joins the benchmark corpus.',
          ja: 'Firecrawlで任意の企業と年度の公式報告書を探し、ダウンロードしたファイルは検査と固定を経てからベンチマーク用コーパスに加わります。',
        },
      ],
      flow: {
        en: 'A report comes in as an upload or from the corpus. pdf-inspector classifies each page and extracts Markdown, with OCR only where the text layer fails. The gate scores the complete pages and keeps the top three to five in their original order. One model call maps them to the 27-row schema as JSON. The response is normalized, validated against the contract, checked against the accounting identities and, where a verified answer key exists, scored. Progress streams to the browser live, and every run is stored so it can be inspected or compared later.',
        ja: '報告書はアップロードまたはコーパスから取り込みます。pdf-inspectorが各ページを分類してMarkdownを抽出し、テキスト層が使えないページだけOCRにかけます。ゲートが完全なページを採点し、上位3〜5ページを元の順序のまま残します。モデルを1回呼び出して27行のスキーマにJSONで対応付けます。応答は正規化、契約による検証、会計恒等式のチェックを経て、検証済みの正解がある場合は採点されます。進捗はリアルタイムでブラウザに表示され、すべての実行結果は後から確認・比較できるよう保存されます。',
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
    tags: ['JavaScript', 'Node.js'],
    badge: 'live app',
    badgeJa: '公開中のアプリ',
    image: '/media/projects/webdrop-en.png',
    imageJa: '/media/projects/webdrop-ja.png',
    video: '/media/video/webdrop.mp4',
    icon: Radio,
    live: 'https://web-drop-lyart.vercel.app/',
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
        en: 'I built WebDrop to make nearby file sharing work from a browser. Devices find each other through a small WebSocket signaling service, confirm that they are in the same place with ultrasound, motion, or a QR code, then open a direct WebRTC connection. The server helps with discovery and connection setup, but the file data moves between the devices.',
        ja: 'WebDropは、ブラウザだけで近くの端末へファイルを送るために作ったPWAです。端末は小さなWebSocketシグナリングサービスを通じて互いを見つけ、超音波、端末の動き、またはQRコードで同じ場所にいることを確認します。その後WebRTCで直接接続するため、サーバーは検出と接続設定を助けますが、ファイル本体は端末間を移動します。',
      },
      features: [
        {
          en: 'Nearby devices appear on an orbit-style radar, so the sender can choose a person instead of entering a code.',
          ja: '近くの端末を軌道型のレーダーに表示し、コードを入力せず相手を選べます。',
        },
        {
          en: 'Pairing checks ultrasound and device motion together. A short-lived QR code takes over when those sensors are not available.',
          ja: 'ペアリングでは超音波と端末の動きを組み合わせて確認します。センサーを使えない場合は短時間だけ有効なQRコードに切り替えられます。',
        },
        {
          en: 'Transfers use ordered WebRTC data channels, split files into 256 KB chunks, verify a SHA-256 manifest, and support retry, cancellation, and files up to 500 MB.',
          ja: '転送には順序付きWebRTCデータチャネルを使います。ファイルを256KB単位に分け、SHA-256マニフェストで確認し、再送、キャンセル、最大500MBのファイルに対応します。',
        },
        {
          en: 'Each browser writes data to the best storage option it supports, including OPFS, IndexedDB, StreamSaver, or an in-memory fallback on iOS.',
          ja: 'OPFS、IndexedDB、StreamSaver、iOS向けのメモリ保存から、ブラウザが対応している方法を選んで書き込みます。',
        },
        {
          en: 'The PWA includes English and Japanese UI, an offline shell, and mock peers for testing without the signaling server.',
          ja: '日英UI、オフラインで開くアプリシェル、シグナリングサーバーなしで試せる疑似端末を用意しています。',
        },
      ],
      flow: {
        en: 'The sender discovers a nearby device and starts pairing. WebDrop confirms proximity, exchanges SDP and ICE details through WebSocket signaling, then opens the WebRTC data channels. After that, file chunks travel directly to the receiving browser and are written to local storage.',
        ja: '送信側が近くの端末を見つけてペアリングを始めます。WebDropが近接を確認し、WebSocketシグナリングでSDPとICE情報を交換してから、WebRTCデータチャネルを開きます。その後、ファイルのチャンクは受信側ブラウザへ直接送られ、ローカルストレージに保存されます。',
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
    tags: ['React', 'Swift', 'Node.js'],
    badge: 'in progress',
    badgeJa: '開発中',
    image: '/media/projects/internship-portal-en.jpg',
    imageJa: '/media/projects/internship-portal-ja.jpg',
    video: '/media/video/internship-portal.mp4',
    icon: Target,
    live: 'https://editor-omega-two.vercel.app',
    github: 'https://github.com/MohamedFuad16/resume-studio-dashboard',
    description:
      'A bilingual app for finding internships and keeping every application in one list, on the web and on iOS.',
    descriptionJa:
      'インターンを探し、応募をひとつのリストで管理できる日英対応のWeb・iOSアプリ。',
    tech: ['React', 'SwiftUI', 'Firestore', 'Express', 'Azure'],
    detail: {
      tagline: {
        en: 'A place to search for internships and keep every application in one list, on the web and on iOS.',
        ja: 'インターンを探して、応募をひとつのリストで管理できる場所。WebとiOSの両方で使えます。',
      },
      overview: {
        en: 'Two things sit at the center of the Internship Portal. You search the postings and it scores how well each one matches your profile, and you keep every application in one list that follows it through to a decision. Deadlines go on a calendar, and the résumé you send is written in the same app. It runs as a React web app and a SwiftUI iOS app out of one repository, both fully bilingual, with a shared contracts layer that pins the routes, data shapes and ranking rules so the two clients stay in step. Your own data never reaches my server: the clients read and write Firestore directly under owner-only rules, and the server holds only the shared catalog of postings and a Gmail queue.',
        ja: 'インターンポータルの中心は2つです。求人を検索するとプロフィールとの適合度が採点され、応募は結果が出るまでひとつのリストで管理できます。締切はカレンダーに並び、提出するレジュメも同じアプリで作れます。ひとつのリポジトリからReactのWebアプリとSwiftUIのiOSアプリを提供し、どちらも日英に完全対応しています。共通のコントラクト層がAPIルート、データ構造、並び順のルールを固定し、2つのクライアントの実装を揃えています。自分のデータがサーバーに届くことはありません。クライアントは所有者限定ルールのもとでFirestoreを直接読み書きし、サーバーは共有の求人カタログとGmailのキューだけを持ちます。',
      },
      features: [
        {
          en: 'Search the internship postings and see a match score for each one, worked out from your profile.',
          ja: 'インターン求人を検索でき、それぞれにプロフィールから算出した適合スコアが表示されます。',
        },
        {
          en: 'Every application sits in one tracker and moves through saved, applying, applied, interview, and rejected, so nothing gets lost between browser tabs.',
          ja: '応募はすべてひとつのトラッカーに集まり、「保存・応募準備・応募済み・面接・不採用」と状態が進むので、タブの間で取りこぼすことがありません。',
        },
        {
          en: 'Gmail ingest reads incoming mail and queues what it finds instead of writing it straight in. To flag something it has to quote the email, and the quote is checked against the message, so it is not guessing from a company name.',
          ja: 'Gmail取り込みは受信メールを読み、そのまま書き込まずにキューへ積みます。検出するにはメール本文を引用する必要があり、その引用は元のメッセージと照合されるため、企業名からの推測にはなりません。',
        },
        {
          en: 'The iOS app keeps the tracker on hand away from a desk. It refreshes in the background, syncs Gmail, and sends a notification with the company logo when it spots a new application.',
          ja: 'iOSアプリは机を離れてもトラッカーを手元に置けます。バックグラウンドで更新してGmailを同期し、新しい応募を見つけると企業ロゴ付きの通知を送ります。',
        },
        {
          en: 'The résumé you send is written and previewed in the app, with English templates alongside the two standard Japanese formats.',
          ja: '提出するレジュメはアプリ内で作成してプレビューできます。英語のテンプレートに加え、履歴書のマス目形式と職務経歴書のレイアウトを用意しています。',
        },
      ],
      flow: {
        en: 'A signed-in client reads and writes its own Firestore documents directly, so applications, trackers and profiles never pass through my infrastructure. Anything shared comes from an Express server on Azure Container Apps: the catalog the search runs against, the compile endpoint that returns a finished PDF, and the Gmail queue that each client drains into its own tracker.',
        ja: 'サインイン済みのクライアントは自分のFirestoreドキュメントを直接読み書きするため、応募情報、トラッカー、プロフィールが私のインフラを通ることはありません。共有されるものはAzure Container Apps上のExpressサーバーから届きます。検索の対象となる求人カタログ、完成したPDFを返すコンパイル用エンドポイント、そして各クライアントが自分のトラッカーへ取り込むGmailのキューです。',
      },
      architecture: [
        { label: { en: 'Find', ja: '探す' }, detail: { en: 'Search the shared catalog', ja: '共有カタログを検索' } },
        { label: { en: 'Track', ja: '管理' }, detail: { en: 'Saved through to interview', ja: '保存から面接まで' } },
        { label: { en: 'Your data', ja: '自分のデータ' }, detail: { en: 'Firestore, owner-only', ja: 'Firestore・所有者限定' } },
        { label: { en: 'Shared server', ja: '共有サーバー' }, detail: { en: 'Express on Azure', ja: 'Azure上のExpress' } },
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
          title: { en: 'Express on Azure', ja: 'Azure上のExpress' },
          sub: { en: 'Catalog, compile, Gmail queue', ja: 'カタログ・コンパイル・Gmail' },
          edge: { en: 'compile', ja: 'コンパイル' },
          branch: {
            title: { en: 'Gmail ingest', ja: 'Gmail取り込み' },
            edge: { en: 'queued', ja: 'キュー' },
          },
        },
        {
          kind: 'store',
          title: { en: 'Tectonic to PDF', ja: 'TectonicでPDF化' },
          sub: { en: 'EN and JA LaTeX templates', ja: '日英LaTeXテンプレート' },
        },
      ],
    },
  },
  {
    title: 'CCFT',
    slug: 'ccft',
    tags: ['AI', 'Swift'],
    badge: 'multi-agent runtime',
    badgeJa: 'マルチエージェント実行基盤',
    image: '/media/projects/ccft.jpg',
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
        { value: '20', label: { en: 'guardrail rules on every tool call', ja: 'すべてのツール呼び出しに適用するガードレール' } },
        { value: '11', label: { en: 'failure cases tested, each with a control', ja: '対照付きで検証した障害ケース' } },
        { value: '133', label: { en: 'tests in the macOS app', ja: 'macOSアプリのテスト数' } },
        { value: '2.8k', label: { en: 'tokens in a typical worker brief', ja: 'ワーカー1件あたりの指示トークン' } },
      ],
      overview: {
        en: 'I wanted parallel sub-agents I could actually trust with a real repository. In CCFT you talk to one model, the leader, and it never does the work itself. It writes the job as a task graph, where each node has a role, the files it may touch, what it depends on and how it will be checked. A runtime scheduler then sends every node whose dependencies are done out as a wave of workers running at the same time, within what each account can carry. Workers only see a compiled brief for their own task, answer in a typed contract, and a node is accepted only after its checks pass. Hooks enforce each role on every tool call. The native SwiftUI app shows the conversation, the task checklist and every worker side by side.',
        ja: '実際のリポジトリを安心して任せられる並列サブエージェントが欲しくて作りました。CCFTではリーダーとなる一つのモデルと会話し、リーダー自身は作業をしません。仕事をタスクグラフとして書き出し、各ノードに役割、触れてよいファイル、依存関係、検証方法を持たせます。ランタイムスケジューラは依存が完了したノードをまとめて一つのウェーブとし、各アカウントが処理できる範囲でワーカーを同時に走らせます。ワーカーは自分のタスク用にまとめられた指示だけを受け取り、型付きの契約で回答し、ノードはチェックを通って初めて受理されます。役割はすべてのツール呼び出しでフックが強制します。ネイティブのSwiftUIアプリでは、会話、タスクのチェックリスト、各ワーカーを並べて確認できます。',
      },
      features: [
        {
          en: 'The graph is validated before anything runs. Two nodes that would write the same file at once are refused, and a node with nothing checkable is sent back with the exact field to add.',
          ja: '実行前にグラフを検証します。同じファイルを同時に書き込む2つのノードは拒否され、検証できる項目がないノードは追加すべき項目を示して差し戻されます。',
        },
        {
          en: 'The scheduler reserves capacity per account before each dispatch, so a wave never asks a connection for more than its quota allows, and a dead run gives its reservation back.',
          ja: 'スケジューラは送信前にアカウントごとに枠を確保するため、ウェーブが接続先のクォータを超えることはなく、停止した実行は確保した枠を返します。',
        },
        {
          en: 'A failed report ends the attempt and takes one of three routes: retry with the failure in the handoff, replan the graph, or continue. Every refusal names the node, the field and the command to run next.',
          ja: '失敗した報告はその試行を終了させ、失敗内容を引き継いだ再試行、グラフの再計画、続行のいずれかに進みます。拒否には必ず対象ノード、項目、次に実行するコマンドが示されます。',
        },
        {
          en: 'Hooks enforce roles on every call. The leader cannot write product code, workers cannot write outside their allowed paths, and no model can edit CCFT\'s own control files.',
          ja: 'フックがすべての呼び出しで役割を強制します。リーダーはプロダクトコードを書けず、ワーカーは許可されたパスの外に書き込めず、どのモデルもCCFT自身の制御ファイルを編集できません。',
        },
        {
          en: 'Workers can come from different accounts and models, such as Claude, Codex, GLM or Grok, and the app shows each connection\'s quota before it is offered work.',
          ja: 'ワーカーにはClaude、Codex、GLM、Grokなど異なるアカウントとモデルを使えます。アプリは作業を割り当てる前に各接続のクォータを表示します。',
        },
      ],
      flow: {
        en: 'You describe the job in the app. The leader registers a task graph and asks the controller what to do next. The controller answers with the ready nodes, the worker type for each and the exact calls to make, and the leader makes only those calls. Each worker starts from its compiled brief plus the accepted reports of the nodes it depends on, and returns a JSON contract. CCFT validates it and runs the node\'s checks. Accepted nodes unlock the next wave, failed ones are retried or replanned, and when the last node is accepted the leader answers you.',
        ja: 'アプリで仕事を伝えると、リーダーがタスクグラフを登録し、次に何をすべきかをコントローラーに尋ねます。コントローラーは実行可能なノード、それぞれのワーカー種別、実行すべき呼び出しを返し、リーダーはその呼び出しだけを行います。各ワーカーはまとめられた指示と依存ノードの受理済み報告から作業を始め、JSONの契約で結果を返します。CCFTがそれを検証してノードのチェックを実行します。受理されたノードは次のウェーブを解放し、失敗したノードは再試行または再計画され、最後のノードが受理されるとリーダーが回答します。',
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
    tags: ['AI', 'React', 'TypeScript'],
    badge: 'long-term project',
    badgeJa: '長期プロジェクト',
    image: '/media/projects/tutor-en.png',
    imageJa: '/media/projects/tutor-ja.png',
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
        en: 'I built Tutor for studying papers and textbooks without losing track of where an answer came from. A learner can upload PDFs, ask questions by text or voice, and turn useful sessions into revision material. The app stores books, evidence, concepts, corrections, and model runs as local records, so its memory can be inspected instead of being hidden inside a chat model.',
        ja: 'Tutorは、回答の根拠を見失わずに論文や教科書を学ぶためのワークスペースです。PDFを取り込み、テキストまたは音声で質問し、役立った対話を復習教材に変えられます。書籍、根拠、概念、訂正、モデル実行履歴をローカルの記録として保存するため、学習メモリをチャットモデルの中に隠さず確認できます。',
      },
      features: [
        {
          en: 'Before answering, Tutor builds a context packet from the current PDF page, selected text, earlier messages, retrieved evidence, and the learner state.',
          ja: '回答前に、現在のPDFページ、選択した文章、過去の対話、検索した根拠、学習者の状態からコンテキストを組み立てます。',
        },
        {
          en: 'Chat responses stream into the study view with citations, Markdown, diagrams, math, code, and optional text-to-speech.',
          ja: '引用、Markdown、図、数式、コードを含む回答を学習画面へストリーミングし、必要に応じて読み上げます。',
        },
        {
          en: 'Voice mode uses Deepgram through a local broker, while the same tutor context keeps the spoken and typed sessions connected.',
          ja: '音声モードはローカルブローカー経由でDeepgramを使い、テキストと音声の対話で同じ学習コンテキストを共有します。',
        },
        {
          en: 'Quick explanations come back straight away, while slower retrieval and tool work run as background jobs tied to the request, so you can see afterwards what they did.',
          ja: 'すぐに返せる説明はその場で返し、検索やツール処理はリクエストに紐づくバックグラウンドジョブとして動くので、後から何をしたのかを確認できます。',
        },
        {
          en: 'Durable learner data stays in user-scoped SQLite and files. Dexie keeps the lighter browser-side cache and the interface state.',
          ja: '学習データはユーザー単位のSQLiteとファイルに保存し、Dexieはブラウザ側の軽いキャッシュと画面状態を管理します。',
        },
      ],
      flow: {
        en: 'The learner opens a local profile, adds PDFs to a book, and asks a question by chat or voice. Tutor gathers the relevant page, earlier discussion, evidence, and learner state before sending the request to the tutor that answers straight away. Slow jobs continue in the background, and the useful results are saved as evidence, artifacts, or revision material for that learner.',
        ja: '学習者がローカルプロフィールを開き、PDFを書籍に追加して、チャットまたは音声で質問します。Tutorは関連ページ、過去の対話、根拠、学習状態を集めて、すぐに応答するチューターへ渡します。時間のかかる処理はバックグラウンドで続き、結果はその学習者の根拠、成果物、復習教材として保存されます。',
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
    tags: ['React', 'AWS'],
    badge: 'student PWA',
    badgeJa: '学生向けPWA',
    image: '/media/projects/tokaihub-en.png',
    imageJa: '/media/projects/tokaihub-ja.png',
    video: '/media/video/tokaihub.mp4',
    icon: Smartphone,
    live: 'https://tokaihub.mohamedfuad.com/',
    github: 'https://github.com/MohamedFuad16/TokaiHub',
    description:
      'A bilingual Tokai University student portal backed by Cognito, Lambda, and DynamoDB.',
    descriptionJa:
      'Cognito、Lambda、DynamoDBで動く東海大学の学生ポータル。日本語と英語に対応しています。',
    tech: ['React', 'Tailwind', 'Amplify', 'Cognito', 'Vite'],
    detail: {
      tagline: {
        en: 'One place on a phone for the university things a student checks every week.',
        ja: 'スマートフォンから、毎週確認する大学の手続きをまとめて開ける場所です。',
      },
      overview: {
        en: 'I built TokaiHub around the routines students repeat every week: checking a schedule, finding course information, managing enrollment, and updating a profile. It runs as an installable React PWA in English and Japanese. Authentication and the student data live on AWS, while the interface stays focused on quick mobile use.',
        ja: 'TokaiHubは、時間割の確認、授業情報の検索、履修管理、プロフィール更新など、学生が毎週行う操作を一つにまとめたReact PWAです。英語と日本語に対応し、インストールして使えます。認証と学生データはAWSで管理し、画面はスマートフォンですばやく操作できるように設計しています。',
      },
      features: [
        {
          en: 'Signing in happens on a form inside the app rather than on a Cognito-hosted page. Student IDs are the real usernames, and an email address works as an alias for them.',
          ja: 'Cognitoのホスト画面へ移動せず、アプリ内のフォームでログインできます。内部では学籍番号をユーザー名に使い、メールアドレスでもログインできます。',
        },
        {
          en: 'Registration sends a verification code through Cognito and SES, then completes the confirmation step inside the onboarding flow.',
          ja: '登録時はCognitoとSESから確認コードを送り、オンボーディング画面の中で認証を完了します。',
        },
        {
          en: 'Lambda functions handle schedules, dashboard summaries, course lookup, enrollment, and profile updates.',
          ja: '時間割、ダッシュボード集計、授業検索、履修、プロフィール更新をLambda関数で処理します。',
        },
        {
          en: 'DynamoDB stores student profiles, the course catalog, enrollment records, and schedule data in a single-table model.',
          ja: '学生プロフィール、授業一覧、履修記録、時間割をDynamoDBのシングルテーブル設計で保存します。',
        },
        {
          en: 'Onboarding collects campus, course and GPA. The rest of the app is available in English and Japanese, in a light or a dark theme.',
          ja: 'オンボーディングでキャンパス、コース、GPAを登録します。アプリ全体が日英表示に対応し、ライトとダークのテーマを選べます。',
        },
      ],
      flow: {
        en: 'The React PWA signs the student in through Cognito and sends authenticated requests to Lambda. Each function handles one part of the portal, such as schedules or enrollment, and reads or writes the matching records in DynamoDB. Cognito lifecycle triggers also prepare the student profile after registration.',
        ja: 'React PWAがCognitoで学生を認証し、認証済みのリクエストをLambdaへ送ります。各Lambda関数が時間割や履修などの処理を担当し、DynamoDBの対象レコードを読み書きします。登録後の学生プロフィール作成にはCognitoのライフサイクルトリガーも使います。',
      },
      architecture: [
        { label: { en: 'React PWA', ja: 'React PWA' }, detail: { en: 'Bilingual mobile UI', ja: '日英モバイルUI' } },
        { label: { en: 'Cognito', ja: 'Cognito' }, detail: { en: 'Identity and OTP', ja: '認証とOTP' } },
        { label: { en: 'Lambda API', ja: 'Lambda API' }, detail: { en: 'Portal workflows', ja: 'ポータル処理' } },
        { label: { en: 'DynamoDB', ja: 'DynamoDB' }, detail: { en: 'Student and course data', ja: '学生・授業データ' } },
      ],
      stack: [
        {
          kind: 'terminal',
          title: { en: 'Student opens PWA', ja: '学生がPWAを開く' },
          sub: { en: 'React + Tailwind, EN / JA', ja: 'React + Tailwind / 日英' },
          edge: { en: 'sign in', ja: 'サインイン' },
        },
        {
          kind: 'decision',
          title: { en: 'Signed in?', ja: '認証済み？' },
          edge: { en: 'yes', ja: 'はい' },
          branch: {
            title: { en: 'Cognito email OTP', ja: 'Cognitoメール認証' },
            edge: { en: 'no', ja: 'いいえ' },
          },
        },
        {
          title: { en: 'Lambda API', ja: 'Lambda API' },
          sub: { en: 'Schedule, courses, profile', ja: '時間割・授業・プロフィール' },
          edge: { en: 'query', ja: 'クエリ' },
        },
        {
          kind: 'store',
          title: { en: 'DynamoDB', ja: 'DynamoDB' },
          sub: { en: 'Single-table student data', ja: 'シングルテーブルの学生データ' },
        },
      ],
    },
  },
  {
    title: 'ClaudeShot',
    slug: 'claudeshot',
    tags: ['Swift'],
    badge: 'macOS utility',
    badgeJa: 'macOSユーティリティ',
    image: '/media/projects/claudeshot.svg',
    icon: Camera,
    github: 'https://github.com/MohamedFuad16/ClaudeShot',
    description:
      'A native macOS shortcut that captures the frontmost window and pastes it into Claude.',
    descriptionJa:
      '最前面のウィンドウを撮影し、そのままClaudeへ貼り付けるmacOSネイティブツール。',
    tech: ['SwiftUI', 'ScreenCaptureKit', 'AppKit', 'Carbon', 'macOS'],
    detail: {
      tagline: {
        en: 'Press one shortcut to move the window in front of you straight into a Claude conversation.',
        ja: 'ショートカット一つで、目の前のウィンドウをClaudeの会話へ送れます。',
      },
      overview: {
        en: 'I built ClaudeShot to remove the small interruptions between seeing something on screen and asking Claude about it. Shift + Command + 1 captures only the frontmost window, places the PNG on the clipboard, opens Claude, and pastes it into the active conversation. It stays in the menu bar and uses macOS frameworks throughout, so there is no upload service or extra account to manage.',
        ja: 'ClaudeShotは、画面で見つけた内容をClaudeへ相談するまでの細かな手間をなくすために作りました。Shift + Command + 1を押すと最前面のウィンドウだけを撮影し、PNGをクリップボードへ保存してClaudeを開き、現在の会話へ貼り付けます。メニューバーに常駐し、macOS標準フレームワークだけで動くため、別のアップロードサービスやアカウントは不要です。',
      },
      features: [
        {
          en: 'The global Shift + Command + 1 shortcut works from any app without bringing ClaudeShot to the front.',
          ja: 'Shift + Command + 1のグローバルショートカットは、どのアプリを使っていても動作します。',
        },
        {
          en: 'ScreenCaptureKit targets the frontmost window, so the screenshot excludes the desktop and unrelated windows.',
          ja: 'ScreenCaptureKitで最前面のウィンドウだけを対象にし、デスクトップや無関係な画面を除外します。',
        },
        {
          en: 'The capture is copied as a PNG, then AppKit activates Claude and sends the paste command automatically.',
          ja: '撮影した画像をPNGとしてコピーし、AppKitでClaudeを前面に出して自動的に貼り付けます。',
        },
        {
          en: 'A short flash and a settling animation confirm the capture without opening a separate window.',
          ja: '短いフラッシュと収束アニメーションで、別ウィンドウを開かずに撮影完了を伝えます。',
        },
        {
          en: 'The menus are in English and Japanese, it can start at login, and the capture sound can be changed or switched off.',
          ja: 'メニューは日英に対応し、ログイン時の自動起動に対応し、撮影音は変更もオフもできます。',
        },
      ],
      flow: {
        en: 'Carbon listens for the global shortcut. ClaudeShot then asks ScreenCaptureKit for the frontmost window, renders it as a PNG, and writes the image to the macOS pasteboard. AppKit activates Claude and sends Command + V, leaving the screenshot ready for the next prompt.',
        ja: 'Carbonがグローバルショートカットを受け取ると、ScreenCaptureKitで最前面のウィンドウを取得し、PNGとしてmacOSのペーストボードへ書き込みます。その後AppKitでClaudeを起動してCommand + Vを送り、次のプロンプトに画像を使える状態にします。',
      },
      architecture: [
        { label: { en: 'Shortcut', ja: 'ショートカット' }, detail: { en: 'Carbon hotkey', ja: 'Carbonホットキー' } },
        { label: { en: 'Capture', ja: '撮影' }, detail: { en: 'ScreenCaptureKit', ja: 'ScreenCaptureKit' } },
        { label: { en: 'Clipboard', ja: 'クリップボード' }, detail: { en: 'PNG pasteboard item', ja: 'PNGペーストボード' } },
        { label: { en: 'Claude', ja: 'Claude' }, detail: { en: 'Activate and paste', ja: '起動して貼り付け' } },
      ],
      stack: [
        {
          kind: 'terminal',
          title: { en: 'Global hotkey', ja: 'グローバルホットキー' },
          sub: { en: 'Carbon event handler', ja: 'Carbonイベント' },
          edge: { en: 'trigger', ja: '起動' },
          branch: {
            title: { en: 'Menu bar item', ja: 'メニューバー項目' },
            edge: { en: 'or', ja: 'または' },
          },
        },
        {
          title: { en: 'Capture region', ja: '範囲をキャプチャ' },
          sub: { en: 'ScreenCaptureKit', ja: 'ScreenCaptureKit' },
          edge: { en: 'PNG', ja: 'PNG' },
        },
        {
          kind: 'store',
          title: { en: 'Clipboard', ja: 'クリップボード' },
          sub: { en: 'NSPasteboard item', ja: 'NSPasteboard項目' },
          edge: { en: 'activate', ja: 'アクティブ化' },
        },
        {
          kind: 'terminal',
          title: { en: 'Claude', ja: 'Claude' },
          sub: { en: 'Paste and send', ja: '貼り付けて送信' },
        },
      ],
    },
  },
];

// Filter chips, in the order they appear above the cards. Only tags that at
// least one project carries are shown, so a chip can never lead to nothing.
const PROJECT_TAGS = ['AI', 'React', 'TypeScript', 'JavaScript', 'Python', 'Swift', 'Node.js', 'AWS'].filter(
  (tag) => projects.some((project) => project.tags?.includes(tag))
);
// Skill pills whose label names a filter differently.
const SKILL_TAG = { NodeJS: 'Node.js' };
const skillTag = (label) => {
  const tag = SKILL_TAG[label] || label;
  return PROJECT_TAGS.includes(tag) ? tag : null;
};

// Cmd/Ctrl+K menu. Every entry does something a visitor can already do
// somewhere on the page; this only makes it reachable from the keyboard.
function CommandMenu({ open, onClose, items, t }) {
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const returnFocusRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    returnFocusRef.current = document.activeElement;
    setQuery('');
    setCursor(0);
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      cancelAnimationFrame(frame);
      returnFocusRef.current?.focus?.({ preventScroll: true });
    };
  }, [open]);

  const needle = query.trim().toLowerCase();
  const matches = needle
    ? items.filter((item) => `${item.label} ${item.group} ${item.keywords || ''}`.toLowerCase().includes(needle))
    : items;

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [cursor, needle]);

  if (!open) return null;

  const run = (item) => {
    onClose();
    // Let the dialog unmount (and focus return) before the action scrolls or navigates.
    requestAnimationFrame(() => item.run());
  };

  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setCursor((index) => Math.min(matches.length - 1, index + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setCursor((index) => Math.max(0, index - 1));
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
    <div className="command-backdrop" onPointerDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="command-menu" role="dialog" aria-modal="true" aria-label={t.command.label} onKeyDown={onKeyDown}>
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
          aria-expanded="true"
          aria-controls="command-list"
          aria-activedescendant={matches[cursor] ? `command-${matches[cursor].id}` : undefined}
        />
        <ul className="command-list" id="command-list" role="listbox" ref={listRef}>
          {matches.length === 0 && <li className="command-empty">{t.command.empty}</li>}
          {matches.map((item, index) => {
            const heading = item.group !== lastGroup ? item.group : null;
            lastGroup = item.group;
            const Icon = item.icon;
            return (
              <React.Fragment key={item.id}>
                {heading && (
                  <li className="command-group" role="presentation">
                    {heading}
                  </li>
                )}
                <li
                  id={`command-${item.id}`}
                  role="option"
                  aria-selected={index === cursor}
                  className={index === cursor ? 'on' : ''}
                  onPointerMove={() => setCursor(index)}
                  onClick={() => run(item)}
                >
                  {Icon && <Icon size={15} aria-hidden="true" />}
                  <span>{item.label}</span>
                  {item.hint && <kbd>{item.hint}</kbd>}
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

// One drawing for both states: in dark mode the rays fold in and a mask
// slides across the disc to leave a crescent; in light mode it reverses.
// Driven entirely by CSS off <html data-theme>, which public/theme-init.js
// sets before first paint.
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

function ProjectFilters({ active, onChange, t }) {
  return (
    <div className="project-filters" role="group" aria-label={t.filterLabel}>
      {[null, ...PROJECT_TAGS].map((tag) => {
        const count = tag ? projects.filter((project) => project.tags?.includes(tag)).length : projects.length;
        return (
          <button
            key={tag || 'all'}
            type="button"
            className={active === tag ? 'on' : ''}
            aria-pressed={active === tag}
            onClick={() => onChange(tag)}
          >
            {tag || t.filterAll}
            <span>{count}</span>
          </button>
        );
      })}
    </div>
  );
}

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
function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (event) => setReduced(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

function SectionTitle({ children, mascot }) {
  return (
    <h2 className="section-title" data-daijin-title={mascot}>
      {children}
    </h2>
  );
}

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
        <path className="sig-name" d={signaturePath} strokeWidth={signatureStrokeWidth} />
        <path className="sig-trace" d={signaturePath} strokeWidth={signatureStrokeWidth} />
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

function SkillPill({ skill, onPick, copy }) {
  const Icon = skill.Icon;
  const tag = skillTag(skill.label);
  const body = (
    <>
      <span className="skill-mark">
        <Icon style={{ color: skill.color }} aria-hidden="true" />
      </span>
      <span>{skill.label}</span>
    </>
  );
  // A skill that some project uses doubles as a shortcut to those projects.
  return (
    <li className="skill" aria-hidden={copy || undefined}>
      {tag ? (
        <button type="button" className="skill-link" onClick={() => onPick(tag)} tabIndex={copy ? -1 : undefined}>
          {body}
        </button>
      ) : (
        body
      )}
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
              <strong>{figure.value}</strong>
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

function ProjectCard({ project, t, locale, onOpen, hidden }) {
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
    <article className={`project project-${project.slug} dashed`} hidden={hidden}>
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
        <img src={image} alt={t.a11y.preview(project.title)} />
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

function ProjectArchitecture({ steps, locale }) {
  const pick = (value) => (locale === 'ja' ? value.ja : value.en);
  return (
    <ol className="pd-map" style={{ '--map-columns': steps.length }}>
      {steps.map((step, index) => (
        <li className="pd-map-step" key={step.label.en}>
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

// Excalidraw's own default swatches, mapped one per stage role so the
// diagram reads as a family the same way the user's reference does (each
// step's own color carrying through its box outline and subtitle).
const FLOW_TONE = {
  terminal: '#2f9e44', // green — entry / exit points
  process: '#1971c2', // blue — the default "does work" step
  decision: '#e8590c', // orange — a branch point
  store: '#9c36b5', // violet — where data comes to rest
};

function FlowBox({ x, y, w, h, kind, title, sub, geo }) {
  const cx = x + w / 2;
  const gap = geo.subSize + 3;
  const tone = FLOW_TONE[kind] || FLOW_TONE.process;
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
      <g style={{ '--fc-tone': tone }}>
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
      <g style={{ '--fc-tone': tone }}>
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
    <g style={{ '--fc-tone': tone }}>
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

function ProjectFlowChart({ stages, locale, label }) {
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

function ProjectDetailView({ project, t, locale, onClose, viewRef, originMarkup }) {
  const Icon = project.icon;
  const d = project.detail;
  const pick = (obj) => (locale === 'ja' ? obj.ja : obj.en);
  const image = locale === 'ja' && project.imageJa ? project.imageJa : project.image;
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
      <div className="project-detail-inner">
        <button type="button" className="pd-back pd-animate" onClick={onClose}>
          <ArrowLeft size={16} />
          {t.back}
        </button>

        <header className="pd-hero">
          <div className="pd-shot pd-animate">
            <img src={image} alt={t.a11y.preview(project.title)} />
            <span>{badgeLabel(project, locale)}</span>
          </div>
          <div className="pd-headline pd-animate">
            <h1>
              <span>{project.title}</span>
              <Icon size={22} />
            </h1>
            <p className="pd-tagline">{pick(d.tagline)}</p>
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
        </header>

        {d.highlights && (
          <section className="pd-block pd-animate pd-reveal">
            <h2 className="pd-h">{t.figures}</h2>
            <ol className="pd-figures">
              {d.highlights.map((figure) => (
                <li key={figure.label.en}>
                  <strong>{figure.value}</strong>
                  <span>{pick(figure.label)}</span>
                </li>
              ))}
            </ol>
            {d.benchmark && <BenchmarkBars benchmark={d.benchmark} locale={locale} />}
          </section>
        )}

        <section className="pd-block pd-animate pd-reveal">
          <h2 className="pd-h">{t.overview}</h2>
          <p className="pd-overview">{pick(d.overview)}</p>
          {d.status && <p className="pd-status">{pick(d.status)}</p>}
        </section>

        <section className="pd-block pd-animate pd-reveal">
          <h2 className="pd-h">{t.keyFeatures}</h2>
          <ul className="pd-features">
            {d.features.map((f, i) => (
              <li key={i}>{pick(f)}</li>
            ))}
          </ul>
        </section>

        {d.flow && (
          <section className="pd-block pd-animate pd-reveal">
            <h2 className="pd-h">{t.howItWorks}</h2>
            <p className="pd-overview">{pick(d.flow)}</p>
          </section>
        )}

        {d.architecture && (
          <section className="pd-block pd-animate pd-reveal">
            <h2 className="pd-h">{t.systemMap}</h2>
            <ProjectArchitecture steps={d.architecture} locale={locale} />
          </section>
        )}

        {d.stack && (
          <section className="pd-block pd-animate pd-reveal">
            <h2 className="pd-h">{t.architecture}</h2>
            <ProjectFlowChart stages={d.stack} locale={locale} label={t.architecture} />
          </section>
        )}

        <section className="pd-block pd-animate pd-reveal">
          <h2 className="pd-h">{t.techHeading}</h2>
          <div className="tags">
            {project.tech.map((tech) => (
              <span key={tech}>{tech}</span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default function App() {
  const [locale, setLocale] = useState(() => {
    const saved = window.localStorage.getItem('portfolio-locale');
    if (saved === 'en' || saved === 'ja') return saved;
    return navigator.language?.toLowerCase().startsWith('ja') ? 'ja' : 'en';
  });
  const [burst, setBurst] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [clickBursts, setClickBursts] = useState([]);
  const [route, setRoute] = useState(() => window.location.hash);
  const [shownProject, setShownProject] = useState(null);
  const [mascotScene, setMascotScene] = useState({ clip: 'playful', scene: 'profile' });
  const [projectTag, setProjectTag] = useState(null);
  // public/theme-init.js has already set <html data-theme> before this
  // bundle ran (saved choice, else the system setting), so start from that
  // and there is no dark-then-light flash on first paint.
  const [theme, setTheme] = useState(() =>
    document.documentElement.dataset.theme === 'light' ? 'light' : 'dark'
  );
  // Nothing saved yet means the visitor never chose, so keep following the
  // system if it changes while the page is open.
  const [themeChosen, setThemeChosen] = useState(() => {
    try {
      return Boolean(window.localStorage.getItem('portfolio-theme'));
    } catch {
      return false;
    }
  });
  const [commandOpen, setCommandOpen] = useState(false);
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
  const openProject = (slug, trigger) => {
    const mobile = window.matchMedia('(max-width: 640px)').matches;
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
  const closeProject = () => {
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
    window.localStorage.setItem('portfolio-locale', locale);
    // `index.html` ships `lang="en"`, so without this a Japanese visitor gets a
    // fully translated page that still declares itself English — screen readers
    // then read Japanese with an English voice.
    document.documentElement.lang = locale === 'ja' ? 'ja' : 'en';
  }, [locale]);

  useEffect(() => {
    if (!import.meta.env.PROD) return;
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
        gsap
          .timeline({ defaults: { ease, clearProps: 'transform,opacity' } })
          .from('.profile', { y: 24, opacity: 0, scale: 0.97, duration: 0.65 })
          .from('.intro', { y: 20, opacity: 0, duration: 0.55 }, '-=0.35')
          .from('.actions', { y: 16, opacity: 0, duration: 0.5 }, '-=0.3');

        // Name flourish: characters rise in, then the split reverts so the
        // DOM goes back to plain text (safe for React re-renders).
        const split = new SplitText('.name-text', { type: 'chars' });
        gsap.from(split.chars, {
          y: 16,
          opacity: 0,
          rotation: 6,
          duration: 0.5,
          stagger: 0.035,
          delay: 0.2,
          ease: 'back.out(1.6)',
          onComplete: () => split.revert(),
        });

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

        // Signature: single continuous "hello"-style pen gesture draws itself
        // in on scroll, then a glowing highlight keeps tracing the handwriting
        // forever — a soft light travelling along the whole stroke, back and
        // forth. (No pin — the pin spacer left a big blank gap on desktop.)
        gsap.set('.signature .sig-name', { drawSVG: 0 });
        gsap.set('.signature .sig-trace', { drawSVG: '0% 15%', opacity: 1 });

        // Draw the name once as it scrolls in, then leave it dimmed.
        gsap.to('.signature .sig-name', {
          drawSVG: '100%',
          opacity: 0.42,
          duration: 2.6,
          ease: 'power1.inOut',
          scrollTrigger: { trigger: '.signature-wrap', start: 'top 88%' },
        });

        // Perpetual tracing highlight — created paused and only allowed to run
        // while the signature is on screen. A filtered path that re-rasterises
        // every frame is the main jank cost on weaker (Android) GPUs, so we
        // never spend it off-screen.
        const traceLoop = gsap.fromTo(
          '.signature .sig-trace',
          { drawSVG: '0% 15%' },
          {
            drawSVG: '85% 100%',
            duration: 2.9,
            ease: 'sine.inOut',
            repeat: -1,
            yoyo: true,
            paused: true,
          }
        );
        ScrollTrigger.create({
          trigger: '.signature-wrap',
          start: 'top bottom',
          end: 'bottom top',
          onToggle: (self) => (self.isActive ? traceLoop.play() : traceLoop.pause()),
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

        const mascotScenes = [
          { trigger: '.profile', partner: '.avatar-shell', clip: 'playful', scene: 'profile' },
          {
            trigger: '[data-daijin-title="skills"]',
            partner: '[data-daijin-title="skills"]',
            clip: 'clever',
            scene: 'skills',
          },
          {
            trigger: '[data-daijin-title="work"]',
            partner: '[data-daijin-title="work"]',
            clip: 'working',
            scene: 'work',
          },
          {
            trigger: '.contribution',
            partner: '.contribution',
            clip: 'thinking',
            scene: 'contributions',
          },
          {
            trigger: '[data-daijin-title="projects"]',
            partner: '[data-daijin-title="projects"]',
            clip: 'curious',
            scene: 'projects',
          },
          {
            trigger: '[data-daijin-title="thoughts"]',
            partner: '[data-daijin-title="thoughts"]',
            clip: 'listening',
            scene: 'writing',
          },
          {
            trigger: '.contact-card',
            partner: '.contact-card h3',
            clip: 'happy',
            scene: 'contact',
          },
        ];
        const showMascotScene = (scene) => {
          const next = { clip: scene.clip, scene: scene.scene };
          setMascotScene((current) =>
            current.clip === next.clip && current.scene === next.scene ? current : next
          );
          const partner = mainRef.current?.querySelector(scene.partner);
          if (partner && scene.scene !== 'profile') {
            gsap.killTweensOf(partner);
            gsap.fromTo(
              partner,
              { x: -8, rotation: -1.4 },
              {
                x: 0,
                rotation: 0,
                duration: 0.9,
                ease: 'elastic.out(1, 0.42)',
                clearProps: 'transform',
              }
            );
          }
        };
        let mascotSceneStarts = [];
        let mascotSceneIndex = -1;
        const measureMascotScenes = () => {
          mascotSceneStarts = mascotScenes.map((scene) => smoother.offset(scene.trigger, 'top 150px'));
        };
        const syncMascotScene = (scrollPosition) => {
          let nextIndex = 0;
          mascotSceneStarts.forEach((start, index) => {
            if (scrollPosition >= start) nextIndex = index;
          });
          if (nextIndex === mascotSceneIndex) return;
          mascotSceneIndex = nextIndex;
          showMascotScene(mascotScenes[nextIndex]);
        };
        measureMascotScenes();
        ScrollTrigger.create({
          trigger: mainRef.current,
          start: 'top top',
          end: 'bottom bottom',
          onRefresh: (self) => {
            measureMascotScenes();
            syncMascotScene(self.scroll());
          },
          onUpdate: (self) => syncMascotScene(self.scroll()),
        });

        // Daijin is fixed outside the smoothed content, so it is placed every
        // tick from live geometry rather than CSS guesses: beside the photo in
        // the profile scene (positioned so the playful clip's outstretched paw,
        // measured at 93% across and 45% down its frame, lands just inside the
        // photo's left edge), on the left rail otherwise. It eases toward the
        // target instead of jumping, and keeps tracking the photo while the page
        // scrolls.
        const mascotPosition = { x: null, y: null };
        const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        let knockArmed = true;
        const PAW_X = 478 / 512;
        const PAW_Y = 230 / 512;
        const followMascot = () => {
          const mascot = document.querySelector('.daijin-mascot');
          if (!mascot) {
            mascotPosition.x = null;
            return;
          }
          const size = mascot.offsetWidth;
          const width = window.innerWidth;
          let targetX;
          let targetY;
          const photo = mascot.dataset.scene === 'profile' && mainRef.current?.querySelector('.avatar-shell');
          if (photo) {
            const rect = photo.getBoundingClientRect();
            targetX = rect.left + 10 - size * PAW_X;
            targetY = rect.top + rect.height * 0.4 - size * PAW_Y;
          } else {
            const compact = width <= 1000;
            targetX = Math.max(compact ? 32 : 12, width / 2 - (compact ? 428 : 468));
            targetY = compact ? 124 : 108;
          }
          if (mascotPosition.x === null) {
            mascotPosition.x = targetX;
            mascotPosition.y = targetY;
          }
          const ease = 1 - Math.pow(1 - 0.12, gsap.ticker.deltaRatio());
          mascotPosition.x += (targetX - mascotPosition.x) * ease;
          mascotPosition.y += (targetY - mascotPosition.y) * ease;
          mascot.style.transform = `translate3d(${mascotPosition.x.toFixed(2)}px, ${mascotPosition.y.toFixed(2)}px, 0)`;

          // The photo reacts to the paw itself, not to a timer: the knock fires
          // on the frame where the playful reach is at full stretch (frame 20),
          // so image decoding can never put the two out of step. It re-arms
          // once the paw is back down.
          const frame = Number(mascot.dataset.frame);
          if (photo && mascot.dataset.clip === 'playful') {
            if (frame <= 12) knockArmed = true;
            if (knockArmed && frame >= 20 && !reducedMotionQuery.matches) {
              knockArmed = false;
              gsap.killTweensOf(photo);
              gsap
                .timeline()
                .to(photo, { rotation: 7, x: 6, y: -3, duration: 0.16, ease: 'power2.out', transformOrigin: '80% 90%' })
                .to(photo, { rotation: -2, x: -1, y: 0, duration: 0.35, ease: 'power1.inOut' })
                .to(photo, { rotation: 0, x: 0, duration: 1.1, ease: 'elastic.out(1, 0.35)', clearProps: 'transform' });
            }
          }
        };
        gsap.ticker.add(followMascot);

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
          gsap.ticker.remove(followMascot);
          buildingLink?.removeEventListener('click', smoothScroll);
          window.removeEventListener('load', onLoad);
        };
        }
      );
    },
    { scope: mainRef }
  );

  useEffect(() => {
    const handleTap = (event) => {
      // Fire on real taps/clicks only. Using 'click' (not 'pointerdown') means a
      // scroll or drag gesture never triggers the ripple; detail === 0 skips
      // keyboard-activated clicks (which have no meaningful pointer position).
      if (event.detail === 0) return;
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setClickBursts((items) => [...items.slice(-5), { id, x: event.clientX, y: event.clientY }]);
      window.setTimeout(() => {
        setClickBursts((items) => items.filter((item) => item.id !== id));
      }, 1050);
    };

    window.addEventListener('click', handleTap);
    return () => window.removeEventListener('click', handleTap);
  }, []);

  // Hidden cards change the page height, so every ScrollTrigger below the
  // project list has to re-measure.
  useEffect(() => {
    ScrollTrigger.refresh();
  }, [projectTag]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'light' ? '#f6f6f7' : '#0f1011');
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

  useEffect(() => {
    const onKey = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setCommandOpen((value) => !value);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

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
        window.setTimeout(() => scrollToSection(selector), 650);
      },
    })),
    ...projects.map((project) => ({
      id: `project-${project.slug}`,
      group: t.projects,
      label: project.title,
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

  const pickTag = (tag) => {
    setProjectTag(tag);
    const target = document.getElementById('projects');
    const smoother = ScrollSmoother.get();
    if (smoother && target) smoother.scrollTo(target, true, 'top 140px');
    else target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // While the visitor stays at the top, Daijin keeps playing: the reach
  // replays every few seconds instead of happening once.
  useEffect(() => {
    if (reducedMotion || mascotScene.scene !== 'profile') return undefined;
    const timer = window.setTimeout(() => {
      setMascotScene((current) =>
        current.scene === 'profile' ? { ...current, playKey: (current.playKey || 0) + 1 } : current
      );
    }, 5200);
    return () => window.clearTimeout(timer);
  }, [mascotScene, reducedMotion]);

  const handleNameAction = (event) => {
    event.stopPropagation();
    setBurst(false);
    requestAnimationFrame(() => setBurst(true));
    window.setTimeout(() => setBurst(false), 850);
  };

  return (
    <>
      <CommandMenu open={commandOpen} onClose={() => setCommandOpen(false)} items={commandItems} t={t} />
      <div className="page-click-effects" aria-hidden="true">
        {clickBursts.map((item) => (
          <span className="click-burst" key={item.id} style={{ left: item.x, top: item.y }}>
            {Array.from({ length: 3 }).map((_, index) => (
              <i key={index} />
            ))}
          </span>
        ))}
      </div>
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
          src="/media/images/profile.jpg"
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
        />
      )}
      {!shownProject && (
        <DaijinMascot
          clip={mascotScene.clip}
          scene={mascotScene.scene}
          playKey={mascotScene.playKey}
          loop={false}
          reducedMotion={reducedMotion}
        />
      )}
      <div id="smooth-wrapper" ref={smoothWrapperRef}>
        <div id="smooth-content" ref={smoothContentRef}>
          <main ref={mainRef}>
      <section className="profile">
        {/* The beam traces the photo's edge; the QR toggle is a sibling of the
            beam, not a child, so BorderBeam keeps its own clipping and the
            button is never cut off or haloed (ADR-034). */}
        <div
          className="avatar-shell"
        >
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
        <div className={`avatar ${showQr ? 'is-flipped' : ''}`}>
          <div className="avatar-card">
            <div className="avatar-face avatar-front">
              <img
                className="profile-photo"
                src="/media/images/profile.jpg"
                alt="Mohamed Fuad"
                title={t.a11y.viewPhoto}
                onClick={() => setPhotoOpen(true)}
              />
            </div>
            <div className="avatar-face avatar-back">
              <img src="/media/images/linkedin-qr.png" alt={t.a11y.linkedinQr} />
            </div>
          </div>
        </div>
        </BorderBeam>
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
            <span className="name-text">Mohamed Fuad</span>
            <button className={`name-action ${burst ? 'bursting' : ''}`} type="button" onClick={handleNameAction}>
              <Rocket size={19} fill="currentColor" />
              <i />
              <i />
              <i />
            </button>
          </h1>
          <a className="building" href="#projects">
            <span className="building-text">{t.building}</span>
          </a>
          <p className="handle">
            @MohamedFuad16
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
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === 'light' ? t.command.dark : t.command.light}
              title={theme === 'light' ? t.command.dark : t.command.light}
            >
              <SunMoonIcon />
            </button>
            <button
              type="button"
              className="command-trigger"
              onClick={() => setCommandOpen(true)}
              aria-label={t.command.button}
              aria-keyshortcuts="Meta+K Control+K"
            >
              <kbd>{/Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl'}</kbd>
              <kbd>K</kbd>
            </button>
          </p>
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
              <img src="/media/logos/tokai-university.svg" alt="Tokai University" />
              <span>{t.student}</span>
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

      <SectionTitle mascot="skills">{t.skills}</SectionTitle>
      <div className="skills-marquees" aria-label={t.a11y.skillsCarousel}>
        {skillRows.map((row, rowIndex) => (
          <div className="skills-marquee" data-direction={rowIndex === 0 ? 'left' : 'right'} key={rowIndex}>
            <ul className="skills">
              {[...row, ...row, ...row].map((skill, index) => (
                <SkillPill
                  key={`${skill.label}-${rowIndex}-${index}`}
                  skill={skill}
                  onPick={pickTag}
                  // The row repeats three times for the seamless loop; only the
                  // first copy is reachable by keyboard and screen readers.
                  copy={index >= row.length}
                />
              ))}
            </ul>
          </div>
        ))}
      </div>

      <SectionTitle mascot="work">{t.work}</SectionTitle>
      <section className="dashed timeline">
        <div className="line" />
        {experience.map((item) => (
          <ExperienceItem key={item.company} item={item} locale={locale} t={t} />
        ))}
      </section>

      <ContributionGrid t={t} locale={locale} />

      <SectionTitle mascot="projects">{t.projects}</SectionTitle>
      <ProjectFilters active={projectTag} onChange={setProjectTag} t={t} />
      <section className="projects" id="projects">
        {projects.map((project) => (
          <ProjectCard
            key={project.title}
            project={project}
            t={t}
            locale={locale}
            onOpen={openProject}
            hidden={Boolean(projectTag) && !project.tags?.includes(projectTag)}
          />
        ))}
      </section>

      <div className="more-projects-row">
        <a className="view-all-btn" href="https://github.com/MohamedFuad16" target="_blank" rel="noopener noreferrer">
          {t.moreProjects}
          <ArrowUpRight size={17} />
        </a>
      </div>

      <SectionTitle mascot="thoughts">{t.thoughtsTitle}</SectionTitle>
      <section className="dashed blog-content">
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
        <h3>{t.connectTitle}</h3>
        <p>{t.connectText}</p>
        <nav className="contact-links" aria-label={t.a11y.moreContactLinks}>
          <a href="mailto:mohamed.fuad.jp@gmail.com">
            <Mail size={14} />
            {t.email}
          </a>
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

      <footer>
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
