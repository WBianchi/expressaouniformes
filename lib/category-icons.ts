// Ícones que uma categoria pode usar (nomes do lucide-react; o desenho fica em components/ui/primitives).
export const categoryIcons = ["Shirt", "HardHat", "Ruler", "Stethoscope", "CloudSun", "ChefHat", "TriangleAlert"] as const;
export type CategoryIconName = (typeof categoryIcons)[number];

export const categoryIconLabels: Record<CategoryIconName, string> = {
  Shirt: "Camiseta",
  HardHat: "Capacete (operacional)",
  Ruler: "Régua (calças e medidas)",
  Stethoscope: "Estetoscópio (saúde)",
  CloudSun: "Clima (moletons)",
  ChefHat: "Chapéu de chef (alimentação)",
  TriangleAlert: "Alerta (alta visibilidade)",
};
