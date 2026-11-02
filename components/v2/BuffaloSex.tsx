import { buffaloSex } from "../../utils/buffalo-sex";

export function BuffaloSex({ value }: { value?: string | null }) {
  const sex = buffaloSex(value);
  return <span data-buffalo-sex className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-xs font-medium text-muted">
    {sex.symbol && <span aria-hidden="true" className="text-sm">{sex.symbol}</span>}<span className="sr-only">เพศ </span>{sex.label}
  </span>;
}
