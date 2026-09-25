export type Garment = {
  collarEnabled: boolean;
  collarColor: string;
  sleevesEnabled: boolean;
  sleeveColor: string;
  sleeveDetail: "full" | "cuff";
  fabric: "cotton" | "pique" | "dryfit";
};
export const defaultGarment: Garment = {
  collarEnabled: false,
  collarColor: "#ffffff",
  sleevesEnabled: false,
  sleeveColor: "#ffffff",
  sleeveDetail: "full",
  fabric: "cotton",
};
export const fabrics = {
  cotton: {
    name: "Algodão",
    description: "Malha fosca e trama suave",
    roughness: 1,
    bump: 0.00035,
  },
  pique: {
    name: "Piquet",
    description: "Trama com relevo e textura marcada",
    roughness: 0.95,
    bump: 0.0011,
  },
  dryfit: {
    name: "Dry fit",
    description: "Microtrama e brilho suave",
    roughness: 0.65,
    bump: 0.00055,
  },
};
