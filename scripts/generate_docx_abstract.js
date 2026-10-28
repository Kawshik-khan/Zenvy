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

// IEEE Colors
const COLOR_PRIMARY = "003366"; // Deep IEEE Navy Blue
const COLOR_TEXT = "222222";
const COLOR_MUTED = "555555";
const COLOR_LIGHT_BG = "F4F6F9";
const COLOR_BORDER = "CCCCCC";

function createHeaderTitle(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 240, after: 120 },
    children: [
      new TextRun({
        text: text,
        bold: true,
        size: 34, // 17pt
        font: "Times New Roman",
        color: COLOR_PRIMARY,
      }),
    ],
  });
}

function createSubtitle(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 180 },
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
        text: "Technical Project Abstract | IEEE Format\n",
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
        text: "Zenvy Development Team — Smart Peer-to-Peer Study Platform",
        size: 20,
        italics: true,
        font: "Times New Roman",
        color: COLOR_MUTED,
      }),
    ],
  });
}

function createAbstractParagraph(abstractText) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 180, after: 180, line: 280 },
    children: [
      new TextRun({
        text: "Abstract—",
        bold: true,
        italics: true,
        size: 21, // 10.5pt
        font: "Times New Roman",
      }),
      new TextRun({
        text: abstractText,
        size: 21,
        font: "Times New Roman",
        bold: false,
        color: COLOR_TEXT,
      }),
    ],
  });
}

function createKeywordsParagraph(keywords) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 120, after: 320, line: 280 },
    children: [
      new TextRun({
        text: "Index Terms—",
        bold: true,
        italics: true,
        size: 21,
        font: "Times New Roman",
      }),
      new TextRun({
        text: keywords.join(", "),
        size: 21,
        font: "Times New Roman",
        italics: true,
        color: COLOR_TEXT,
      }),
    ],
  });
}

function createSummaryBox() {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    alignment: AlignmentType.CENTER,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: COLOR_LIGHT_BG, type: ShadingType.CLEAR },
            margins: { top: 180, bottom: 180, left: 220, right: 220 },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 2, color: COLOR_PRIMARY },
              bottom: { style: BorderStyle.SINGLE, size: 2, color: COLOR_PRIMARY },
              left: { style: BorderStyle.SINGLE, size: 2, color: COLOR_PRIMARY },
              right: { style: BorderStyle.SINGLE, size: 2, color: COLOR_PRIMARY },
            },
            children: [
              new Paragraph({
                spacing: { before: 60, after: 100 },
                children: [
                  new TextRun({
                    text: "Key Platform Highlights & Innovation Summary:",
                    bold: true,
                    size: 20,
                    font: "Times New Roman",
                    color: COLOR_PRIMARY,
                  }),
                ],
              }),
              new Paragraph({
                bullet: { level: 0 },
                spacing: { before: 40, after: 60 },
                children: [
                  new TextRun({ text: "Algorithmic Peer Matching: ", bold: true, size: 19, font: "Times New Roman" }),
                  new TextRun({ text: "Multi-parameter heuristic scoring across majors, shared course interests, weekly availability, college affiliation, and semester proximity.", size: 19, font: "Times New Roman" }),
                ],
              }),
              new Paragraph({
                bullet: { level: 0 },
                spacing: { before: 40, after: 60 },
                children: [
                  new TextRun({ text: "Ultra-Low Latency Communication: ", bold: true, size: 19, font: "Times New Roman" }),
                  new TextRun({ text: "Integrated WebRTC & LiveKit audio/video calling with automated hardware release privacy handlers and Socket.io bidirectional signaling.", size: 19, font: "Times New Roman" }),
                ],
              }),
              new Paragraph({
                bullet: { level: 0 },
                spacing: { before: 40, after: 60 },
                children: [
                  new TextRun({ text: "Gamified Habit Formation: ", bold: true, size: 19, font: "Times New Roman" }),
                  new TextRun({ text: "Synchronized Pomodoro focus timer, quadratic XP leveling curves, streak counters, and a 28-day longitudinal activity heatmap.", size: 19, font: "Times New Roman" }),
                ],
              }),
              new Paragraph({
                bullet: { level: 0 },
                spacing: { before: 40, after: 60 },
                children: [
                  new TextRun({ text: "Full-Stack Modern Architecture: ", bold: true, size: 19, font: "Times New Roman" }),
                  new TextRun({ text: "Next.js 15 (App Router), React 19, Node.js, Prisma ORM, PostgreSQL with PgBouncer, Upstash Redis, and Supabase Storage.", size: 19, font: "Times New Roman" }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

async function buildAbstractDocx() {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Times New Roman",
            size: 21,
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
              top: convertInchesToTwip(1.0),
              bottom: convertInchesToTwip(1.0),
              left: convertInchesToTwip(1.0),
              right: convertInchesToTwip(1.0),
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
                    text: "Zenvy: Smart Peer-to-Peer Study Platform | IEEE Abstract",
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
          // Title & Subtitle
          createHeaderTitle("ZENVY: AN INTELLIGENT PEER-TO-PEER COLLABORATIVE STUDY PLATFORM WITH MULTI-FACTOR COMPATIBILITY MATCHING AND REAL-TIME SYNCHRONIZATION"),
          createSubtitle("Technical Abstract & Executive Overview"),
          createAuthorBlock(),

          // Abstract Text
          createAbstractParagraph(
            "In modern higher education, students frequently face academic isolation, fragmented collaborative toolsets, and high friction in discovering compatible study partners. Existing digital solutions either function as generic social messengers without educational context or as static learning management systems lacking peer discovery, synchronous interaction, and focus mechanics. This project proposes Zenvy, a high-performance, intelligent peer-to-peer collaborative study platform designed to bridge academic divides through real-time communication, heuristic partner matching, collaborative study groups, and gamified focus tracking. Built upon Next.js 15 App Router, Node.js, Prisma ORM, and PostgreSQL, Zenvy integrates WebRTC and LiveKit for zero-latency peer-to-peer audio/video calling alongside Socket.io for bidirectional signaling and real-time state synchronization. A multi-attribute discovery algorithm calculates academic synergy scores across academic majors, shared subject interests, availability schedules, institutional affiliation, and semester standing. Furthermore, the platform incorporates synchronized Pomodoro study sessions, dynamic 28-day activity heatmaps, experience point (XP) level progression, and robust privacy controls with automatic hardware release mechanisms. This work demonstrates an end-to-end full-stack educational architecture that eliminates tool-switching fragmentation, fosters sustained study habits, and accelerates collaborative learning in distributed academic environments."
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

          // Structured Innovation Summary Box
          createSummaryBox(),
        ],
      },
    ],
  });

  const outputPath = path.join(__dirname, '..', 'Zenvy_Abstract_IEEE.docx');
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
  console.log(`Abstract document successfully generated at: ${outputPath}`);
}

buildAbstractDocx().catch(err => {
  console.error("Error generating abstract docx:", err);
  process.exit(1);
});
