/**
 * Centralização das cores dos eixos temáticos
 * Utilizado em etiquetas, badges e highlights em todo o projeto
 */

export type AxisId = "saude-mental" | "alimentacao" | "menopausa" | "emergentes";

export interface AxisColorConfig {
  bg: string;
  text: string;
}

export const AXIS_COLORS: Record<AxisId, AxisColorConfig> = {
  "saude-mental": { bg: "rgba(0,255,200,0.12)", text: "#0000FF" },
  alimentacao: { bg: "rgba(255,230,0,0.20)", text: "#0000FF" },
  menopausa: { bg: "rgba(255,0,150,0.12)", text: "#0000FF" },
  emergentes: { bg: "rgba(0,0,255,0.08)", text: "#0000FF" },
};

export const DEFAULT_AXIS_COLOR: AxisColorConfig = {
  bg: "rgba(0,0,255,0.08)",
  text: "#0000FF",
};

/**
 * Obter cores de um eixo com fallback seguro
 */
export function getAxisColors(axis: string): AxisColorConfig {
  return AXIS_COLORS[axis as AxisId] || DEFAULT_AXIS_COLOR;
}

/**
 * Cores para botões de filtro activos por eixo
 */
export interface AxisFilterStyle {
  bg: string;
  border: string;
  text: string;
}

const AXIS_FILTER_ACTIVE: Record<string, AxisFilterStyle> = {
  "saude-mental": { bg: "rgba(0,255,200,0.25)", border: "rgba(0,255,200,0.6)", text: "#0000FF" },
  alimentacao:    { bg: "rgba(255,230,0,0.35)", border: "rgba(255,230,0,0.7)", text: "#0000FF" },
  menopausa:      { bg: "rgba(255,0,150,0.2)",  border: "rgba(255,0,150,0.5)", text: "#0000FF" },
  emergentes:     { bg: "rgba(0,0,255,0.12)",   border: "rgba(0,0,255,0.4)",   text: "#0000FF" },
};

const DEFAULT_FILTER_ACTIVE: AxisFilterStyle = {
  bg: "#0000FF", border: "#0000FF", text: "#FFFFFF",
};

/**
 * Retorna o estilo do botão de filtro activo para um dado eixo.
 * "todos"/"all" ou valores desconhecidos devolvem o estilo padrão azul/branco.
 */
export function getAxisFilterStyle(axisId: string): AxisFilterStyle {
  return AXIS_FILTER_ACTIVE[axisId] || DEFAULT_FILTER_ACTIVE;
}
