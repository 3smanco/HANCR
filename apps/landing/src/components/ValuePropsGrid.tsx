import type { LucideIcon } from 'lucide-react';

export interface ValueProp {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface Props {
  heading?: string;
  subheading?: string;
  items: ValueProp[];
  columns?: 2 | 3 | 4;
}

export function ValuePropsGrid({ heading, subheading, items, columns = 3 }: Props) {
  const gridCls =
    columns === 4
      ? 'sm:grid-cols-2 lg:grid-cols-4'
      : columns === 2
        ? 'sm:grid-cols-2'
        : 'sm:grid-cols-2 lg:grid-cols-3';

  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        {heading ? (
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-pearl mb-3">
              {heading}
            </h2>
            {subheading ? (
              <p className="text-lg text-muted max-w-2xl mx-auto">{subheading}</p>
            ) : null}
          </div>
        ) : null}
        <div className={`grid gap-6 ${gridCls}`}>
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="bg-ash/50 border border-stone/60 rounded-2xl p-6 hover:border-ember/40 transition"
              >
                <div className="w-12 h-12 rounded-xl bg-ember/15 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-ember" />
                </div>
                <h3 className="text-lg font-bold text-pearl mb-2">{item.title}</h3>
                <p className="text-muted leading-relaxed text-sm">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
