import { useEffect, useState } from 'react';
import {
  listEconomySettings,
  listEconomyItems,
  updateEconomySetting,
  updateEconomyItem,
  type AdminEconomySetting,
  type AdminItem
} from './adminService';

const fallbackSettings: AdminEconomySetting[] = [
  {
    id: '',
    setting_key: 'xp_reward_rate',
    setting_value: 1,
    description: 'Global XP reward multiplier',
    updated_by: null,
    updated_at: ''
  },
  {
    id: '',
    setting_key: 'token_reward_multiplier',
    setting_value: 0,
    description: 'Global RunToken reward multiplier',
    updated_by: null,
    updated_at: ''
  }
];

export default function AdminEconomy() {
  const [items, setItems] = useState<AdminItem[]>([]);
  const [settings, setSettings] = useState<AdminEconomySetting[]>(fallbackSettings);
  const [status, setStatus] = useState('Loading economy controls...');
  const [loading, setLoading] = useState(true);

  async function loadEconomy() {
    try {
      const [nextItems, nextSettings] = await Promise.all([
        listEconomyItems(),
        listEconomySettings()
      ]);
      setItems(nextItems ?? []);
      setSettings((nextSettings ?? []).length > 0 ? nextSettings : fallbackSettings);
      setStatus('Economy controls ready.');
    } catch (error) {
      setItems([]);
      setSettings(fallbackSettings);
      setStatus(error instanceof Error ? error.message : 'Could not load economy items.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadEconomy();
  }, []);

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-stone-800 bg-stone-950 p-4">
        <p className="text-xs font-black uppercase text-amber-200">Token economy</p>
        <h2 className="mt-1 text-2xl font-black">Economy Control</h2>
        <p className="mt-2 text-sm text-stone-400">{status}</p>
      </div>

      <div className="grid gap-3">
        {loading && (
          <div className="rounded-lg border border-stone-800 bg-stone-950 p-4 text-sm text-stone-400">
            Loading economy settings...
          </div>
        )}
        <div className="grid gap-3 md:grid-cols-2">
          {settings.map((setting) => (
            <article key={setting.id} className="rounded-lg border border-stone-800 bg-stone-950 p-4">
              <p className="text-xs font-black uppercase text-stone-500">{setting.setting_key}</p>
              <p className="mt-1 text-sm text-stone-400">{setting.description}</p>
              <input
                type="number"
                step="0.01"
                defaultValue={setting.setting_value}
                disabled={!setting.id}
                onBlur={(event) =>
                  setting.id
                    ? void updateEconomySetting(setting.id, Number(event.target.value))
                        .then(loadEconomy)
                        .catch((error) =>
                          setStatus(error instanceof Error ? error.message : 'Could not update setting.')
                        )
                    : undefined
                }
                className="mt-3 w-full rounded-md border border-stone-700 bg-stone-900 px-3 py-2 text-sm text-stone-100 disabled:opacity-60"
              />
            </article>
          ))}
        </div>

        {!loading && items.length === 0 && (
          <div className="rounded-lg border border-stone-800 bg-stone-950 p-4 text-sm text-stone-400">
            No economy items found.
          </div>
        )}

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
                    })
                      .then(loadEconomy)
                      .catch((error) =>
                        setStatus(error instanceof Error ? error.message : 'Could not update economy item.')
                      )
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
                    })
                      .then(loadEconomy)
                      .catch((error) =>
                        setStatus(error instanceof Error ? error.message : 'Could not update economy item.')
                      )
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
                    })
                      .then(loadEconomy)
                      .catch((error) =>
                        setStatus(error instanceof Error ? error.message : 'Could not update economy item.')
                      )
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
                    })
                      .then(loadEconomy)
                      .catch((error) =>
                        setStatus(error instanceof Error ? error.message : 'Could not update economy item.')
                      )
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
