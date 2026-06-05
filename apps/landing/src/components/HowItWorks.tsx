interface Step {
  title: string;
  description: string;
}

interface Props {
  heading: string;
  steps: Step[];
}

export function HowItWorks({ heading, steps }: Props) {
  return (
    <section className="py-20 px-6 bg-coal/40 border-y border-stone/40">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-pearl mb-12 text-center">
          {heading}
        </h2>
        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, idx) => (
            <li key={step.title} className="relative">
              <div className="w-12 h-12 rounded-full bg-ember/15 border-2 border-ember/40 text-ember font-extrabold text-xl flex items-center justify-center mb-4">
                {idx + 1}
              </div>
              <h3 className="text-lg font-bold text-pearl mb-2">{step.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
