type SummaryItem = {
  id: string;
  question: string;
  totalResponses: number;
  average: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
};

type SummaryCardsProps = {
  items: SummaryItem[];
};

export default function SummaryCards({ items }: SummaryCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {items.map((item) => (
        <div key={item.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
          <h2 className="font-semibold text-slate-900">{item.question}</h2>
          <p className="mt-2 text-sm text-slate-600">Jumlah jawaban: {item.totalResponses}</p>
          <p className="text-sm text-slate-600">Rata-rata: {item.average.toFixed(2)}</p>
          <div className="mt-3 grid grid-cols-5 gap-2 text-center text-sm">
            {[1, 2, 3, 4, 5].map((num) => (
              <div key={num} className="rounded-lg bg-slate-100 p-2">
                <div className="font-semibold text-slate-900">{num}</div>
                <div className="text-slate-700">{item.distribution[num as 1 | 2 | 3 | 4 | 5]}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
