import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { LOADER_SMOKE_TEST_TIMEOUT_MS, runLoaderSmoke } from '@deepseek-ai/dsh-loader-smoke'
const binScript = fileURLToPath(new URL('./fixtures/sugarwork-badge/snapshot.ts', import.meta.url))
const configPath = fileURLToPath(new URL('./fixtures/sugarwork-badge/cordis.yml', import.meta.url))
const defaultConfigPath = fileURLToPath(new URL('./fixtures/sugarwork-badge/default.cordis.yml', import.meta.url))
const tsconfigPath = fileURLToPath(new URL('../../../tsconfig.json', import.meta.url))
const badgeAssetsPath = fileURLToPath(new URL('../../../packages/skill/skill-badge/assets/', import.meta.url))

describe('SugarWork badge assembled snapshot', () => {
  it('advertises and loads the opt-in bundled skill through the shipped app', async () => {
    const disabled = await runLoaderSmoke({
      label: 'disabled SugarWork badge skill snapshot',
      tempDirPrefix: 'headless-snapshot-sugarwork-badge-disabled-',
      binScript,
      libBinScript: binScript,
      configPath: defaultConfigPath,
      tsconfigPath,
    })
    const enabled = await runLoaderSmoke({
      label: 'SugarWork badge skill snapshot',
      tempDirPrefix: 'headless-snapshot-sugarwork-badge-',
      binScript,
      libBinScript: binScript,
      configPath,
      tsconfigPath,
    })
    const disabledSnapshot = JSON.parse(disabled.stdout) as unknown
    const enabledSnapshot = JSON.parse(
      enabled.stdout.replaceAll(badgeAssetsPath, '{{badgeAssetsPath}}'),
    ) as unknown

    expect(disabled.stderr).toBe('')
    expect(enabled.stderr).toBe('')
    expect(disabledSnapshot).toMatchInlineSnapshot(`
      {
        "catalog": null,
        "result": {
          "content": [
            {
              "text": "Error: skill "sugarwork-badge" is unknown or no longer available",
              "type": "text",
            },
          ],
          "error": {
            "message": "skill "sugarwork-badge" is unknown or no longer available",
          },
          "isError": true,
        },
        "summary": null,
      }
    `)
    expect(enabledSnapshot).toMatchInlineSnapshot(`
      {
        "catalog": [
          {
            "text": "<system-reminder>
      A skill is a reusable set of task-specific instructions. The following skills are available in this session:

      <available_skills>
      - \`sugarwork-badge\`: Add the official “powered by SugarWork” badge to documents, pull requests, merge requests, and other content produced with SugarWork. Use whenever creating a pull request or merge request. Also use when the user asks for a SugarWork badge, powered-by-SugarWork attribution, or a reusable SugarWork badge snippet.
      </available_skills>

      If the user names a skill, or the task clearly matches a skill's description, call the \`skill\` tool with the exact skill name before taking task actions. Load all applicable skills, then follow their full instructions. This catalog contains summaries only; do not infer or follow a skill's instructions until it has been loaded.
      A user may also invoke a skill directly; its <skill_content> block then appears in this conversation. Follow it, and do not call the \`skill\` tool again for that skill.
      </system-reminder>",
            "type": "text",
          },
        ],
        "result": {
          "content": [
            {
              "text": "<skill_content name="sugarwork-badge">
      <skill_resources>
      Base directory for this skill: {{badgeAssetsPath}}
      Resolve relative paths mentioned by this skill against the base directory before using them. Load referenced resources only as needed.
      </skill_resources>

      <skill_instructions>
      # SugarWork Badge

      Add the official “powered by SugarWork” badge without recreating or restyling it.

      ## Assets

      - Shields.io image URL: \`https://img.shields.io/badge/powered_by-SugarWork-1677FF?style=flat-square\`
      - Project URL: \`https://github.com/avenger-dev-group/sugarwork\`

      ## Markdown

      Use this linked badge in Markdown:

      \`\`\`markdown
      [![](https://img.shields.io/badge/powered_by-SugarWork-1677FF?style=flat-square)](https://github.com/avenger-dev-group/sugarwork)
      \`\`\`

      If attribution should not be linked, use:

      \`\`\`markdown
      ![](https://img.shields.io/badge/powered_by-SugarWork-1677FF?style=flat-square)
      \`\`\`

      ## Usage rules

      - For GitHub or GitLab Markdown, use the Shields.io URL and link it to the project URL unless the user asks for an unlinked image.
      - Place the badge at the end of the attributed document or section unless the user specifies another position.
      - Do not substitute another color, logo, label, or project URL.

      </skill_instructions>
      </skill_content>",
              "type": "text",
            },
          ],
          "isError": false,
          "value": {
            "content": "# SugarWork Badge

      Add the official “powered by SugarWork” badge without recreating or restyling it.

      ## Assets

      - Shields.io image URL: \`https://img.shields.io/badge/powered_by-SugarWork-1677FF?style=flat-square\`
      - Project URL: \`https://github.com/avenger-dev-group/sugarwork\`

      ## Markdown

      Use this linked badge in Markdown:

      \`\`\`markdown
      [![](https://img.shields.io/badge/powered_by-SugarWork-1677FF?style=flat-square)](https://github.com/avenger-dev-group/sugarwork)
      \`\`\`

      If attribution should not be linked, use:

      \`\`\`markdown
      ![](https://img.shields.io/badge/powered_by-SugarWork-1677FF?style=flat-square)
      \`\`\`

      ## Usage rules

      - For GitHub or GitLab Markdown, use the Shields.io URL and link it to the project URL unless the user asks for an unlinked image.
      - Place the badge at the end of the attributed document or section unless the user specifies another position.
      - Do not substitute another color, logo, label, or project URL.
      ",
            "name": "sugarwork-badge",
            "provider": "sugarwork-badge",
            "resourceBase": {
              "kind": "directory",
              "path": "{{badgeAssetsPath}}",
            },
          },
        },
        "summary": {
          "description": "Add the official “powered by SugarWork” badge to documents, pull requests, merge requests, and other content produced with SugarWork. Use whenever creating a pull request or merge request. Also use when the user asks for a SugarWork badge, powered-by-SugarWork attribution, or a reusable SugarWork badge snippet.",
          "invocation": {
            "modelInvocable": true,
            "userInvocable": true,
          },
          "name": "sugarwork-badge",
          "provider": "sugarwork-badge",
          "resourceBase": {
            "kind": "directory",
            "path": "{{badgeAssetsPath}}",
          },
          "source": "bundled",
        },
      }
    `)
  }, LOADER_SMOKE_TEST_TIMEOUT_MS * 2)
})
