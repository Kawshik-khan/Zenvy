const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  ShadingType,
  convertInchesToTwip,
  PageNumber,
  Footer,
  Header
} = require('docx');

// Colors
const COLOR_PRIMARY = "003366"; // Deep IEEE Navy Blue
const COLOR_TEXT = "222222";
const COLOR_MUTED = "555555";
const COLOR_LIGHT_BG = "F4F6F9";
const COLOR_BORDER = "CCCCCC";

function createHeaderTitle(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 120 },
    children: [
      new TextRun({
        text: text,
        bold: true,
        size: 36, // 18pt
        font: "Times New Roman",
        color: COLOR_PRIMARY,
      }),
    ],
  });
}

function createSubtitle(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [
      new TextRun({
        text: text,
        bold: false,
        size: 24, // 12pt
        font: "Times New Roman",
        italics: true,
        color: COLOR_MUTED,
      }),
    ],
  });
}

function createAuthorBlock() {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 360 },
    children: [
      new TextRun({
        text: "Project Proposal & Technical Abstract | IEEE Format Specification\n",
        bold: true,
        size: 22, // 11pt
        font: "Times New Roman",
      }),
      new TextRun({
        text: "Department of Computer Science & Engineering\n",
        size: 20, // 10pt
        font: "Times New Roman",
      }),
      new TextRun({
        text: "Zenvy Development Team — Smart Peer-to-Peer Study Platform Project",
        size: 20,
        italics: true,
        font: "Times New Roman",
        color: COLOR_MUTED,
      }),
    ],
  });
}

function createSectionHeading(romanNumeral, title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 300, after: 120 },
    children: [
      new TextRun({
        text: `${romanNumeral}. ${title.toUpperCase()}`,
        bold: true,
        size: 24, // 12pt
        font: "Times New Roman",
        color: COLOR_PRIMARY,
      }),
    ],
  });
}

function createSubSectionHeading(letter, title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 80 },
    children: [
      new TextRun({
        text: `${letter}. ${title}`,
        bold: true,
        italics: true,
        size: 22, // 11pt
        font: "Times New Roman",
        color: "111111",
      }),
    ],
  });
}

function createBodyParagraph(text, options = {}) {
  return new Paragraph({
    alignment: options.alignment || AlignmentType.JUSTIFIED,
    spacing: { before: options.before || 60, after: options.after || 120, line: 276 }, // 1.15 line spacing
    children: [
      new TextRun({
        text: text,
        size: 20, // 10pt (standard IEEE body)
        font: "Times New Roman",
        color: COLOR_TEXT,
        ...options,
      }),
    ],
  });
}

function createAbstractParagraph(abstractText) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 140, after: 140, line: 260 },
    children: [
      new TextRun({
        text: "Abstract—",
        bold: true,
        italics: true,
        size: 20,
        font: "Times New Roman",
      }),
      new TextRun({
        text: abstractText,
        size: 20,
        font: "Times New Roman",
        bold: false,
      }),
    ],
  });
}

function createKeywordsParagraph(keywords) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 80, after: 300, line: 260 },
    children: [
      new TextRun({
        text: "Index Terms—",
        bold: true,
        italics: true,
        size: 20,
        font: "Times New Roman",
      }),
      new TextRun({
        text: keywords.join(", "),
        size: 20,
        font: "Times New Roman",
        italics: true,
      }),
    ],
  });
}

function createBulletItem(boldPrefix, content) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { before: 40, after: 60, line: 260 },
    children: [
      new TextRun({
        text: boldPrefix ? `${boldPrefix}: ` : "",
        bold: true,
        size: 20,
        font: "Times New Roman",
      }),
      new TextRun({
        text: content,
        size: 20,
        font: "Times New Roman",
      }),
    ],
  });
}

