import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';
import { signaturePath, signatureViewBox, signatureStrokeWidth } from './signature-path';
import {
  ArrowLeft,
  ArrowUpRight,
  Bot,
  BriefcaseBusiness,
  Check,
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
import './styles.css';

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, ScrollSmoother, DrawSVGPlugin, SplitText, useGSAP);

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
  qiita: SiQiita,
};

const QIITA_ARTICLE = 'https://qiita.com/mfuad16/items/6ad8a06c395cb3e8f013';

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
    logo: '/assets/jal-favicon.png',
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
    thoughts: 'You really wanna read my notes? Check out my latest',
    thoughtsLink: 'Qiita article',
    thoughtsTail: '.',
    connectTitle: "Let's Connect",
    connectText: 'Feel free to reach out through any of these platforms',
    resume: 'Resume',
    back: 'Back to projects',
    overview: 'Overview',
    keyFeatures: 'Key Features',
    howItWorks: 'How It Works',
    viewDetails: 'View details',
    contribution: (total) => `This year, I shipped ${total} focused contributions`,
    months: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
    less: 'Less',
    more: 'More',
    dayTooltip: (count, dateLabel) => `${count} contribution${count === 1 ? '' : 's'} on ${dateLabel}`,
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
    thoughts: '開発メモを読みたい方は、最新の',
    thoughtsLink: 'Qiita記事',
    thoughtsTail: 'をご覧ください。',
    connectTitle: 'お問い合わせ',
    connectText: '以下のリンクからお気軽にご連絡ください',
    resume: '履歴書',
    back: 'プロジェクト一覧へ戻る',
    overview: '概要',
    keyFeatures: '主な機能',
    howItWorks: '仕組み',
    viewDetails: '詳細を見る',
    contribution: (total) => `今年は ${total} 件の貢献`,
    months: ['7月', '8月', '9月', '10月', '11月', '12月', '1月', '2月', '3月'],
    less: '少',
    more: '多',
    dayTooltip: (count, dateLabel) => `${dateLabel}に${count}件のコントリビューション`,
  },
};

