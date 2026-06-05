'use client';

import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';

export interface FAQ {
  q: string;
  a: string;
}

interface Props {
  heading: string;
  items: FAQ[];
}

export function FAQAccordion({ heading, items }: Props) {
  return (
    <section className="py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-pearl mb-10 text-center">
          {heading}
        </h2>
        <Accordion.Root type="single" collapsible className="space-y-3">
          {items.map((item, idx) => (
            <Accordion.Item
              key={idx}
              value={`item-${idx}`}
              className="bg-ash/50 border border-stone/60 rounded-xl overflow-hidden data-[state=open]:border-ember/50 transition"
            >
              <Accordion.Header>
                <Accordion.Trigger className="group w-full text-start flex items-center justify-between gap-4 px-5 py-4 text-pearl font-semibold hover:bg-ash transition">
                  <span>{item.q}</span>
                  <ChevronDown className="w-4 h-4 text-muted shrink-0 transition group-data-[state=open]:rotate-180" />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="overflow-hidden data-[state=open]:animate-fade-in">
                <div className="px-5 pb-5 text-muted leading-relaxed text-sm whitespace-pre-line">
                  {item.a}
                </div>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>
    </section>
  );
}
