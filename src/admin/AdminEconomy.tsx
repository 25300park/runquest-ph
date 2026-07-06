import { useEffect, useState } from 'react';
import {
  listEconomyItems,
  updateEconomyItem,
  type AdminItem
} from './adminService';

export default function AdminEconomy() {
  const [items, setItems] = useState<AdminItem[]>([]);
  const [status, setStatus] = useState('Loading economy controls...');

  async function loadItems() {
    try {
      setItems(await listEconomyItems());
      setStatus('Economy controls ready.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not load economy items.');
    }
  }

  useEffect(() => {
    void loadItems();
  }, []);

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-stone-800 bg-stone-950 p-4">
        <p className="text-xs font-black uppercase text-amber-200">Token economy</p>
        <h2 className="mt-1 text-2xl font-black">Economy Control</h2>
        <p className="mt-2 text-sm text-stone-400">{status}</p>
      </div>

      <div className="grid gap-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-lg border border-stone-800 bg-stone-950 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-black">{item.name}</p>
                <p className="mt-1 text-xs text-stone-500">{item.type} · {item.rarity}</p>
              </div>
              <span className="rounded-md bg-stone-900 px-2 py-1 text-xs font-black text-amber-200">
                {item.token_price} RT
              </span>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-4">
              <label className="text-xs font-black uppercase text-stone-500">
                Price
                <input
                  type="number"
                  defaultValue={item.token_price}
                  onBlur={(event) =>
                    void updateEconomyItem(item.id, {
                      tokenPrice: Number(event.target.value),
                      dropRate: item.drop_rate,
                      xpBonus: item.xp_bonus,
                      speedBonus: item.speed_bonus
                    }).then(loadItems)
                  }
                  className="mt-1 w-full rounded-md border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-100"
                />
              </label>
              <label className="text-xs font-black uppercase text-stone-500">
                Drop rate
                <input
                  type="number"
                  step="0.01"
                  defaultValue={item.drop_rate}
                  onBlur={(event) =>
                    void updateEconomyItem(item.id, {
                      tokenPrice: item.token_price,
                      dropRate: Number(event.target.value),
                      xpBonus: item.xp_bonus,
                      speedBonus: item.speed_bonus
                    }).then(loadItems)
                  }
                  className="mt-1 w-full rounded-md border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-100"
                />
              </label>
              <label className="text-xs font-black uppercase text-stone-500">
                XP bonus
                <input
                  type="number"
                  step="0.01"
                  defaultValue={item.xp_bonus}
                  onBlur={(event) =>
                    void updateEconomyItem(item.id, {
                      tokenPrice: item.token_price,
                      dropRate: item.drop_rate,
                      xpBonus: Number(event.target.value),
                      speedBonus: item.speed_bonus
                    }).then(loadItems)
                  }
                  className="mt-1 w-full rounded-md border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-100"
                />
              </label>
              <label className="text-xs font-black uppercase text-stone-500">
                Speed bonus
                <input
                  type="number"
                  step="0.01"
                  defaultValue={item.speed_bonus}
                  onBlur={(event) =>
                    void updateEconomyItem(item.id, {
                      tokenPrice: item.token_price,
                      dropRate: item.drop_rate,
                      xpBonus: item.xp_bonus,
                      speedBonus: Number(event.target.value)
                    }).then(loadItems)
                  }
                  className="mt-1 w-full rounded-md border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-100"
                />
              </label>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