const projects = [
  {
    title: 'WebDrop',
    slug: 'webdrop',
    badge: 'live app',
    image: '/assets/webdrop-site.jpg',
    imageJa: '/assets/webdrop-site-ja.png',
    icon: Radio,
    live: 'https://web-drop-lyart.vercel.app/',
    github: 'https://github.com/MohamedFuad16/WebDrop',
    description:
      'AirDrop-style browser file sharing with bump pairing, ultrasonic Web Audio handshake, WebRTC streams, and OPFS storage.',
    descriptionJa:
      'ブラウザだけで使えるAirDrop風ファイル共有アプリ。バンプペアリング、超音波Web Audioハンドシェイク、WebRTCストリーム、OPFS保存に対応。',
    tech: ['JavaScript', 'WebRTC', 'OPFS', 'Web Audio', 'PWA'],
    detail: {
      tagline: {
        en: 'AirDrop for the open web — proximity-verified, peer-to-peer file transfer in any modern browser.',
        ja: 'オープンウェブのためのAirDrop。近接検証つきのブラウザ完結型P2Pファイル転送。',
      },
      overview: {
        en: 'WebDrop is a mobile-first, zero-build static PWA for AirDrop-style transfers between nearby devices — no install, no account, no cloud upload. Two phones discover each other, prove they are physically close, then stream files directly peer-to-peer over WebRTC. The file bytes never touch a server; the only backend is a lightweight Node signaling + TURN server that brokers the handshake.',
        ja: 'WebDropはビルド不要・モバイルファーストのPWA。インストールもアカウントもクラウドアップロードも不要で、近くの端末同士がAirDrop風にファイルを共有します。2台が互いを検出し、物理的な近さを証明したうえで、WebRTCで直接P2P転送。ファイル本体はサーバーを一切経由せず、バックエンドはハンドシェイクを仲介する軽量なNodeシグナリング＋TURNサーバーのみです。',
      },
      features: [
        {
          en: 'Physical-proximity pairing — an ultrasonic Web Audio handshake (~17.8–19.8 kHz, 4 lanes) plus bump + tilt detection. All three must pass, resisting remote relay.',
          ja: '近接ペアリング — 超音波Web Audioハンドシェイク（約17.8〜19.8kHz・4レーン）に加え、バンプと傾きを検出。3条件すべてを満たす必要があり、遠隔リレーを防ぎます。',
        },
        {
          en: 'QR pairing fallback — scan a short-lived personalized QR code (with the sender’s avatar composited in) when acoustic pairing isn’t available.',
          ja: 'QRフォールバック — 音響ペアリングが使えない場合は、送信者のアバターを合成した短命のパーソナルQRコードをスキャン。',
        },
        {
          en: 'Direct P2P transfer — files stream over WebRTC data channels with a SHA-256 manifest, 256 KB chunking, backpressure, acks, retries and cancel — up to 500 MB per session.',
          ja: '直接P2P転送 — SHA-256マニフェスト、256KBチャンク、バックプレッシャー、ACK、再送、キャンセルに対応し、1セッション最大500MB。',
        },
        {
          en: 'Adaptive storage — automatically picks the best sink per device: IndexedDB chunking, StreamSaver streaming download, or an in-memory Blob fallback for iOS Safari.',
          ja: 'アダプティブ保存 — 端末ごとに最適な保存先（IndexedDB / StreamSaver / メモリBlob）を自動選択。iOS Safariにも対応。',
        },
        {
          en: 'Live transfer HUD & orbital radar — an iPhone-style Dynamic Island shows the pairing ladder and progress, while nearby peers orbit your avatar with swipe-to-send.',
          ja: 'ライブHUDとオービタルレーダー — iPhone風のダイナミックアイランドがペアリングと進捗を表示し、周囲の端末が自分のアバターの周りを回りスワイプで送信。',
        },
        {
          en: 'Installable PWA with an offline mock mode (15 simulated peers) so the whole UI works with no server, plus a full English / 日本語 interface.',
          ja: 'オフラインのモックモード（15台の疑似端末）を備えたインストール可能なPWA。サーバーなしでUI全体が動作し、日英インターフェースに完全対応。',
        },
      ],
      flow: {
        en: 'Discovery → Intent → Verify (proximity ceremony or QR) → Connect (WebRTC SDP/ICE) → Transfer. Control plane is small WebSocket JSON; the data plane is the WebRTC channel — once connected, the server leaves the data path entirely.',
        ja: '検出 → 意図 → 検証（近接セレモニーまたはQR）→ 接続（WebRTCのSDP/ICE）→ 転送。制御はWebSocketの小さなJSON、データはWebRTCチャネル。接続後はサーバーがデータ経路から完全に外れます。',
      },
    },
  },
  {
    title: 'Tutor-System',
    slug: 'tutor-system',
    badge: 'long-term project',
    image: '/assets/tutor-site.jpg',
    imageJa: '/assets/tutor-site-ja.png',
    icon: Sparkles,
    live: 'https://tutor-system-architecture.vercel.app/',
    github: 'https://github.com/MohamedFuad16/Tutor-System',
    description:
      'AI learning app with function-calling tutor tools, realtime voice tutoring, source-aware PDF chat, and learner memory.',
    descriptionJa:
      '関数呼び出し型のチューターツール、リアルタイム音声指導、出典つきPDFチャット、学習者メモリを備えたAI学習アプリ。',
    tech: ['React 19', 'TypeScript', 'OpenRouter', 'Deepgram', 'Dexie'],
    detail: {
      tagline: {
        en: 'A local-first learning system for PDFs, source-aware tutoring, voice mode, and inspectable AI workflows.',
        ja: 'PDF学習・出典つきチュータリング・音声モード・可視化されたAIワークフローを備えたローカルファーストの学習システム。',
      },
      overview: {
        en: 'Tutor is a local-first study workspace for reading papers and textbooks, asking a source-aware tutor questions, speaking with a realtime voice tutor, and turning useful sessions into revision books. The learner brain is not hidden model memory — it is an auditable local system of records: books, PDFs, concepts, evidence, BKT mastery, artifacts, corrections, and model runs.',
        ja: 'Tutorは、論文や教科書を読み、出典を踏まえたチューターに質問し、リアルタイム音声チューターと会話し、学習セッションを復習ノートに変換できるローカルファーストの学習ワークスペースです。学習者の「脳」は隠れたモデル記憶ではなく、書籍・PDF・概念・エビデンス・BKT習熟度・成果物・修正・モデル実行履歴という監査可能なローカル記録です。',
      },
      features: [
        {
          en: 'Source-aware tutoring — builds a per-user context packet from PDFs, selected text, the current page, prior discussion, semantic memory, and learner state before answering.',
          ja: '出典対応チュータリング — 回答前に、PDF・選択テキスト・現在ページ・過去の対話・意味記憶・学習者状態からユーザー単位のコンテキストパケットを構築。',
        },
        {
          en: 'Realtime voice tutor — Deepgram STT/TTS through a custom local broker, with an optional read-aloud path for answers.',
          ja: 'リアルタイム音声チューター — カスタムローカルブローカー経由のDeepgram STT/TTS。回答の読み上げにも任意対応。',
        },
        {
          en: 'Local-first learner store — per-user folders, SQLite, and document / extracted-text / artifact files that stay on the machine.',
          ja: 'ローカルファーストの学習ストア — ユーザーごとのフォルダ、SQLite、文書・抽出テキスト・成果物ファイルを端末内に保持。',
        },
        {
          en: 'Foreground + background split — answer immediately in the foreground tutor, then delegate slow work to request-correlated background tasks.',
          ja: '前景＋背景の分離 — 前景チューターで即座に回答し、重い処理はリクエストに対応づいたバックグラウンドタスクへ委譲。',
        },
        {
          en: 'Rich output — React Markdown, Mermaid, Shiki, KaTeX and Recharts render diagrams, math, code and charts inline.',
          ja: 'リッチ出力 — React Markdown・Mermaid・Shiki・KaTeX・Rechartsで、図・数式・コード・グラフをインライン表示。',
        },
        {
          en: 'BYOK & safe fallbacks — browser BYOK for local development; server-side OpenRouter/Deepgram fallbacks stay disabled behind explicit flags.',
          ja: 'BYOKと安全なフォールバック — ローカル開発はブラウザBYOK。サーバー側のOpenRouter/Deepgramは明示的なフラグで有効化するまで無効。',
        },
      ],
      flow: {
        en: 'Open a local profile → upload PDFs into a book → ask by chat or voice → assemble the context packet → answer in the foreground → delegate slow work to the background → store evidence, artifacts and revision material for the active learner.',
        ja: 'ローカルプロフィールを開く → PDFを書籍に取り込む → チャットまたは音声で質問 → コンテキストパケットを構築 → 前景で回答 → 重い処理は背景へ委譲 → エビデンス・成果物・復習教材を学習者ごとに保存。',
      },
    },
  },
  {
    title: 'TokaiHub',
    slug: 'tokaihub',
    badge: 'student PWA',
    image: '/assets/tokaihub-site.jpg',
    imageJa: '/assets/tokaihub-site-ja.png',
    icon: Smartphone,
    live: 'https://mohamedfuad16.github.io/TokaiHub/',
    github: 'https://github.com/MohamedFuad16/TokaiHub',
    description:
      'Mobile-first bilingual student portal PWA for Tokai University with AWS Cognito authentication and OTP flows.',
    descriptionJa:
      '東海大学向けのモバイルファーストな日英バイリンガル学生ポータルPWA。AWS Cognito認証とOTPフローを実装。',
    tech: ['React', 'Tailwind', 'Amplify', 'Cognito', 'Vite'],
    detail: {
      tagline: {
        en: 'The modern, central student portal for Tokai University — a native-feeling bilingual PWA on AWS.',
        ja: '東海大学のためのモダンな中央学生ポータル。AWS上で動く、ネイティブアプリのようなバイリンガルPWA。',
      },
      overview: {
        en: 'TokaiHub consolidates academic workflows, course tracking, and campus networking into a single, beautifully animated Progressive Web App. It feels like a native mobile app but runs straight from the browser with zero installs, and is built on AWS with a fully custom Cognito authentication experience.',
        ja: 'TokaiHubは、履修管理・コース追跡・キャンパスのつながりを、美しくアニメーションする単一のPWAに集約します。インストール不要でブラウザから動作しながらネイティブアプリのような操作感を実現し、AWS上に構築、Cognito認証は完全カスタムUIです。',
      },
      features: [
        {
          en: 'Custom Cognito auth — bypasses the hosted UI; the raw studentId (e.g. 4CJE1108) is the Cognito username with email-alias login, virtually eliminating collision attacks.',
          ja: 'カスタムCognito認証 — ホストUIを使わず、学籍番号（例:4CJE1108）をCognitoのユーザー名に、メールエイリアスでログイン。衝突攻撃をほぼ排除。',
        },
        {
          en: 'Cognito OTP onboarding — registration dispatches SES-backed verification codes, driving an in-app "check your email" step built entirely from scratch.',
          ja: 'Cognito OTPオンボーディング — 登録時にSESベースの確認コードを送信し、一から構築したアプリ内「メール確認」ステップを実現。',
        },
        {
          en: 'Serverless AWS backend — Lambda functions handle schedule fetching, dashboard aggregation, course browse/detail, enrollment, and profile updates, wired to Cognito lifecycle triggers.',
          ja: 'サーバーレスAWSバックエンド — 時間割取得・ダッシュボード集計・コース閲覧/詳細・履修・プロフィール更新をLambdaで処理し、Cognitoのライフサイクルトリガーと連携。',
        },
        {
          en: 'DynamoDB persistence — a single-table userclass-entity model stores student profiles, the course catalog, enrollment, and schedule data.',
          ja: 'DynamoDB永続化 — シングルテーブルのuserclass-entity設計で、学生プロフィール・コースカタログ・履修・時間割を保存。',
        },
        {
          en: 'Interactive onboarding — a multi-step campus, course and GPA wizard polished with motion/react layout animations, plus dark/light modes and EN/JP throughout.',
          ja: 'インタラクティブなオンボーディング — キャンパス・コース・GPA入力の多段ウィザードをmotion/reactのレイアウトアニメで洗練。ダーク/ライトと日英に全面対応。',
        },
      ],
    },
  },
  {
    title: 'Codex Account Switcher',
    slug: 'codex-account-switcher',
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
    detail: {
      tagline: {
        en: 'A premium, native macOS menu bar utility to switch active Codex accounts in a single click.',
        ja: 'ワンクリックでCodexアカウントを切り替える、プレミアムなネイティブmacOSメニューバーアプリ。',
      },
      overview: {
        en: 'An ultra-lightweight, blazing-fast macOS menu bar utility built in pure Swift. With zero external dependencies and a footprint under 300 KB, it integrates directly with macOS system APIs to hot-swap account tokens, safely restart the active desktop app, and display real-time usage budgets right in the status bar.',
        ja: '純Swift製の超軽量・高速なmacOSメニューバーアプリ。外部依存ゼロ、300KB未満のフットプリントで、macOSのシステムAPIと直接連携し、アカウントトークンを瞬時に切り替え、実行中のデスクトップアプリを安全に再起動し、使用量をステータスバーにリアルタイム表示します。',
      },
      features: [
        {
          en: 'One-click account switching — swap between saved profiles from the menu bar; the active Codex app is terminated, purged, and restarted to apply the new session.',
          ja: 'ワンクリック切り替え — メニューバーから保存済みプロファイルを切り替え。実行中のCodexアプリを終了・消去・再起動して新しいセッションを適用。',
        },
        {
          en: 'Redesigned menu UI — each account is a rich card with a deterministic avatar hue from your email, a plan badge, and a green Active pill.',
          ja: '刷新されたメニューUI — 各アカウントを、メール由来の固定色アバター・プランバッジ・緑のActiveピルを備えたリッチなカードで表示。',
        },
        {
          en: 'Glass-effect usage bars — animated gradient progress bars with a liquid-glass specular highlight that ease in smoothly when the menu opens.',
          ja: 'グラス効果の使用量バー — 液体ガラスのハイライトを備えたグラデーションのプログレスバーが、メニューを開くと滑らかにイーズイン。',
        },
        {
          en: 'Native macOS feel — SF Symbol icons on every action, styled uppercase section headers, and full dark & light mode adaptation.',
          ja: 'ネイティブなmacOS体験 — すべての操作にSFシンボル、装飾された大文字のセクション見出し、ダーク/ライト完全対応。',
        },
        {
          en: 'Zero dependencies — pure Swift plus system APIs only, in a binary under 300 KB.',
          ja: '依存ゼロ — 純SwiftとシステムAPIのみで、300KB未満のバイナリ。',
        },
      ],
    },
  },
];

