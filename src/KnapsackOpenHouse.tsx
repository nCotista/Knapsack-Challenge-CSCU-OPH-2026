import React, { useEffect, useMemo, useState } from "react";

/**
 * Knapsack Open House — Interactive Game (Thai)
 * Single-file React component. TailwindCSS recommended for styling.
 * No external deps. Drop this into your React app and render <KnapsackOpenHouse />
 */

// ---------- Utilities ----------
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

type Item = {
  id: string;
  name: string; // English name matched to emoji
  weight: number;
  value: number;
  emoji: string;
};

type Difficulty = "ง่าย" | "กลาง" | "ยาก";

// Dynamic programming solver for 0-1 knapsack
function solveKnapsack(items: Item[], capacity: number) {
  const n = items.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(capacity + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    const { weight: w, value: v } = items[i - 1];
    for (let c = 0; c <= capacity; c++) {
      if (w <= c) {
        dp[i][c] = Math.max(dp[i - 1][c], dp[i - 1][c - w] + v);
      } else {
        dp[i][c] = dp[i - 1][c];
      }
    }
  }

  // reconstruct chosen items
  let c = capacity;
  const chosen: string[] = [];
  for (let i = n; i >= 1; i--) {
    if (dp[i][c] !== dp[i - 1][c]) {
      chosen.push(items[i - 1].id);
      c -= items[i - 1].weight;
    }
  }
  chosen.reverse();
  return { bestValue: dp[n][capacity], chosenIds: new Set(chosen), table: dp };
}

// Prettify weight/value
function fmt(n: number): string {
  return n.toLocaleString("th-TH");
}

// Emoji catalog with English names (maps each emoji to a fixed English label)
const EMOJI_CATALOG: Array<{ emoji: string; name: string }> = [
  { emoji: "🧪", name: "Potion" },
  { emoji: "📘", name: "Book" },
  { emoji: "🧩", name: "Puzzle Piece" },
  { emoji: "🧁", name: "Cupcake" },
  { emoji: "⚙️", name: "Gear" },
  { emoji: "💎", name: "Gem" },
  { emoji: "🥤", name: "Soda" },
  { emoji: "📷", name: "Camera" },
  { emoji: "🎮", name: "Game Controller" },
  { emoji: "🎧", name: "Headphones" },
  { emoji: "🔬", name: "Microscope" },
  { emoji: "🧠", name: "Brain Booster" },
  { emoji: "🪙", name: "Coin" },
  { emoji: "🍫", name: "Chocolate Bar" },
  { emoji: "🌟", name: "Star Badge" },
  { emoji: "🚀", name: "Rocket" },
  { emoji: "🧸", name: "Teddy Bear" },
  { emoji: "📦", name: "Supply Box" },
  { emoji: "🍎", name: "Apple" },
  { emoji: "🥇", name: "Gold Medal" },
];

function generateItems(difficulty: Difficulty): Item[] {
  const count = difficulty === "ง่าย" ? 6 : difficulty === "กลาง" ? 8 : 10;
  const items: Item[] = [];
  for (let i = 0; i < count; i++) {
    const weight = randInt(1, difficulty === "ยาก" ? 15 : 10);
    const value = randInt(2, difficulty === "ยาก" ? 30 : 20);
    const catalog = EMOJI_CATALOG[i % EMOJI_CATALOG.length];
    items.push({
      id: uid(),
      name: catalog.name, // English name matched to emoji
      weight,
      value,
      emoji: catalog.emoji,
    });
  }
  return items;
}

function capacityFor(items: Item[], diff: Difficulty): number {
  const totalW = items.reduce((s, it) => s + it.weight, 0);
  const ratio = diff === "ง่าย" ? 0.45 : diff === "กลาง" ? 0.38 : 0.33;
  return Math.max(8, Math.floor(totalW * ratio));
}

// ---------- Drag & Drop hooks ----------
function useDragDrop() {
  const [dragId, setDragId] = useState<string | null>(null);
  const onDragStart = (id: string) => (e: React.DragEvent) => {
    setDragId(id);
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragEnd = () => setDragId(null);
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };
  const claimId = (e: React.DragEvent) => {
    const id = e.dataTransfer.getData("text/plain");
    return id || dragId;
  };
  return { dragId, onDragStart, onDragEnd, onDragOver, claimId };
}

