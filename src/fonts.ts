const CURATED = [
  'Arial',
  'Arial Black',
  'Arial Narrow',
  'Calibri',
  'Cambria',
  'Comic Sans MS',
  'Consolas',
  'Courier New',
  'Garamond',
  'Georgia',
  'Helvetica',
  'Impact',
  'Lucida Console',
  'Monaco',
  'Palatino Linotype',
  'Roboto',
  'Segoe UI',
  'Tahoma',
  'Times New Roman',
  'Trebuchet MS',
  'Verdana',
];

export const validFontsSet = new Set(
  CURATED.map((f) => f.toLowerCase()),
);

export function getCuratedFonts(): string[] {
  return CURATED;
}

export function mergeFontLists(...fontLists: string[][]): string[] {
  const names = new Set<string>();
  fontLists.flat().forEach((font) => {
    const name = font.trim();
    if (name) names.add(name);
  });

  const fonts = [...names].sort((a, b) => a.localeCompare(b));
  fonts.forEach((font) => validFontsSet.add(font.toLowerCase()));
  return fonts;
}

export async function loadSystemFonts(): Promise<string[]> {
  if (!window.queryLocalFonts) {
    throw new Error('Not supported');
  }
  const fonts = await window.queryLocalFonts();
  const families = [...new Set(fonts.map((f) => f.family))].sort((a, b) =>
    a.localeCompare(b),
  );
  families.forEach((f) => validFontsSet.add(f.toLowerCase()));
  return families;
}

export function isValidFont(name: string): boolean {
  return validFontsSet.has(name.toLowerCase());
}
