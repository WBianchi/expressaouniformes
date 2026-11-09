"use client";
import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { QualifyFlow } from "@/components/qualify/QualifyFlow";

/**
 * "Solicitar orçamento": o mesmo questionário de qualificação das landing pages.
 * Poucas peças vão para o simulador; 30 ou mais, para um consultor da fábrica.
 */
export function QuoteGate({ open, onOpenChange, product }: { open: boolean; onOpenChange: (o: boolean) => void; product?: string }) {
  // remonta o questionário a cada abertura, para começar do zero
  const [round, setRound] = useState(0);
  const change = (o: boolean) => {
    onOpenChange(o);
    if (!o) setRound((r) => r + 1);
  };
  return (
    <Drawer open={open} onOpenChange={change} title="Solicitar orçamento" description="Responda rapidinho e mostramos o melhor caminho" width={540}>
      <QualifyFlow key={round} product={product} source="solicitar-orcamento" onNavigate={() => change(false)} />
    </Drawer>
  );
}