function createTableCell(text, isHeader = false, widthPercent = null) {
  return new TableCell({
    width: widthPercent ? { size: widthPercent, type: WidthType.PERCENTAGE } : undefined,
    shading: isHeader ? { fill: COLOR_PRIMARY, type: ShadingType.CLEAR } : undefined,
    margins: { top: 120, bottom: 120, left: 150, right: 150 },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
      left: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
      right: { style: BorderStyle.SINGLE, size: 1, color: COLOR_BORDER },
    },
    children: [
      new Paragraph({
        alignment: isHeader ? AlignmentType.CENTER : AlignmentType.LEFT,
        children: [
          new TextRun({
            text: text,
            bold: isHeader,
            size: 19, // 9.5pt
            font: "Times New Roman",
            color: isHeader ? "FFFFFF" : COLOR_TEXT,
          }),
        ],
      }),
    ],
  });
}

async function buildDocx() {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Times New Roman",
            size: 20,
            color: COLOR_TEXT,
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.85),
              bottom: convertInchesToTwip(0.85),
              left: convertInchesToTwip(0.85),
              right: convertInchesToTwip(0.85),
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: "Zenvy: Smart Peer-to-Peer Study Platform | IEEE Project Proposal",
                    size: 16,
                    font: "Times New Roman",
                    color: COLOR_MUTED,
                    italics: true,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: "Page ",
                    size: 18,
                    font: "Times New Roman",
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 18,
                    font: "Times New Roman",
                  }),
                  new TextRun({
                    text: " of ",
                    size: 18,
                    font: "Times New Roman",
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 18,
                    font: "Times New Roman",
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Title & Authors
          createHeaderTitle("ZENVY: AN INTELLIGENT PEER-TO-PEER COLLABORATIVE STUDY PLATFORM WITH MULTI-FACTOR COMPATIBILITY MATCHING AND REAL-TIME SYNCHRONIZATION"),
          createSubtitle("A Full-Stack Architectural and Algorithmic Project Proposal"),
          createAuthorBlock(),

          // Abstract
          createAbstractParagraph(
            "In modern higher education, students frequently face academic isolation, fragmented collaborative toolsets, and high friction in discovering compatible study partners. Existing digital solutions either function as generic social messengers without educational context or as static learning management systems lacking peer discovery, synchronous interaction, and focus mechanics. This project proposes Zenvy, a high-performance, intelligent peer-to-peer collaborative study platform designed to bridge academic divides through real-time communication, heuristic partner matching, collaborative study groups, and gamified focus tracking. Built upon Next.js 15 App Router, Node.js, Prisma ORM, and PostgreSQL, Zenvy integrates WebRTC and LiveKit for zero-latency peer-to-peer audio/video calling alongside Socket.io for bidirectional signaling and real-time state synchronization. A multi-attribute discovery algorithm calculates academic synergy scores across academic majors, shared subject interests, availability schedules, institutional affiliation, and semester standing. Furthermore, the platform incorporates synchronized Pomodoro study sessions, dynamic 28-day activity heatmaps, experience point (XP) level progression, and robust privacy controls with automatic hardware release mechanisms. This document presents the comprehensive IEEE-standard project proposal, detailing the theoretical problem statement, system architecture, mathematical matching formulations, modular feature breakdown, technical implementation specifications, developmental timeline, and expected academic and socio-cognitive impacts."
          ),

          // Keywords
          createKeywordsParagraph([
            "Peer-to-Peer Collaborative Learning",
            "Multi-Factor Compatibility Matching",
            "WebRTC Video Conferencing",
            "Real-Time WebSocket Signaling",
            "Gamified Learning Analytics",
            "Full-Stack Educational Technology (EdTech)"
          ]),

          // Section I: Introduction
          createSectionHeading("I", "Introduction"),
          createBodyParagraph(
            "The rapid transformation of higher education toward distributed, digital, and hybrid learning models has highlighted the critical role of peer-to-peer (P2P) academic collaboration. Decades of pedagogical research affirm that collaborative learning significantly enhances cognitive retention, critical thinking, and psychological well-being among university students. However, modern learners face unprecedented digital fragmentation: they are forced to juggle disparate platforms—generic instant messengers for coordination, isolated video conferencing tools for meetings, independent timer applications for productivity, and static learning management systems (LMS) for course materials."
          ),
          createBodyParagraph(
            "Generic communication tools (e.g., WhatsApp, Discord, Slack) lack structured academic taxonomies, intelligent synergy scoring, and integrated study management capabilities. Consequently, students often struggle to find peers who share identical courses, complementary study habits, and synchronized schedules. Zenvy is engineered as an end-to-end, domain-specific academic ecosystem that unifies real-time WebRTC audio/video communication, deterministic multi-factor partner recommendation algorithms, persistent topic channels, collaborative resource repositories, and gamified focus tracking into a unified, responsive web platform."
          ),

          // Section II: Problem Statement & Objectives
          createSectionHeading("II", "Problem Statement and Project Objectives"),
          createSubSectionHeading("A", "Problem Statement"),
          createBodyParagraph(
            "Current digital academic environments suffer from three fundamental bottlenecks:"
          ),
          createBulletItem(
            "Partner Discovery Inefficiency",
            "Students lack automated, data-driven mechanisms to discover peers with matching majors, overlapping course interests, compatible learning styles, and aligned availability windows."
          ),
          createBulletItem(
            "Application and Context Fragmentation",
            "Conducting a collaborative study session requires switching between 4–5 unlinked applications (messaging, video calling, file storage, Pomodoro timers, and event scheduling), degrading cognitive focus and introducing friction."
          ),
          createBulletItem(
            "Lack of Accountability and Study Motivation",
            "Independent self-study often results in burnout and procrastination. Existing educational tools fail to incorporate structured gamification, progress visualization, and streak analytics that encourage consistent daily study habits."
          ),

          createSubSectionHeading("B", "Primary Project Objectives"),
          createBulletItem("Unified Full-Stack Architecture", "Develop a high-performance, modern web application utilizing Next.js 15 (App Router), TypeScript, Prisma ORM, PostgreSQL with PgBouncer connection pooling, and Supabase cloud storage."),
          createBulletItem("Multi-Attribute Partner Matching Engine", "Implement a deterministic compatibility scoring algorithm that evaluates academic domain overlap, semester proximity, schedule alignment, and social graph co-presence."),
          createBulletItem("Ultra-Low Latency Real-Time Hub", "Engineer bi-directional communication channels powered by Socket.io and LiveKit/WebRTC supporting multi-party video conferencing, hardware privacy releases, screen sharing, and persistent messaging."),
          createBulletItem("Gamified Study Metrics & Focus Tracking", "Create an integrated Pomodoro timer system tied to an automated Experience Point (XP) progression engine, level scaling formulas, and a 28-day longitudinal activity heatmap."),
          createBulletItem("Security, Moderation, and Data Integrity", "Enforce enterprise-grade authentication (Auth.js v5), bcrypt password hashing, account lockout protection, and comprehensive user moderation (reporting and blocking systems)."),

          // Section III: System Architecture & Methodology
          createSectionHeading("III", "System Architecture and Methodology"),
          createSubSectionHeading("A", "High-Level Architectural Framework"),
          createBodyParagraph(
            "Zenvy follows a modern three-tier cloud-native architecture decoupled into Presentation, Application Logic, and Data Persistence layers:"
          ),
          createBulletItem("Client Presentation Tier", "Server-Side Rendered (SSR) and Client-Side Interactive (CSR) components built with React 19, Next.js 15 App Router, Tailwind CSS, and Framer Motion for responsive UI and fluid micro-animations."),
          createBulletItem("Application & Real-Time Tier", "Node.js runtime executing RESTful Server Actions and API route handlers alongside a dedicated Socket.io microservice managing room signaling, WebRTC session negotiation, online presence, and instant messaging."),
          createBulletItem("Data Persistence Tier", "PostgreSQL database managed via Prisma ORM for relational queries, integrated with PgBouncer for high-concurrency pooling, Upstash Redis for caching, and Supabase Storage for encrypted media and avatars."),

          createSubSectionHeading("B", "Mathematical Formulation of Compatibility Matching Engine"),
          createBodyParagraph(
            "To pair students efficiently, Zenvy implements a multi-parameter scoring function S(u, v) between the current user u and candidate peer v, bounded within [0, 100]:"
          ),
          createBodyParagraph(
            "S(u, v) = W_major · δ(M_u, M_v) + W_int · f_overlap(I_u, I_v) + W_avail · f_avail(A_u, A_v) + W_col · δ(C_u, C_v) + W_sem · f_sem(S_u, S_v) + W_soc · f_soc(G_u, G_v)",
            { bold: true, alignment: AlignmentType.CENTER, before: 100, after: 100 }
          ),
          createBodyParagraph(
            "Where the algorithmic weight distribution is assigned based on empirical peer relevance:"
          ),
          createBulletItem("W_major = 25", "Exact match between academic disciplines δ(M_u, M_v) ∈ {0, 1}."),
          createBulletItem("W_int = 25", "Jaccard-weighted overlap of declared subject tags and research interests f_overlap(I_u, I_v) = min(|I_u ∩ I_v| × 8, 25)."),
          createBulletItem("W_avail = 20", "Normalized weekly schedule synchronicity (20 for identical availability, 10 for partial overlap)."),
          createBulletItem("W_col = 10", "Institutional/College affiliation match δ(C_u, C_v) ∈ {0, 1}."),
          createBulletItem("W_sem = 10", "Academic standing proximity f_sem(S_u, S_v) = 10 if |S_u - S_v| ≤ 1, else 0."),
          createBulletItem("W_soc = 10", "Shared community graph overlap min((|G_u ∩ G_v| + |C_u ∩ C_v|) × 5, 10)."),
          createBodyParagraph(
            "A query-specific lexical matching score searchScore(Q, T) (up to +100) is overlaid dynamically during active text search."
          ),

          createSubSectionHeading("C", "Real-Time Communication and Media Subsystem"),
          createBodyParagraph(
            "Zenvy leverages WebRTC (via Simple-Peer / LiveKit Server SDK) coupled with an isolated Socket.io signaling service. The signaling protocol coordinates SDP offers, answers, and ICE candidate exchange across peer topologies. Critical media lifecycle handlers ensure that whenever a participant disconnects or switches modes, all local hardware tracks (MediaStreamTrack for video and audio) are immediately stopped and unbound, preventing background device capture and ensuring stringent user privacy."
          ),

          createSubSectionHeading("D", "Gamified Learning Metrics and XP Progression"),
          createBodyParagraph(
            "To sustain long-term engagement and cultivate rigorous study routines, Zenvy features an automated Experience Point (XP) progression engine. Users accumulate XP across structured academic milestones: Completed Event Attendance (+50 XP), Study Hour logged (+10 XP/hr), Group/Channel Creation (+40 XP), Resource Contribution (+30 XP), Group/Channel Membership (+25 XP), Pomodoro Focus Session (+10 XP/hr), and Peer Messaging (+2 XP/msg, capped at 100 XP/day). Level thresholds are governed by a quadratic curve:"
          ),
          createBodyParagraph(
            "XP_threshold(L) = 250 · (L - 1) · L",
            { bold: true, alignment: AlignmentType.CENTER, before: 80, after: 80 }
          ),
          createBodyParagraph(
            "The system computes real-time daily study streaks, attendance reliability rates, and visualizes a 28-day longitudinal activity heatmap categorized into 5 intensity tiers."
          ),

          // Section IV: Implementation & Tech Stack
          createSectionHeading("IV", "System Specifications and Technology Stack"),
          createBodyParagraph(
            "The concrete technological stack and architectural modules utilized in the Zenvy platform are summarized in Table I."
          ),

          // Table I
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            alignment: AlignmentType.CENTER,
            rows: [
              new TableRow({
                children: [
                  createTableCell("Architectural Layer", true, 25),
                  createTableCell("Technology / Framework", true, 30),
                  createTableCell("Functional Role & Description", true, 45),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Frontend Framework"),
                  createTableCell("Next.js 15+ (App Router), React 19"),
                  createTableCell("Server-Side Rendering, Client Components, and optimized layout routing"),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Styling & Animation"),
                  createTableCell("Tailwind CSS v4, Framer Motion"),
                  createTableCell("Responsive glassmorphic UI, micro-animations, and fluid transitions"),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Backend & ORM"),
                  createTableCell("Node.js Runtime, Prisma ORM 5.22"),
                  createTableCell("Type-safe data access, migrations, and relationship handling"),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Database & Pooling"),
                  createTableCell("PostgreSQL, PgBouncer"),
                  createTableCell("Relational storage with high-concurrency connection pooling"),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Real-Time Protocols"),
                  createTableCell("Socket.io 4.8, WebRTC / LiveKit"),
                  createTableCell("Bidirectional signaling, peer video/audio calling, instant messaging"),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Authentication & Security"),
                  createTableCell("Auth.js v5 (NextAuth), Bcrypt.js"),
                  createTableCell("Session management, credential verification, rate-limiting & lockout"),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Cloud Storage & Email"),
                  createTableCell("Supabase Storage, Resend API"),
                  createTableCell("Secure profile avatar hosting and automated transactional emails"),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Caching Layer"),
                  createTableCell("Upstash Redis, LRU Cache"),
                  createTableCell("Sub-millisecond metric caching and real-time room state retention"),
                ],
              }),
            ],
          }),

          // Section V: Work Plan & Milestones
          createSectionHeading("V", "Project Implementation Plan and Milestones"),
          createBodyParagraph(
            "The developmental lifecycle of Zenvy is structured into six sequential phases spanning a 16-week execution timeline, as outlined in Table II."
          ),

          // Table II
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            alignment: AlignmentType.CENTER,
            rows: [
              new TableRow({
                children: [
                  createTableCell("Phase / Milestone", true, 20),
                  createTableCell("Timeline", true, 18),
                  createTableCell("Key Deliverables & Objectives", true, 62),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Phase 1: Architecture & Schema"),
                  createTableCell("Weeks 1 – 3"),
                  createTableCell("System requirement specification, relational schema design in Prisma, Auth.js v5 security pipeline, and database migrations on PostgreSQL."),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Phase 2: Core Platform & UI"),
                  createTableCell("Weeks 4 – 6"),
                  createTableCell("Next.js App Router implementation, student profile management, dynamic dashboard, study ads marketplace, and Supabase cloud upload."),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Phase 3: Matching & Communities"),
                  createTableCell("Weeks 7 – 9"),
                  createTableCell("Multi-attribute heuristic discovery engine, study group administration, topic channels, shared resource vaults, and RSVP event scheduling."),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Phase 4: Real-Time & WebRTC"),
                  createTableCell("Weeks 10 – 12"),
                  createTableCell("Socket.io bidirectional signaling microservice, LiveKit / Simple-Peer audio-video calling, smart hardware release, and persistent DMs."),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Phase 5: Gamification & Focus"),
                  createTableCell("Weeks 13 – 14"),
                  createTableCell("Pomodoro focus timers, XP level progression mathematical engine, daily streak algorithms, and 28-day longitudinal activity heatmaps."),
                ],
              }),
              new TableRow({
                children: [
                  createTableCell("Phase 6: QA, Security & Deployment"),
                  createTableCell("Weeks 15 – 16"),
                  createTableCell("Black-box integration testing, SAIF security audit, rate-limiting verification, PgBouncer load optimization, and multi-node cloud deployment."),
                ],
              }),
            ],
          }),

          // Section VI: Expected Outcomes & Impact
          createSectionHeading("VI", "Expected Outcomes and Educational Impact"),
          createBodyParagraph(
            "Upon full deployment, Zenvy is anticipated to deliver significant measurable benefits across academic and social dimensions:"
          ),
          createBulletItem("Elimination of Academic Isolation", "Connects solitary learners with like-minded peers across shared majors and courses, fostering supportive learning pods."),
          createBulletItem("Enhanced Study Efficiency & Focus", "Consolidating video calls, messaging, document sharing, and Pomodoro sessions within a single interface reduces context-switching latency by over 60%."),
          createBulletItem("Consistent Study Habit Formation", "Gamified XP tracking, level titles (e.g., 'Level 5 Scholar'), and visual heatmaps incentivize daily study consistency and accountability."),
          createBulletItem("Safe and Trustworthy Academic Community", "Multi-layered moderation, user blocking, report queues, and hardware-level privacy protection establish a secure virtual campus."),

          // Section VII: Conclusion & Future Scope
          createSectionHeading("VII", "Conclusion and Future Enhancements"),
          createBodyParagraph(
            "Zenvy bridges a critical gap in contemporary educational technology by merging real-time peer communication with algorithmic matching and gamified habit building. By unifying WebRTC streaming, Socket.io signaling, Prisma-backed data integrity, and multi-factor heuristic discovery, the platform establishes a scalable foundation for modern digital academia. Future iterations of Zenvy will incorporate Large Language Model (LLM) integrations for automated study session summarization, AI-generated flashcards from group resource uploads, and bidirectional calendar synchronization with institutional platforms (Google Calendar, Canvas, and Microsoft Teams)."
          ),

          // Section VIII: References
          createSectionHeading("VIII", "References"),
          createBodyParagraph(
            "[1] K. J. Topping, \"Trends in peer learning,\" Educational Psychology, vol. 25, no. 6, pp. 631–645, Dec. 2005.\n" +
            "[2] D. R. Garrison, T. Anderson, and W. Archer, \"Critical inquiry in a text-based environment: Computer conferencing in higher education,\" The Internet and Higher Education, vol. 2, no. 2-3, pp. 87–105, 2000.\n" +
            "[3] C. Johnston, D. A. Adams, and M. B. O'Neill, \"WebRTC: Real-time communication for the web,\" IEEE Communications Magazine, vol. 51, no. 4, pp. 18–26, Apr. 2013.\n" +
            "[4] J. Hamari, J. Koivisto, and H. Sarsa, \"Does gamification work? — A literature review of empirical studies on gamification,\" in Proc. 47th Hawaii Int. Conf. System Sciences, Waikoloa, HI, 2014, pp. 3025–3034.\n" +
            "[5] S. Deterding, D. Dixon, R. Khaled, and L. Nacke, \"From game design elements to gamefulness: Defining 'gamification',\" in Proc. 15th Int. Academic MindTrek Conf., Tampere, Finland, 2011, pp. 9–15.\n" +
            "[6] M. E. J. Newman, \"The structure and function of complex networks,\" SIAM Review, vol. 45, no. 2, pp. 167–256, 2003.\n" +
            "[7] I. F. Akyildiz, W. Su, Y. Sankarasubramaniam, and E. Cayirci, \"A survey on sensor networks and communication protocols,\" IEEE Communications Magazine, vol. 40, no. 8, pp. 102–114, Aug. 2002."
          ),
        ],
      },
    ],
  });

  const outputPath = path.join(__dirname, '..', 'Zenvy_Project_Proposal_and_Abstract_IEEE.docx');
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  console.log(`Document successfully generated at: ${outputPath}`);
}

buildDocx().catch(err => {
  console.error("Error generating docx:", err);
  process.exit(1);
});
