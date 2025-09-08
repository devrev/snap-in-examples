# 🤖 AGENTS.md

## Purpose
This file defines the operating model for AI agents and human contributors working on this repository. It establishes **goals, scope, and guardrails** so that automation produces consistent, high-quality outputs without scope creep or errors.

---

## 🎯 Core Objectives
- Maintain **accuracy and consistency** across all documentation in this repo.  
- Ensure **Codelabs**, **Cookbooks**, and **CLI docs** follow standardized workflows and DevRev guidelines.  
- Automate repetitive editing tasks while respecting repo boundaries.  

---

## 📂 Scope of Work

### ✅ Allowed Directories
- `codelabs/` → 15 Codelabs, must follow standardized **Setup → Code → Run → Verify** structure.   

### ❌ Out of Scope
- Do not generate or modify **source code** in `code/` directories.  
- Do not change **infrastructure configs** (`package.json`, `.github/`, `vercel.json`, etc.) unless explicitly instructed.  
- Do not use **external knowledge** about DevRev or Snap-ins. Documentation must derive from repo content.  

---

## 🧭 Operating Guidelines

### Documentation Rules
- Always include **frontmatter** (title, description).  
- Start visible content at **H2**.  
- Use **Setup, Code, Run, Verify** in all Codelabs.  
- Provide **full, untruncated code snippets**.  
- Add **expected output** in Verify sections.  

### Writing Standards
- **Voice**: Developer-first, active, concise.  
- **Terminology**: Use correct DevRev capitalization (`DevRev`, `snap-in`, `manifest.yaml`).  
- **Formatting**:  
  - Backticks for commands, file paths, code.  
  - Lists for sequential actions.  
  - Callouts for tips, warnings, errors.  

---

## 📋 Validation Protocol
Before finalizing changes, agents must confirm:
- [ ] All Codelabs have Setup → Code → Run → Verify flow.  
- [ ] Code snippets and manifests are complete.  
- [ ] Init, validate-manifest, and fixture creation covered in Setup.  
- [ ] Terminology is consistent with DevRev style.  
- [ ] Internal/external links are valid.  
- [ ] No speculative or external content added.  

---

## 🛡️ Guardrails
- **Ground Truth**: All factual claims must be based on files in this repo.  
- **No Speculation**: If information is missing, leave a placeholder or flag for human review.  
- **Consistency First**: Enforce standard formats across all docs.  
- **Evidence Required**: Cite file paths and line numbers when referencing code.  

---

## 🚀 Execution Flow
1. Identify target directory (`codelabs/`).  
2. Apply **scope + writing guidelines**.  
3. Revise or create documentation using repo content.  
4. Run through **Validation Protocol**.  
5. Commit with a descriptive message (e.g., `docs: revise codelab 03 with standardized structure`).  

---

## 📌 Success Definition
- 100% of Codelabs revised to standardized format.  
- Cookbook entries are short, targeted, and runnable.  
- CLI docs map directly to actual code in repo.  
- All docs are actionable, accurate, and consistent.