function SectionTitle({ children }) {
  return <h2 className="section-title">{children}</h2>;
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
  const fallbackCells = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 245 }, (_, index) => {
      const wave = Math.sin(index * 0.43) + Math.cos(index * 0.17);
      const highlighted = index > 88 && index < 118 ? 2 : 0;
      const level = Math.max(0, Math.min(4, Math.round(wave + highlighted + (index % 13 === 0 ? 2 : 0))));
      const count = level === 0 ? 0 : level * 2 + (index % 3);
      const cellDate = new Date(today);
      cellDate.setDate(cellDate.getDate() - (244 - index));
      return { date: cellDate.toISOString().slice(0, 10), count, level };
    });
  }, []);
  const [data, setData] = useState({ cells: fallbackCells, total: 392 });

  useEffect(() => {
    let cancelled = false;
    fetch('https://github-contributions-api.jogruber.de/v4/MohamedFuad16?y=last')
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('GitHub calendar unavailable'))))
      .then((payload) => {
        if (cancelled || !Array.isArray(payload.contributions)) return;
        const cells = payload.contributions.slice(-245).map((day) => ({
          date: day.date,
          count: Number(day.count) || 0,
          level: Number(day.level) || 0,
        }));
        setData({ cells, total: Number(payload.total?.lastYear) || 392 });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  return data;
}

function formatCellDate(dateStr, locale) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);
  return new Intl.DateTimeFormat(locale === 'ja' ? 'ja-JP' : 'en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function ContributionGrid({ t, locale }) {
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
          {cells.map((day, index) => (
            <span
              key={day.date || index}
              className={`cell level-${day.level}`}
              data-tooltip={t.dayTooltip(day.count, formatCellDate(day.date, locale))}
            />
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
            <a href={item.url} target="_blank" rel="noreferrer">
              <span className="company-name">{item.company}</span>
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

function ProjectCard({ project, t, locale, onOpen }) {
  const Icon = project.icon;
  const image = locale === 'ja' && project.imageJa ? project.imageJa : project.image;
  const open = () => onOpen(project.slug);
  return (
    <article className="project dashed">
      <button
        type="button"
        className="project-shot"
        onClick={open}
        aria-label={`${project.title} — ${t.viewDetails}`}
      >
        <img src={image} alt={`${project.title} interface preview`} />
        <span>{project.badge}</span>
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

function ProjectDetailView({ project, t, locale, onClose, viewRef }) {
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
      <div className="project-detail-inner">
        <button type="button" className="pd-back pd-animate" onClick={onClose}>
          <ArrowLeft size={16} />
          {t.back}
        </button>

        <header className="pd-hero pd-animate">
          <div className="pd-shot">
            <img src={image} alt={`${project.title} interface preview`} />
            <span>{project.badge}</span>
          </div>
          <div className="pd-headline">
            <h1>
              <span>{project.title}</span>
              <Icon size={22} />
            </h1>
            <p className="pd-tagline">{pick(d.tagline)}</p>
            <div className="pd-actions">
              <a href={project.live} target="_blank" rel="noreferrer">
                <ExternalLink size={15} />
                {t.live}
              </a>
              <a href={project.github} target="_blank" rel="noreferrer">
                <BrandIcon name="github" />
                GitHub
              </a>
            </div>
          </div>
        </header>

        <section className="pd-block pd-animate">
          <h2 className="pd-h">{t.overview}</h2>
          <p className="pd-overview">{pick(d.overview)}</p>
        </section>

        <section className="pd-block pd-animate">
          <h2 className="pd-h">{t.keyFeatures}</h2>
          <ul className="pd-features">
            {d.features.map((f, i) => (
              <li key={i}>{pick(f)}</li>
            ))}
          </ul>
        </section>

        {d.flow && (
          <section className="pd-block pd-animate">
            <h2 className="pd-h">{t.howItWorks}</h2>
            <p className="pd-overview">{pick(d.flow)}</p>
          </section>
        )}

        <section className="pd-block pd-animate">
          <h2 className="pd-h">{t.tech}</h2>
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
  const [photoOpen, setPhotoOpen] = useState(false);
  const [clickBursts, setClickBursts] = useState([]);
  const [route, setRoute] = useState(() => window.location.hash);
  const [shownProject, setShownProject] = useState(null);
  const mainRef = useRef(null);
  const smoothWrapperRef = useRef(null);
  const smoothContentRef = useRef(null);
  const lightboxRef = useRef(null);
  const lightboxImgRef = useRef(null);
  const lightboxTlRef = useRef(null);
  const detailRef = useRef(null);
  const t = copy[locale];
  const activeProject = projects.find((p) => route === `#/project/${p.slug}`) || null;
  const openProject = (slug) => {
    window.location.hash = `#/project/${slug}`;
  };
  const closeProject = () => {
    if (window.history.length > 1) window.history.back();
    else window.location.hash = '';
  };
  // Japanese visitors get the Japanese-language CV; everyone else the English one.
  const resumeHref =
    locale === 'ja' ? '/resume/Mohamed_Fuad_CV_JA.pdf' : '/resume/Mohamed_Fuad_CV.pdf';

  useEffect(() => {
    window.localStorage.setItem('portfolio-locale', locale);
  }, [locale]);

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
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setShownProject(null);
      return;
    }
    gsap.killTweensOf(el);
    gsap.to(el, {
      autoAlpha: 0,
      y: 16,
      duration: 0.28,
      ease: 'power2.in',
      onComplete: () => setShownProject(null),
    });
  }, [activeProject]); // eslint-disable-line react-hooks/exhaustive-deps

  // Smooth GSAP entrance each time a detail view mounts.
  useGSAP(
    () => {
      const el = detailRef.current;
      if (!shownProject || !el) return;
      el.scrollTop = 0;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        gsap.set(el, { autoAlpha: 1, y: 0 });
        return;
      }
      gsap.set(el, { autoAlpha: 0, y: 0 });
      gsap
        .timeline()
        .to(el, { autoAlpha: 1, duration: 0.3, ease: 'power2.out' })
        .from(
          el.querySelectorAll('.pd-animate'),
          { y: 26, opacity: 0, duration: 0.55, stagger: 0.07, ease: 'power3.out' },
          '-=0.12'
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
    const handleTap = (event) => {
      // Fire on real taps/clicks only. Using 'click' (not 'pointerdown') means a
      // scroll or drag gesture never triggers the ripple; detail === 0 skips
      // keyboard-activated clicks (which have no meaningful pointer position).
      if (event.detail === 0) return;
      if (event.target.closest('.name-action, .qr-toggle-btn')) return;
      playChime(0.055);
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setClickBursts((items) => [...items.slice(-5), { id, x: event.clientX, y: event.clientY }]);
      window.setTimeout(() => {
        setClickBursts((items) => items.filter((item) => item.id !== id));
      }, 1050);
    };

    window.addEventListener('click', handleTap);
    return () => window.removeEventListener('click', handleTap);
  }, []);

  const handleNameAction = (event) => {
    event.stopPropagation();
    playChime(0.11);
    setBurst(false);
    requestAnimationFrame(() => setBurst(true));
    window.setTimeout(() => setBurst(false), 850);
  };

  return (
    <>
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
        aria-label="Profile photo"
        onClick={() => setPhotoOpen(false)}
      >
        <img
          ref={lightboxImgRef}
          src="/assets/profile.jpg"
          alt="Mohamed Fuad, enlarged"
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
        />
      )}
      <div id="smooth-wrapper" ref={smoothWrapperRef}>
        <div id="smooth-content" ref={smoothContentRef}>
          <main ref={mainRef}>
      <section className="profile">
        <div className={`avatar ${showQr ? 'is-flipped' : ''}`}>
          <div className="avatar-card">
            <div className="avatar-face avatar-front">
              <img
                className="profile-photo"
                src="/assets/profile.jpg"
                alt="Mohamed Fuad"
                title="View photo"
                onClick={() => setPhotoOpen(true)}
              />
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
            <span className="name-text">Mohamed Fuad</span>
            <button className={`name-action ${burst ? 'bursting' : ''}`} type="button" onClick={handleNameAction}>
              <Rocket size={19} fill="currentColor" />
              <i />
              <i />
              <i />
            </button>
          </h1>
          <a className="building" href="#projects">
            {t.building}
            <Sparkles size={14} />
          </a>
          <p className="handle">
            @MohamedFuad16
            <span className="locale-switch" role="group" aria-label="Language">
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
          </p>
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
        <a className="square" href={resumeHref} target="_blank" rel="noreferrer">
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

      <ContributionGrid t={t} locale={locale} />

      <SectionTitle>{t.projects}</SectionTitle>
      <section className="projects" id="projects">
        {projects.map((project) => (
          <ProjectCard key={project.title} project={project} t={t} locale={locale} onOpen={openProject} />
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
          <a className="qiita-link" href={QIITA_ARTICLE} target="_blank" rel="noreferrer">
            <BrandIcon name="qiita" />
            {t.thoughtsLink}
          </a>
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
          <a href={resumeHref} target="_blank" rel="noreferrer">
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

      <Signature />

      <WaveDivider />

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
        </div>
      </div>
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
