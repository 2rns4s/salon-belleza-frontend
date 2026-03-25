# Agent Teams Lite — Agent Skills Index

When working on this project, read `.atl/skill-registry.md` first and then load the relevant skill(s) BEFORE writing any code.

## How to Use

1. Read `.atl/skill-registry.md` to resolve the current active skill locations
2. Check the trigger column to find skills that match your current task
3. Load the skill by reading the `SKILL.md` file at the listed path
4. Follow ALL patterns and rules from the loaded skill
5. Multiple skills can apply simultaneously

## Skills

| Skill | Trigger | Path |
|-------|---------|------|
| `sdd-init` | When initializing SDD in a project, or user says "sdd init". | `~/.copilot/skills/sdd-init/SKILL.md` |
| `sdd-explore` | When thinking through a feature, investigating the codebase, or clarifying requirements. | `~/.copilot/skills/sdd-explore/SKILL.md` |
| `sdd-propose` | When creating or updating a change proposal with intent, scope, and approach. | `~/.copilot/skills/sdd-propose/SKILL.md` |
| `sdd-spec` | When writing or updating specifications with requirements and scenarios. | `~/.copilot/skills/sdd-spec/SKILL.md` |
| `sdd-design` | When writing or updating technical design with architecture decisions. | `~/.copilot/skills/sdd-design/SKILL.md` |
| `sdd-tasks` | When breaking down a change into implementation task checklist. | `~/.copilot/skills/sdd-tasks/SKILL.md` |
| `sdd-apply` | When implementing tasks, writing actual code following specs and design. | `~/.copilot/skills/sdd-apply/SKILL.md` |
| `sdd-verify` | When validating that implementation matches specs, design, and tasks. | `~/.copilot/skills/sdd-verify/SKILL.md` |
| `sdd-archive` | When archiving a completed change after implementation and verification. | `~/.copilot/skills/sdd-archive/SKILL.md` |