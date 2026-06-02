type Quote = {
  lines: string[];
  source: string;
};

export default function RandomQuoteBlock({
  quotes,
  selectedIndex,
}: {
  quotes: Quote[];
  selectedIndex: number;
}) {
  const quote = quotes[selectedIndex] ?? { lines: ["명언이 없습니다."], source: "" };

  return (
    <div className="mt-4 max-w-2xl">
      <div className="space-y-0 text-sm leading-5 text-gray-600">
        {quote.lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
      <p className="mt-2 text-xs text-gray-400">{quote.source}</p>
    </div>
  );
}
