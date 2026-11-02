import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';

const tsconfigPath = fileURLToPath(new URL('../tsconfig.base.json', import.meta.url));

function loadOptions(): ts.CompilerOptions {
  const { config, error } = ts.readConfigFile(tsconfigPath, ts.sys.readFile);
  expect(error).toBeUndefined();
  const parsed = ts.parseJsonConfigFileContent(
    config,
    ts.sys,
    fileURLToPath(new URL('..', import.meta.url)),
  );
  return parsed.options;
}

function diagnose(source: string): ts.Diagnostic[] {
  const options = loadOptions();
  // TypeScript normaliza las rutas con "/", también en Windows.
  const virtualFile = fileURLToPath(new URL('./virtual.ts', import.meta.url)).replaceAll('\\', '/');
  const host = ts.createCompilerHost(options);
  const getSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (fileName, languageVersion, ...rest) =>
    fileName === virtualFile
      ? ts.createSourceFile(fileName, source, languageVersion)
      : getSourceFile(fileName, languageVersion, ...rest);
  const program = ts.createProgram([virtualFile], options, host);
  // Evita un falso verde: el archivo virtual tiene que estar realmente en el programa.
  expect(program.getSourceFile(virtualFile)).toBeDefined();
  return ts.getPreEmitDiagnostics(program).filter((d) => d.file?.fileName === virtualFile);
}

describe('tsconfig.base.json', () => {
  it('tsconfig.base rechaza implicit any', () => {
    const options = loadOptions();
    expect(options.strict).toBe(true);
    expect(options.noImplicitAny).toBe(true);
    expect(options.verbatimModuleSyntax).toBe(true);

    const codes = diagnose('export function f(x) { return x; }\n').map((d) => d.code);
    expect(codes).toContain(7006);
  });

  it('tsconfig.base acepta código tipado', () => {
    const diagnostics = diagnose('export function f(x: number): number { return x; }\n');
    expect(diagnostics.map((d) => d.messageText)).toEqual([]);
    expect(loadOptions().noUnusedLocals).toBe(true);
  });
});
