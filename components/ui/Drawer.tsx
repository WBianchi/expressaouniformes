"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import s from "./ui.module.css";

/** Painel lateral acessível (Radix Dialog) com blur no fundo e animação. */
export function Drawer({
  open,
  onOpenChange,
  title,
  description,
  side = "right",
  width = 440,
  header,
  footer,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  side?: "right" | "left" | "bottom";
  width?: number;
  /** conteúdo extra ao lado do título (contadores, ações) */
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className={s.overlay} />
        <Dialog.Content
          className={s.drawer}
          data-side={side}
          style={{ "--drawer-w": `${width}px` } as React.CSSProperties}
          aria-describedby={description ? undefined : undefined}
        >
          <div className={s.drawerHead}>
            <div>
              <Dialog.Title className={s.drawerTitle}>{title}</Dialog.Title>
              {description ? (
                <Dialog.Description className={s.drawerDesc}>{description}</Dialog.Description>
              ) : (
                <Dialog.Description className="sr-only">{title}</Dialog.Description>
              )}
            </div>
            {header}
            <Dialog.Close className="icon-btn" aria-label="Fechar">
              <X size={20} />
            </Dialog.Close>
          </div>
          <div className={s.drawerBody}>{children}</div>
          {footer && <div className={s.drawerFoot}>{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
