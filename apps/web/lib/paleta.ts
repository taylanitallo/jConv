// Paleta validada (skill dataviz) — categórica em ordem fixa, nunca ciclada, e status
// reservado (nunca reaproveitado como série categórica).
export const PALETA_CATEGORICA = [
  '#2a78d6', // blue
  '#1baf7a', // aqua
  '#eda100', // yellow
  '#008300', // green
  '#4a3aa7', // violet
  '#e34948', // red
  '#e87ba4', // magenta
  '#eb6834', // orange
] as const;

export const PALETA_STATUS = {
  bom: '#0ca30c',
  atencao: '#fab219',
  serio: '#ec835a',
  critico: '#d03b3b',
} as const;

export const CHROME_GRAFICO = {
  textoSecundario: '#52514e',
  textoMudo: '#898781',
  grade: '#e1e0d9',
  eixo: '#c3c2b7',
};
