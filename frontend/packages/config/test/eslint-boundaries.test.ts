import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';
import { nexaEslintConfig } from '../eslint/index.mjs';

const root = fileURLToPath(new URL('./fixtures/frontend/', import.meta.url));
const backoffice = 'apps/backoffice/src';
const clientes = `${backoffice}/features/clientes`;

const eslint = new ESLint({
  cwd: root,
  overrideConfigFile: true,
  overrideConfig: nexaEslintConfig({ root }),
  ignore: false,
});

async function lint(file: string, code: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath: join(root, file) });
  const fatal = result.messages.filter((message) => message.fatal);
  expect(fatal, `error de parseo: ${JSON.stringify(fatal)}`).toEqual([]);
  return result.messages.map((message) => message.ruleId ?? 'sin-regla');
}

const boundariesIds = (ruleIds: string[]) => ruleIds.filter((id) => id.startsWith('boundaries/'));

describe('R1: un feature importa de otro solo su index.ts', () => {
  it('R1: feature importa internals de otro feature → error', async () => {
    const ruleIds = await lint(
      `${clientes}/pages/ListaPage.tsx`,
      "import '../../polizas/components/X';\n",
    );
    expect(ruleIds).toContain('boundaries/dependencies');
  });

  it('R1: feature importa index.ts de otro feature → sin error', async () => {
    const ruleIds = await lint(
      `${clientes}/pages/ListaPage.tsx`,
      "import '../../polizas/index';\n",
    );
    expect(boundariesIds(ruleIds)).toEqual([]);
  });
});

describe('R2: solo pages importa pages', () => {
  it('R2: pages importa components, api y schemas → sin error', async () => {
    const ruleIds = await lint(
      `${clientes}/pages/ListaPage.tsx`,
      [
        "import '../components/Y';",
        "import '../api/useClientes';",
        "import '../schemas/cliente';",
        '',
      ].join('\n'),
    );
    expect(boundariesIds(ruleIds)).toEqual([]);
  });

  it('R2: components importa pages → error', async () => {
    const ruleIds = await lint(`${clientes}/components/Z.tsx`, "import '../pages/ListaPage';\n");
    expect(ruleIds).toContain('boundaries/dependencies');
  });

  it('R2: schemas importa pages → error', async () => {
    const ruleIds = await lint(`${clientes}/schemas/otro.ts`, "import '../pages/ListaPage';\n");
    expect(ruleIds).toContain('boundaries/dependencies');
  });
});

describe('R3: shared y ui-package no importan features', () => {
  it('R3: shared importa feature → error', async () => {
    const ruleIds = await lint(
      `${backoffice}/shared/otro.ts`,
      "import '../features/clientes/index';\n",
    );
    expect(ruleIds).toContain('boundaries/dependencies');
  });

  it('R3: ui-package importa feature → error', async () => {
    const ruleIds = await lint(
      'packages/ui/src/Boton.tsx',
      "import '../../../apps/backoffice/src/features/clientes/index';\n",
    );
    expect(ruleIds).toContain('boundaries/dependencies');
  });
});

describe('R4: los features no importan el app-shell', () => {
  it('R4: feature importa app-shell → error', async () => {
    const ruleIds = await lint(
      `${clientes}/pages/ListaPage.tsx`,
      "import '../../../app/router';\n",
    );
    expect(ruleIds).toContain('boundaries/dependencies');
  });

  it('R4: app-shell importa feature index.ts → sin error', async () => {
    const ruleIds = await lint(
      `${backoffice}/app/router.tsx`,
      "import '../features/clientes/index';\n",
    );
    expect(boundariesIds(ruleIds)).toEqual([]);
  });
});

describe('R5: una app no importa la otra', () => {
  it('R5: backoffice importa web-publica → error', async () => {
    const ruleIds = await lint(
      `${backoffice}/shared/otro.ts`,
      "import '../../../web-publica/src/shared/util';\n",
    );
    expect(ruleIds).toContain('no-restricted-imports');
  });

  it('R5: ui-package importa de apps → error', async () => {
    const ruleIds = await lint(
      'packages/ui/src/Boton.tsx',
      "import '../../../apps/web-publica/src/shared/util';\n",
    );
    expect(ruleIds).toContain('no-restricted-imports');
  });
});

describe('R6 y R7: any explícito y accesibilidad', () => {
  it('R6: any explícito → error', async () => {
    const ruleIds = await lint(`${backoffice}/shared/otro.ts`, 'export const f = (x: any) => x;\n');
    expect(ruleIds).toContain('@typescript-eslint/no-explicit-any');
  });

  it('R7: img sin alt → error', async () => {
    const ruleIds = await lint(
      `${backoffice}/shared/Otro.tsx`,
      'export const Otro = () => <img src="a.png" />;\n',
    );
    expect(ruleIds).toContain('jsx-a11y/alt-text');
  });
});
