# Agent Note: Semantic Issue and pull-request templates

Status: implemented

English | [中文](2026-09-03-semantic-issue-templates-and-policy.zh.md)

## Problem

Issue and pull-request templates mixed intake questions with review evidence and hid their complete contents in `details` elements. Unused frontmatter and separate Idea and Research templates added choices without changing how contributors described work.

## Decision

Issue templates cover Bug, Feature, and Task. Bug asks for a summary, reproduction, current behavior, expected behavior, and environment. Feature asks for motivation and behavior. Task asks for a summary and deliverables. Idea and Research belong in Task unless a future decision gives them distinct behavior.

Issue-template frontmatter contains only `name`, `about`, and `type`. Markdown headings define the hierarchy, and HTML comments explain what belongs under each heading.

The pull-request template contains `Motivation`; a `Changes` section with adjacent placeholders for public-interface and behavior changes; and `Testing` entries that show each method directly and place its proof in a local `details` element.

Templates are contributor guidance. CI does not validate their presentation or completed contents, and the repository has no Issue or Project lifecycle automation. The [repository automation decision](../simplification/2026-09-13-remove-repository-specific-external-automations.md) owns that absence.

## Alternatives considered

**Keep Idea and Research templates.** Their forms did not establish behavior distinct from Task, so separate entry points increased choice without preserving a meaningful distinction.

**Validate template presentation in CI.** Presentation checks can reject otherwise actionable work without proving that its motivation, expected behavior, or deliverables are clear. The repository does not require this process automation.

**Automatically repair metadata or classify Issues.** Those behaviors require mutation rules, credentials, failure handling, and an organization-owned planning process. They remain absent until the repository adopts that process explicitly.

## Consequences

Contributors see short forms whose headings match the information useful at Issue intake and pull-request review. The templates do not create or enforce labels, Issue types, priorities, Project membership, or lifecycle status.

Template changes receive ordinary code review without a dedicated static policy test. GitHub's native Issue and pull-request behavior remains authoritative.
