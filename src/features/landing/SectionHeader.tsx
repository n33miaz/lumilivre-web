interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  lead?: string;
}

export function SectionHeader({ eyebrow, title, lead }: SectionHeaderProps) {
  return (
    <div className="max-w-2xl mx-auto text-center mb-16">
      {eyebrow && (
        <span className="inline-block px-3 py-1 mb-4 rounded-full bg-lumi-100 dark:bg-lumi-500/20 text-lumi-600 dark:text-lumi-300 text-xs font-bold uppercase tracking-wider">
          {eyebrow}
        </span>
      )}
      <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 text-gray-900 dark:text-white">
        {title}
      </h2>
      {lead && (
        <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
          {lead}
        </p>
      )}
    </div>
  );
}
