# Skill Registry

**Orchestrator use only.** Read this registry once per session to resolve skill paths, then pass pre-resolved paths directly to each sub-agent's launch prompt. Sub-agents receive the path and load the skill directly — they do NOT read this registry.

## User Skills

| Trigger | Skill | Path |
|---------|-------|------|
| (no trigger in frontmatter) | go-testing | /home/daniel/.config/opencode/skills/go-testing/SKILL.md |
| (no trigger in frontmatter) | skill-creator | /home/daniel/.config/opencode/skills/skill-creator/SKILL.md |
| Cuando el archivo termina en `.controller.js`. | vanilla-controller | /home/daniel/.config/opencode/skills/vanilla-controller/SKILL.md |
| Archivos `.css`. | vanilla-css-bem | /home/daniel/.config/opencode/skills/vanilla-css-bem/SKILL.md |
| Archivos `.service.js`. | vanilla-service | /home/daniel/.config/opencode/skills/vanilla-service/SKILL.md |
| Archivos `.view.js`. | vanilla-view | /home/daniel/.config/opencode/skills/vanilla-view/SKILL.md |
| (no trigger in frontmatter) | branch-pr | /home/daniel/.copilot/skills/branch-pr/SKILL.md |
| (no trigger in frontmatter) | issue-creation | /home/daniel/.copilot/skills/issue-creation/SKILL.md |

## Project Conventions

| File | Path | Notes |
|------|------|-------|
| AGENTS.md | /home/daniel/proyects/frontend-salon-belleza/AGENTS.md | Index — references files below |
| SKILL.md | SKILL.md | Referenced by AGENTS.md |
| SKILL.md | ~/.copilot/skills/sdd-apply/SKILL.md | Referenced by AGENTS.md |
| SKILL.md | ~/.copilot/skills/sdd-archive/SKILL.md | Referenced by AGENTS.md |
| SKILL.md | ~/.copilot/skills/sdd-design/SKILL.md | Referenced by AGENTS.md |
| SKILL.md | ~/.copilot/skills/sdd-explore/SKILL.md | Referenced by AGENTS.md |
| SKILL.md | ~/.copilot/skills/sdd-init/SKILL.md | Referenced by AGENTS.md |
| SKILL.md | ~/.copilot/skills/sdd-propose/SKILL.md | Referenced by AGENTS.md |
| SKILL.md | ~/.copilot/skills/sdd-spec/SKILL.md | Referenced by AGENTS.md |
| SKILL.md | ~/.copilot/skills/sdd-tasks/SKILL.md | Referenced by AGENTS.md |
| SKILL.md | ~/.copilot/skills/sdd-verify/SKILL.md | Referenced by AGENTS.md |
| skill-registry.md | .atl/skill-registry.md | Referenced by AGENTS.md |

Read the convention files listed above for project-specific patterns and rules. All referenced paths have been extracted — no need to read index files to discover more.
