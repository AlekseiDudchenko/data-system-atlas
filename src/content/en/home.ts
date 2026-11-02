import type { homeCopy } from "../home";
export const homeEnglish: typeof homeCopy = {
  title: "How data systems work",
  intro:
    "Explore how software architectures evolve as requirements change, workloads grow and simple solutions reach their limits.",
  index: "01 / Exploration",
  name: "Scaling data transfers",
  question: "A million records. A simple script. What could go wrong?",
  description:
    "Start with a sequential copy. Add records until something breaks. Change one decision at a time and compare the trade-offs.",
  open: "Explore data transfers",
  path: "Sequential copy → a million records → cursor-based reads → batch writes",
};
