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
