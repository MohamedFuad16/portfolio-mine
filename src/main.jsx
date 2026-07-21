import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';
import { useGSAP } from '@gsap/react';
import { signaturePath, signatureViewBox, signatureStrokeWidth } from './signature-path';
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

const QIITA_PROFILE = 'https://qiita.com/mfuad16';

const experience = [
  {
    company: 'Altius Link (formerly KDDI Evolva)',
    companyJa: 'アルティウスリンク（旧KDDIエボルバ）',
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
    student: 'Information and Communication Technology student',
    intro: (
      <>
        I&apos;m a <b>full-stack developer</b> and a third-year Information and Communication
        Technology student at Tokai University. My goal is to become a{' '}
        <b>Forward Deployed Engineer</b>: someone who works close to real users, understands the
        problem, and builds the product that solves it. I&apos;m comfortable working with LLMs,
        agent workflows, tool calling, and secure <Highlight name="MCP" /> integrations, alongside
        production apps built with <Highlight name="TypeScript" />, <Highlight name="Python" />,{' '}
        <Highlight name="Swift" />, <Highlight name="Node" />, <Highlight name="AWS" />, and{' '}
        <Highlight name="React" />. I work in English and Japanese, with JLPT N2 business-level Japanese.
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
    systemMap: 'System map',
    viewDetails: 'View details',
    contribution: (total) => `${total} contributions in the last 12 months`,
    less: 'Less',
    more: 'More',
    dayTooltip: (count, dateLabel) => `${count} contribution${count === 1 ? '' : 's'} on ${dateLabel}`,
  },
  ja: {
    lang: 'English',
    building: 'AIツールを開発中',
    location: '東京都、日本',
    student: '東海大学 情報通信学部',
    intro: (
      <>
        東海大学情報通信学部3年の<b>フルスタック開発者</b>です。将来は、ユーザーの現場で課題を
        理解し、必要なプロダクトを一緒に形にする<b>Forward Deployed Engineer</b>を目指しています。
        LLM、エージェントワークフロー、ツール呼び出し、安全な<Highlight name="MCP" />連携に加え、
        <Highlight name="TypeScript" />、<Highlight name="Python" />、<Highlight name="Swift" />、
        <Highlight name="Node" />、<Highlight name="AWS" />、<Highlight name="React" />を使った
        本番向けアプリ開発に取り組んでいます。英語と日本語で業務対応ができ、日本語力はJLPT N2相当です。
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
    systemMap: 'システム構成',
    viewDetails: '詳細を見る',
    contribution: (total) => `直近12か月で ${total} 件のコントリビューション`,
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
    image: '/assets/webdrop-site.png',
    imageJa: '/assets/webdrop-site-ja-new.png',
    icon: Radio,
    live: 'https://web-drop-lyart.vercel.app/',
    github: 'https://github.com/MohamedFuad16/WebDrop',
    description:
      'Nearby file sharing in the browser, with proximity checks and direct WebRTC transfers.',
    descriptionJa:
      'ブラウザだけで使えるAirDrop風ファイル共有アプリ。バンプペアリング、超音波Web Audioハンドシェイク、WebRTCストリーム、OPFS保存に対応。',
    tech: ['JavaScript', 'WebRTC', 'OPFS', 'Web Audio', 'PWA'],
    detail: {
      tagline: {
        en: 'A browser-based way to send files to someone nearby without uploading them first.',
        ja: 'オープンウェブのためのAirDrop。近接検証つきのブラウザ完結型P2Pファイル転送。',
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
          en: 'Pairing checks ultrasound and device motion together. A short-lived QR code is available when those sensors are not.',
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
    },
  },
  {
    title: 'Tutor-System',
    slug: 'tutor-system',
    badge: 'long-term project',
    image: '/assets/tutor-site-new.png',
    imageJa: '/assets/tutor-site-ja-new.png',
    icon: Sparkles,
    live: 'https://tutor-system-architecture.vercel.app/',
    github: 'https://github.com/MohamedFuad16/Tutor-System',
    description:
      'A PDF study workspace with source-aware chat, voice tutoring, learner memory, and revision tools.',
    descriptionJa:
      '関数呼び出し型のチューターツール、リアルタイム音声指導、出典つきPDFチャット、学習者メモリを備えたAI学習アプリ。',
    tech: ['React 19', 'TypeScript', 'OpenRouter', 'Deepgram', 'Dexie'],
    detail: {
      tagline: {
        en: 'A study workspace that keeps answers tied to the learner, the conversation, and the source material.',
        ja: 'PDF学習・出典つきチュータリング・音声モード・可視化されたAIワークフローを備えたローカルファーストの学習システム。',
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
          en: 'Fast teaching stays in the foreground. Slower retrieval and tool work runs as request-linked background jobs that can be inspected later.',
          ja: 'すぐに必要な説明は前景で返し、検索やツール処理はリクエストに紐づくバックグラウンドジョブとして実行します。',
        },
        {
          en: 'Durable learner data stays in user-scoped SQLite and files. Dexie keeps smaller browser-side cache and interface state.',
          ja: '学習データはユーザー単位のSQLiteとファイルに保存し、Dexieはブラウザ側の軽いキャッシュと画面状態を管理します。',
        },
      ],
      flow: {
        en: 'The learner opens a local profile, adds PDFs to a book, and asks a question by chat or voice. Tutor gathers the relevant page, earlier discussion, evidence, and learner state before sending the request to the foreground tutor. Slow jobs continue in the background, and the useful results are saved as evidence, artifacts, or revision material for that learner.',
        ja: '学習者がローカルプロフィールを開き、PDFを書籍に追加して、チャットまたは音声で質問します。Tutorは関連ページ、過去の対話、根拠、学習状態を集めて前景チューターへ渡します。時間のかかる処理は背景で続き、結果はその学習者の根拠、成果物、復習教材として保存されます。',
      },
      architecture: [
        { label: { en: 'Study input', ja: '学習入力' }, detail: { en: 'PDF, text, or voice', ja: 'PDF・文章・音声' } },
        { label: { en: 'Context', ja: 'コンテキスト' }, detail: { en: 'Sources and learner state', ja: '出典と学習状態' } },
        { label: { en: 'Tutor', ja: 'チューター' }, detail: { en: 'LLM, voice, and tools', ja: 'LLM・音声・ツール' } },
        { label: { en: 'Learning record', ja: '学習記録' }, detail: { en: 'SQLite, files, and Dexie', ja: 'SQLite・ファイル・Dexie' } },
      ],
    },
  },
  {
    title: 'TokaiHub',
    slug: 'tokaihub',
    badge: 'student PWA',
    image: '/assets/tokaihub-site-new.png',
    imageJa: '/assets/tokaihub-site-ja-new.png',
    icon: Smartphone,
    live: 'https://mohamedfuad16.github.io/TokaiHub/',
    github: 'https://github.com/MohamedFuad16/TokaiHub',
    description:
      'A bilingual Tokai University student portal backed by Cognito, Lambda, and DynamoDB.',
    descriptionJa:
      '東海大学向けのモバイルファーストな日英バイリンガル学生ポータルPWA。AWS Cognito認証とOTPフローを実装。',
    tech: ['React', 'Tailwind', 'Amplify', 'Cognito', 'Vite'],
    detail: {
      tagline: {
        en: 'A bilingual student portal that brings Tokai University services into one mobile-friendly PWA.',
        ja: '東海大学のためのモダンな中央学生ポータル。AWS上で動く、ネイティブアプリのようなバイリンガルPWA。',
      },
      overview: {
        en: 'I built TokaiHub around the routines students repeat every week: checking a schedule, finding course information, managing enrollment, and updating a profile. It runs as an installable React PWA in English and Japanese. Authentication and the student data live on AWS, while the interface stays focused on quick mobile use.',
        ja: 'TokaiHubは、時間割の確認、授業情報の検索、履修管理、プロフィール更新など、学生が毎週行う操作を一つにまとめたReact PWAです。英語と日本語に対応し、インストールして使えます。認証と学生データはAWSで管理し、画面はスマートフォンですばやく操作できるように設計しています。',
      },
      features: [
        {
          en: 'The custom Cognito sign-in keeps students inside the app. Student IDs are the underlying usernames, while email aliases keep login familiar.',
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
          en: 'The onboarding flow collects campus, course, and GPA details, with English and Japanese copy plus light and dark themes throughout the app.',
          ja: 'オンボーディングでキャンパス、コース、GPAを登録できます。アプリ全体で日英表示とライト・ダークテーマに対応しています。',
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
    },
  },
  {
    title: 'ClaudeShot',
    slug: 'claudeshot',
    badge: 'macOS utility',
    image: '/assets/claudeshot-preview.svg',
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
          en: 'A short flash and settling animation confirms the capture without opening a separate window.',
          ja: '短いフラッシュと収束アニメーションで、別ウィンドウを開かずに撮影完了を伝えます。',
        },
        {
          en: 'English and Japanese menus, launch-at-login, and selectable sounds keep the utility practical for daily use.',
          ja: '日英メニュー、自動起動、選べる効果音を備え、毎日使いやすい形にしています。',
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
  const [data, setData] = useState({ cells: fallbackCells, total: 561 });

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
        setData({ cells, total: Number(payload.total?.lastYear) || 561 });
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
  const monthLabels = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(locale === 'ja' ? 'ja-JP' : 'en-US', {
      month: 'short',
    });
    const labels = [];
    let previousMonth = '';
    cells.forEach((day) => {
      const [year, month] = day.date.split('-').map(Number);
      const key = `${year}-${month}`;
      if (key === previousMonth) return;
      labels.push(formatter.format(new Date(year, (month || 1) - 1, 1)));
      previousMonth = key;
    });
    return labels.slice(-9);
  }, [cells, locale]);

  return (
    <section className="dashed contribution" aria-label="Contribution grid">
      <div className="calendar-scroll">
        <div className="months">
          {monthLabels.map((month, index) => (
            <span key={`${month}-${index}`}>{month}</span>
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
  const company = locale === 'ja' && item.companyJa ? item.companyJa : item.company;
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
              <span className="company-name">{company}</span>
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
          aria-label={`Toggle ${company} details`}
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
  const open = (event) => onOpen(project.slug, event.currentTarget);
  return (
    <article className={`project project-${project.slug} dashed`}>
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
            {project.live && (
              <a href={project.live} target="_blank" rel="noreferrer">
                <ExternalLink size={14} />
                {t.live}
              </a>
            )}
            <a href={project.github} target="_blank" rel="noreferrer">
              <BrandIcon name="github" />
              GitHub
            </a>
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
        <button type="button" className="pd-back pd-animate pd-reveal" onClick={onClose}>
          <ArrowLeft size={16} />
          {t.back}
        </button>

        <header className="pd-hero">
          <div className="pd-shot pd-animate">
            <img src={image} alt={`${project.title} interface preview`} />
            <span>{project.badge}</span>
          </div>
          <div className="pd-headline pd-animate pd-reveal">
            <h1>
              <span>{project.title}</span>
              <Icon size={22} />
            </h1>
            <p className="pd-tagline">{pick(d.tagline)}</p>
            <div className="pd-actions">
              {project.live && (
                <a href={project.live} target="_blank" rel="noreferrer">
                  <ExternalLink size={15} />
                  {t.live}
                </a>
              )}
              <a href={project.github} target="_blank" rel="noreferrer">
                <BrandIcon name="github" />
                GitHub
              </a>
            </div>
          </div>
        </header>

        <section className="pd-block pd-animate pd-reveal">
          <h2 className="pd-h">{t.overview}</h2>
          <p className="pd-overview">{pick(d.overview)}</p>
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

        <section className="pd-block pd-animate pd-reveal">
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

const retroCoin = new Audio('/assets/retro-coin.mp3');
retroCoin.preload = 'auto';

function playCoin(volume = 0.12) {
  const sound = retroCoin.cloneNode();
  sound.volume = Math.min(1, Math.max(0, volume));
  sound.play().catch(() => {});
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
  const detailOriginRef = useRef(null);
  const detailOriginCardRef = useRef(null);
  const detailOriginMarkupRef = useRef('');
  const t = copy[locale];
  const activeProject = projects.find((p) => route === `#/project/${p.slug}`) || null;
  const openProject = (slug, trigger) => {
    const mobile = window.matchMedia('(max-width: 640px)').matches;
    const card = mobile ? trigger?.closest('.project') : null;
    if (card) {
      const rect = card.getBoundingClientRect();
      detailOriginRef.current = {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      };
      detailOriginMarkupRef.current = card.outerHTML;
      detailOriginCardRef.current = card;
      card.classList.add('is-expand-origin');
    } else {
      detailOriginRef.current = null;
      detailOriginMarkupRef.current = '';
      detailOriginCardRef.current = null;
    }
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
    const origin = detailOriginRef.current;
    const face = el.querySelector('.pd-expand-face');
    const inner = el.querySelector('.project-detail-inner');
    const mobile = window.matchMedia('(max-width: 640px)').matches;
    const releaseOrigin = () => {
      detailOriginCardRef.current?.classList.remove('is-expand-origin');
      detailOriginCardRef.current = null;
      detailOriginRef.current = null;
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
      const origin = detailOriginRef.current;
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
          inset: 'auto',
          left: origin.left,
          top: origin.top,
          width: origin.width,
          height: origin.height,
          borderRadius: 10,
          overflow: 'hidden',
        });
        gsap.set(face, { autoAlpha: 1, visibility: 'visible' });
        gsap.set(inner, { autoAlpha: 0 });
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
          .to(face, { autoAlpha: 0, duration: 0.2, ease: 'power1.out' }, 0.24)
          .to(inner, { autoAlpha: 1, duration: 0.22, ease: 'power2.out' }, 0.22)
          .to(
            reveal,
            { y: 0, opacity: 1, duration: 0.34, stagger: 0.04, ease: 'power2.out' },
            0.25
          )
          .set(face, { visibility: 'hidden' })
          .set(el, { overflowY: 'auto' });
        return;
      }

      timeline
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
      playCoin(0.22);
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
    playCoin(0.34);
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
          originMarkup={detailOriginMarkupRef.current}
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
              playCoin(0.28);
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
            <span className="meta-location">
              <MapPin size={14} />
              {t.location}
            </span>
            <span className="meta-separator">•</span>
            <a
              className="university-meta"
              href="https://www.u-tokai.ac.jp/"
              target="_blank"
              rel="noreferrer"
            >
              <img src="/assets/tokai-university-logo.svg" alt="Tokai University" />
              <span>{t.student}</span>
            </a>
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
          <a className="qiita-link" href={QIITA_PROFILE} target="_blank" rel="noreferrer">
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
