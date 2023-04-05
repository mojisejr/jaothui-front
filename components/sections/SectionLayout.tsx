import { JSXElementConstructor } from "react";

export interface SectionLayoutProps {
  children: any;
}
export default function SectionLayout({ children }: SectionLayoutProps) {
  return <div>{children}</div>;
}
