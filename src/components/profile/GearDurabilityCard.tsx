import { useState } from 'react';
import {
  getSavedGearDurability,
  repairEquipmentItem,
  type EquipmentDurability
} from '../../services/equipmentEconomyService';

export default function GearDurabilityCard() {
  const [gearList, setGearList] = useState<EquipmentDurability[]>(() => getSavedGearDurability());
  const [repairingId, setRepairingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  function handleRepair(gear: EquipmentDurability) {
    if (gear.durability >= 100) return;
    setRepairingId(gear.id);
    setTimeout(() => {
      const { updatedList } = repairEquipmentItem(gear.id);
      setGearList(updatedList);
      setRepairingId(null);
      setNotice(`✨ ${gear.name} 수리 완료! (내구도 100% 회복)`);
      setTimeout(() => setNotice(null), 3000);
    }, 600);
  }

  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm space-y-3 font-sans select-none">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
            <span>👟</span> Equipment Durability (장비 내구도)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">러닝 시 거리에 따라 마모되며 골드로 수리합니다.</p>
        </div>
        <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
          Auto Wear Active
        </span>
      </div>

      {notice && (
        <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold text-center animate-in fade-in">
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {gearList.map((gear) => {
          const isLow = gear.durability <= 30;
          const isFull = gear.durability >= 100;
          return (
            <div
              key={gear.id}
              className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                isLow ? 'bg-rose-50/50 border-rose-200' : 'bg-slate-50/60 border-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-2xl shrink-0">{gear.icon}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-black text-slate-900 truncate">{gear.name}</h4>
                    <span className="text-[9px] font-black uppercase text-violet-600 bg-violet-50 px-1.5 py-0.2 rounded">
                      {gear.rarity}
                    </span>
                  </div>
                  {/* 내구도 바 */}
                  <div className="w-28 sm:w-32 h-2 bg-slate-200 rounded-full overflow-hidden mt-1.5">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isLow
                          ? 'bg-rose-500'
                          : gear.durability <= 70
                          ? 'bg-amber-400'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${gear.durability}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold mt-1">
                    <span>{gear.buff}</span>
                    <span className={`font-black ${isLow ? 'text-rose-600' : 'text-slate-600'}`}>
                      {gear.durability}%
                    </span>
                  </div>
                </div>
              </div>

              {/* 수리 버튼 */}
              <button
                type="button"
                onClick={() => handleRepair(gear)}
                disabled={isFull || repairingId === gear.id}
                className={`px-3 py-2 rounded-xl text-xs font-black shrink-0 transition-all active:scale-95 cursor-pointer shadow-sm ${
                  isFull
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : isLow
                    ? 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-500/20'
                    : 'bg-violet-600 text-white hover:bg-violet-700 shadow-violet-500/20'
                }`}
              >
                {repairingId === gear.id ? '수리 중...' : isFull ? '최상' : `🔧 ${gear.repairCostGold}G`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
