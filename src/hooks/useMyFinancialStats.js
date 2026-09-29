import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useMyFinancialStats({
  user,
  currentPlayer,
  financialStatsEnabled
}) {
  const [financialStats, setFinancialStats] = useState(null);
  const [loadingFinancialStats, setLoadingFinancialStats] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadFinancialStats = async () => {
      if (
        !user?.id ||
        !currentPlayer?.id ||
        financialStatsEnabled !== true
      ) {
        setFinancialStats(null);
        setLoadingFinancialStats(false);
        return;
      }

      setLoadingFinancialStats(true);

      const { data, error } = await supabase.rpc(
        'get_my_financial_stats'
      );

      if (cancelled) {
        return;
      }

      if (error) {
        console.error(
          'Financiële statistieken laden mislukt:',
          error
        );

        setFinancialStats(null);
        setLoadingFinancialStats(false);
        return;
      }

      const stats = Array.isArray(data)
        ? data[0]
        : data;

      if (!stats) {
        setFinancialStats(null);
        setLoadingFinancialStats(false);
        return;
      }

      setFinancialStats({
        totalBuyIn: Number(stats.total_buy_in) || 0,
        totalWinnings: Number(stats.total_winnings) || 0,
        profitLoss: Number(stats.profit_loss) || 0
      });

      setLoadingFinancialStats(false);
    };

    loadFinancialStats();

    return () => {
      cancelled = true;
    };
  }, [
    user?.id,
    currentPlayer?.id,
    financialStatsEnabled
  ]);

  return {
    financialStats,
    loadingFinancialStats
  };
}