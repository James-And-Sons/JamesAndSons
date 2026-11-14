import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import fs from "fs";
import path from "path";

async function generateSampleDocx() {
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({ text: "Title: ", bold: true }),
              new TextRun({
                text: "Guide to Architectural Ceiling Lighting in Luxury Mansions",
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Slug: ", bold: true }),
              new TextRun({
                text: "guide-to-architectural-ceiling-lighting-mansions",
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Meta Title: ", bold: true }),
              new TextRun({
                text: "Guide to Architectural Ceiling Lighting in Mansions | James & Sons",
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Meta Description: ", bold: true }),
              new TextRun({
                text: "Learn how to layer ambient, accent, and task ceiling lighting in high-ceiling mansions across India.",
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Excerpt: ", bold: true }),
              new TextRun({
                text: "Master the art of architectural ceiling lighting for high-ceiling villas and luxury residences.",
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Featured Image: ", bold: true }),
              new TextRun({
                text: "https://res.cloudinary.com/dy1durdrj/image/upload/v1785528826/2bbb030c-d5f2-4a7c-8f8e-c27f585dc052_hyymtq.png",
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Geo Takeaway: ", bold: true }),
              new TextRun({
                text: "In grand Indian luxury homes, combination lighting using recessed warm LEDs (3000K) and 12-light central chandeliers creates balanced luxury.",
              }),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "Architectural Ceiling Lighting Essentials",
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Ceiling lighting forms the backbone of any luxury interior space. Proper planning ensures that high ceilings don't create dark corners or overwhelming glare.",
              }),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "Featured Product Recommendation",
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "[product:12-light-black-chandelier-jc03]" }),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "FAQ",
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "Q: What lumens are recommended for double-height ceilings?",
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "A: For double-height ceilings (above 18 ft), select fixtures with at least 8,000 to 12,000 lumens total output.",
              }),
            ],
          }),
          new Paragraph({ text: "" }),
          new Paragraph({
            text: "Citations",
            heading: HeadingLevel.HEADING_2,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: "James & Sons Architectural Guide | https://jamesandsons.in/collections",
              }),
            ],
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join(__dirname, "sample_editorial.docx");
  fs.writeFileSync(outputPath, buffer);
  console.log(
    `✅ Successfully generated sample DOCX manuscript at ${outputPath}`,
  );
}

generateSampleDocx().catch((err) =>
  console.error("Error generating DOCX:", err),
);
