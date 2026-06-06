import { cn } from "@/lib/utils";

type BentoItem = {
  title: string;
  description: string;
  stat?: string;
  tone?: "violet" | "pink" | "coral" | "teal";
};

const tones = {
  violet: "border-primary/15 bg-primary/[0.04]",
  pink: "border-[#EC4899]/20 bg-[#EC4899]/[0.04]",
  coral: "border-[#FF6B6B]/20 bg-[#FF6B6B]/[0.05]",
  teal: "border-[#0F766E]/20 bg-[#0F766E]/[0.04]",
};

const statColors = {
  violet: "text-primary",
  pink: "text-[#EC4899]",
  coral: "text-[#FF6B6B]",
  teal: "text-[#0F766E]",
};

export function MagicBento({ items }: { items: BentoItem[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map((item, index) => (
        <article
          key={item.title}
          className={cn(
            "group relative overflow-hidden rounded-xl border p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg",
            tones[item.tone ?? "violet"],
            index === 0 && "md:col-span-2"
          )}
        >
          {item.stat ? (
            <p className={cn(
              "mb-5 font-heading text-4xl font-bold tracking-tight",
              statColors[item.tone ?? "violet"]
            )}>
              {item.stat}
            </p>
          ) : null}
          <h3 className="font-heading text-xl font-bold text-foreground">
            {item.title}
          </h3>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            {item.description}
          </p>
        </article>
      ))}
    </div>
  );
}