// ---------- Tests (simple runtime assertions) ----------
function runKnapsackTests() {
  const results: { name: string; pass: boolean; detail?: string }[] = [];

  // T1: Known optimum combination
  const items1: Item[] = [
    { id: "a", name: "A", weight: 1, value: 1, emoji: "🧪" },
    { id: "b", name: "B", weight: 2, value: 6, emoji: "💎" },
    { id: "c", name: "C", weight: 5, value: 18, emoji: "🚀" },
    { id: "d", name: "D", weight: 6, value: 22, emoji: "🎮" },
  ];
  const s1 = solveKnapsack(items1, 7);
  results.push({ name: "T1 best value", pass: s1.bestValue === 24, detail: `got ${s1.bestValue}` });

  // T2: Capacity zero
  const s2 = solveKnapsack(items1, 0);
  results.push({ name: "T2 zero capacity", pass: s2.bestValue === 0, detail: `got ${s2.bestValue}` });

  // T3: All items heavier than capacity
  const items3: Item[] = [
    { id: "x", name: "X", weight: 10, value: 100, emoji: "💎" },
  ];
  const s3 = solveKnapsack(items3, 5);
  results.push({ name: "T3 too heavy", pass: s3.bestValue === 0, detail: `got ${s3.bestValue}` });

  // T4: Chosen items sum to best value
  const sumChosen = Array.from(s1.chosenIds).reduce((acc, id) => {
    const it = items1.find((i) => i.id === id)!;
    return acc + it.value;
  }, 0);
  results.push({ name: "T4 sum chosen equals best", pass: sumChosen === s1.bestValue, detail: `sum ${sumChosen}` });

  return results;
}

// ---------- Main Component ----------
export default function KnapsackOpenHouse() {
  const [difficulty, setDifficulty] = useState<Difficulty>("กลาง");
  const [items, setItems] = useState<Item[]>(() => generateItems("กลาง"));
  const [capacity, setCapacity] = useState<number>(() => capacityFor(generateItems("กลาง"), "กลาง"));
  const [pickedIds, setPickedIds] = useState<Set<string>>(new Set());
  const [showExplain, setShowExplain] = useState(false);
  const [timerOn, setTimerOn] = useState(false);
  const [seconds, setSeconds] = useState(0);

  // keep capacity in sync when items/difficulty change
  useEffect(() => {
    setCapacity(capacityFor(items, difficulty));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, difficulty]);

  // timer
  useEffect(() => {
    if (!timerOn) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [timerOn]);

  const backpackWeight = useMemo(
    () => items.filter((i) => pickedIds.has(i.id)).reduce((s, it) => s + it.weight, 0),
    [items, pickedIds]
  );
  const backpackValue = useMemo(
    () => items.filter((i) => pickedIds.has(i.id)).reduce((s, it) => s + it.value, 0),
    [items, pickedIds]
  );

  const solution = useMemo(() => solveKnapsack(items, capacity), [items, capacity]);
  const isOptimal = backpackValue === solution.bestValue && backpackWeight <= capacity;

  function resetGame(newDiff?: Difficulty): void {
    const d = newDiff ?? difficulty;
    setDifficulty(d);
    const its = generateItems(d);
    setItems(its);
    setCapacity(capacityFor(its, d));
    setPickedIds(new Set());
    setShowExplain(false);
    setSeconds(0);
    setTimerOn(false);
  }

  function handleDropToBackpack(e: React.DragEvent): void {
    e.preventDefault();
    const id = (e.dataTransfer.getData("text/plain") || "").trim();
    if (!id) return;
    const next = new Set(pickedIds);
    next.add(id);
    setPickedIds(next);
  }

  function handleDropToShelf(e: React.DragEvent): void {
    e.preventDefault();
    const id = (e.dataTransfer.getData("text/plain") || "").trim();
    if (!id) return;
    const next = new Set(pickedIds);
    next.delete(id);
    setPickedIds(next);
  }

  const capPct = Math.min(100, Math.round((backpackWeight / Math.max(capacity, 1)) * 100));

  const tests = useMemo(() => runKnapsackTests(), []);
  const allPass = tests.every((t) => t.pass);

  // ---------- UI ----------
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-slate-50 to-white text-slate-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">🎒 Knapsack Challenge — Open House</h1>
            <p className="text-slate-600 mt-1">ลากของเข้ากระเป๋าให้คุ้มค่าที่สุด ภายใต้ข้อจำกัดน้ำหนัก (0-1 Knapsack)</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              className="border rounded-xl px-3 py-2 shadow-sm"
              value={difficulty}
              onChange={(e) => resetGame(e.target.value as Difficulty)}
              title="เลือกระดับความยาก"
            >
              <option>ง่าย</option>
              <option>กลาง</option>
              <option>ยาก</option>
            </select>
            <button
              className="px-4 py-2 rounded-xl bg-slate-900 text-white shadow hover:opacity-90"
              onClick={() => resetGame()}
            >สุ่มโจทย์ใหม่</button>
          </div>
        </header>

        {/* Controls */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="col-span-2 bg-white rounded-2xl shadow p-4">
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-semibold">ความจุ (Capacity):</span>
                <input
                  type="range"
                  min={4}
                  max={40}
                  value={capacity}
                  onChange={(e) => setCapacity(parseInt(e.target.value))}
                />
                <span className="tabular-nums">{capacity}</span>
              </div>
              <Timer seconds={seconds} setSeconds={setSeconds} timerOn={timerOn} setTimerOn={setTimerOn} />
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm text-slate-600">น้ำหนักในกระเป๋า</div>
                <div className={`text-sm ${backpackWeight > capacity ? "text-red-600 font-semibold" : "text-slate-700"}`}>
                  {backpackWeight}/{capacity}
                </div>
              </div>
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                <div className={`h-full ${backpackWeight > capacity ? "bg-red-500" : "bg-sky-500"}`} style={{ width: `${capPct}%` }} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="font-semibold">คะแนน (Value)</div>
              <div className="font-mono">{fmt(backpackValue)}</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-sm text-slate-600">ค่าสูงสุดที่ทำได้</div>
              <div className="font-mono">{fmt(solution.bestValue)}</div>
            </div>
            <div className="mt-2 flex gap-2">
              <button
                className="flex-1 px-3 py-2 rounded-xl bg-indigo-600 text-white shadow hover:opacity-90"
                onClick={() => setShowExplain(true)}
              >เฉลย & อธิบาย</button>
              <button
                className="px-3 py-2 rounded-xl border hover:bg-slate-50"
                onClick={() => setPickedIds(new Set())}
              >เคลียร์กระเป๋า</button>
            </div>
            {isOptimal ? (
              <div className="text-green-700 text-sm mt-1">✅ เลือกได้เหมาะสุดแล้ว เก่งมาก!</div>
            ) : (
              <div className="text-slate-600 text-sm mt-1">ลองปรับดูให้ใกล้เคียงค่าสูงสุด</div>
            )}
          </div>
        </div>

        {/* Play Area */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Shelf */}
          <section className="bg-white rounded-2xl shadow p-4">
            <h2 className="font-semibold mb-2">ชั้นวางของ (ลากลงกระเป๋า)</h2>
            <div
              className="grid sm:grid-cols-2 md:grid-cols-3 gap-3"
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
              onDrop={handleDropToShelf}
            >
              {items.map((it) => (
                <ItemCard
                  key={it.id}
                  item={it}
                  picked={pickedIds.has(it.id)}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", it.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragEnd={() => {}}
                />
              ))}
            </div>
          </section>

          {/* Backpack */}
          <section className="bg-white rounded-2xl shadow p-4">
            <h2 className="font-semibold mb-2">กระเป๋าเป้ (ปล่อยของที่นี่)</h2>
            <div
              className={`min-h-[220px] rounded-xl border-2 border-dashed flex flex-col gap-3 p-3 ${backpackWeight > capacity ? "border-red-400 bg-red-50" : "border-sky-300 bg-sky-50"}`}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
              onDrop={handleDropToBackpack}
            >
              {Array.from(pickedIds).length === 0 ? (
                <div className="text-slate-500 text-sm">ลากของจากชั้นวางมาวางที่นี่</div>
              ) : (
                items.filter((i) => pickedIds.has(i.id)).map((it) => (
                  <PickedRow key={it.id} item={it} onRemove={() => {
                    const next = new Set(pickedIds);
                    next.delete(it.id);
                    setPickedIds(next);
                  }} />
                ))
              )}
            </div>
          </section>
        </div>

        {/* Explanation Modal */}
        {showExplain && (
          <ExplainModal onClose={() => setShowExplain(false)} items={items} capacity={capacity} solution={solution} />
        )}

        {/* Tests Panel */}
        <details className="mt-6 bg-white rounded-2xl shadow p-4">
          <summary className="cursor-pointer select-none font-semibold">Self-tests (DP)</summary>
          <div className="mt-2 text-sm">
            <div className={`mb-2 ${allPass ? "text-green-700" : "text-red-700"}`}>{allPass ? "All tests passed." : "Some tests failed."}</div>
            <ul className="list-disc ml-5 space-y-1">
              {tests.map((t, i) => (
                <li key={i} className={t.pass ? "text-green-700" : "text-red-700"}>
                  {t.name}: {t.pass ? "✅" : "❌"} {t.detail}
                </li>
              ))}
            </ul>
          </div>
        </details>

        {/* Footer tips */}
        <footer className="mt-8 text-sm text-slate-500">
          <p>
            ทริค: มองดูอัตราส่วน <span className="font-mono">value/weight</span> เพื่อคัดกรองเบื้องต้น
            (แต่จำไว้ว่านี่คือโจทย์ 0-1 เลือกซ้ำไม่ได้ และ greedy อาจไม่ดีที่สุดเสมอ)
          </p>
        </footer>
      </div>
    </div>
  );
}

function Timer({ seconds, setSeconds, timerOn, setTimerOn }:{
  seconds: number;
  setSeconds: React.Dispatch<React.SetStateAction<number>>;
  timerOn: boolean;
  setTimerOn: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        className={`px-3 py-1 rounded-lg border ${timerOn ? "bg-green-600 text-white" : "bg-white"}`}
        onClick={() => setTimerOn((t) => !t)}
      >{timerOn ? "⏱ กำลังนับ" : "⏱ เริ่มจับเวลา"}</button>
      <div className="text-sm text-slate-600">เวลา: <span className="font-mono">{seconds}s</span></div>
      <button className="px-3 py-1 rounded-lg border hover:bg-slate-50" onClick={() => setSeconds(0)}>รีเซ็ตเวลา</button>
    </div>
  );
}

function ItemCard({ item, picked, onDragStart, onDragEnd }:{ item: Item; picked: boolean; onDragStart: (e: React.DragEvent)=>void; onDragEnd: ()=>void }){
  const ratio = item.value / item.weight;
  return (
    <div
      className={`group relative rounded-xl border p-3 bg-white shadow-sm transition ${picked ? "opacity-40" : "hover:shadow"}`}
      draggable={!picked}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      title={picked ? "ของนี้อยู่ในกระเป๋าแล้ว" : "ลากเพื่อใส่กระเป๋า"}
    >
      <div className="flex items-start gap-3">
        <div className="text-2xl select-none">{item.emoji}</div>
        <div className="flex-1">
          <div className="font-semibold leading-tight">{item.name}</div>
          <div className="text-xs text-slate-500">น้ำหนัก {item.weight} • ค่า {item.value}</div>
        </div>
        <div className="text-[10px] bg-slate-100 px-2 py-1 rounded-full font-mono">{ratio.toFixed(2)}</div>
      </div>
      {picked && <div className="absolute inset-0 rounded-xl bg-white/60 grid place-items-center text-slate-600 text-sm">อยู่ในกระเป๋า</div>}
    </div>
  );
}

function PickedRow({ item, onRemove }:{ item: Item; onRemove: ()=>void }){
  return (
    <div className="flex items-center justify-between bg-white rounded-lg border p-3 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="text-xl">{item.emoji}</div>
        <div>
          <div className="font-medium leading-tight">{item.name}</div>
          <div className="text-xs text-slate-500">w={item.weight} • v={item.value}</div>
        </div>
      </div>
      <button onClick={onRemove} className="px-3 py-1 rounded-lg border hover:bg-slate-50">นำออก</button>
    </div>
  );
}

function ExplainModal({ onClose, items, capacity, solution }:{ onClose: ()=>void; items: Item[]; capacity: number; solution: ReturnType<typeof solveKnapsack> }){
  const { table, bestValue, chosenIds } = solution;
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm grid place-items-center p-4 z-50">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <div className="font-semibold">อธิบายวิธีคิดแบบ Dynamic Programming</div>
          <button className="px-3 py-1 rounded-lg border hover:bg-slate-50" onClick={onClose}>ปิด</button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-auto">
          <p className="text-slate-700 text-sm">
            เราสร้างตาราง <span className="font-mono">dp[i][c]</span> = ค่าสูงสุดเมื่อพิจารณาไอเท็ม 1..i และความจุ c.
            ถ้าน้ำหนักของไอเท็ม i (w) ไม่เกิน c จะเลือกค่าสูงสุดระหว่าง "ไม่เอา i" (<span className="font-mono">dp[i-1][c]</span>)
            กับ "เอา i" (<span className="font-mono">dp[i-1][c-w] + value(i)</span>).
          </p>

          {/* Beginner-friendly box */}
          <div className="bg-slate-50 border rounded-xl p-4 text-sm leading-6">
            <div className="font-semibold mb-1">อธิบายแบบคนไม่เคยเรียน DP มาก่อน</div>
            <ul className="list-disc ml-5 text-slate-700 space-y-1">
              <li>คิดภาพเหมือนเราไปช้อปปิ้งแล้วมีกระเป๋าที่รับน้ำหนักได้ <span className="font-mono">c</span> กิโล เราอยากได้ของที่ "คุ้มค่ารวม" สูงสุด</li>
              <li>ช่อง <span className="font-mono">dp[i][c]</span> = ค่าคุ้มสูงสุดเมื่อดูของถึงชิ้นที่ <span className="font-mono">i</span> และยอมให้น้ำหนักรวมไม่เกิน <span className="font-mono">c</span></li>
              <li>ถ้าของชิ้นนี้หนักเกินไป (w &gt; c) → เอาไม่ได้ ก็ลอกค่ามาจากแถวบน (เหมือนไม่หยิบ)</li>
              <li>ถ้าน้ำหนักพอ → เลือกให้ค่าสูงสุดระหว่าง "ไม่หยิบ" กับ "หยิบแล้วเหลือน้ำหนัก <span className="font-mono">c-w</span>"</li>
              <li>อ่านคำตอบจากช่องขวาล่าง แล้ว "ย้อนรอย" ขึ้นบน: ถ้าค่าต่างจากแถวบน แปลว่าเราหยิบชิ้นนั้น</li>
            </ul>
          </div>

          <div className="text-sm text-slate-600">คำตอบดีที่สุด: <span className="font-semibold">{fmt(bestValue)}</span> ด้วยการเลือก: {items.filter((it) => chosenIds.has(it.id)).map((it) => `${it.emoji} ${it.name}`).join(", ") || "-"}
          </div>

          {/* DP Table */}
          <div className="overflow-x-auto">
            <table className="text-xs border w-full min-w-[600px]">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="border px-2 py-1 text-left">i / c</th>
                  {Array.from({ length: capacity + 1 }, (_, c) => (
                    <th key={c} className="border px-2 py-1 text-right font-mono">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((it, iIdx) => (
                  <tr key={it.id} className={chosenIds.has(it.id) ? "bg-green-50" : ""}>
                    <td className="border px-2 py-1 whitespace-nowrap">
                      <div className="flex items-center gap-2"><span>{it.emoji}</span><span className="font-medium">{it.name}</span><span className="text-slate-500">(w={it.weight}, v={it.value})</span></div>
                    </td>
                    {Array.from({ length: capacity + 1 }, (_, c) => (
                      <td key={c} className="border px-2 py-1 text-right font-mono">{table[iIdx + 1][c]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <details className="text-sm">
            <summary className="cursor-pointer select-none font-semibold">ทำไม greedy ตามค่า v/w ถึงไม่ชนะเสมอ?</summary>
            <div className="mt-2 text-slate-700">
              บางครั้งการเลือกของที่อัตราส่วนดีแต่หนัก ทำให้พลาดการจับคู่หลายชิ้นที่รวมกันคุ้มกว่า — นี่จึงเป็นเหตุผลที่ DP ชนะสำหรับ 0-1 knapsack
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

export {};
