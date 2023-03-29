import { useCallback, useContext } from "react"
import { AppContext } from "src/utils/context"
import { useCustomFetch } from "src/hooks/useCustomFetch"
import { SetTransactionApprovalParams } from "src/utils/types"
import { TransactionPane } from "./TransactionPane"
import { SetTransactionApprovalFunction, TransactionsComponent } from "./types"

export const Transactions: TransactionsComponent = ({ transactions, isLoading }) => {
  const { cache } = useContext(AppContext)
  const { fetchWithoutCache, clearCacheByKey, loading } = useCustomFetch()

  const setTransactionApproval = useCallback<SetTransactionApprovalFunction>(
    async ({ transactionId, newValue }) => {
      await fetchWithoutCache<void, SetTransactionApprovalParams>("setTransactionApproval", {
        transactionId,
        value: newValue,
      })
      cache?.current.forEach((value, key) => {
        if (key !== "employees" && value.includes(transactionId)) {
          clearCacheByKey(key)
        }
      })
    },
    [fetchWithoutCache, clearCacheByKey, cache]
  )

  if (transactions === null || isLoading) {
    return <div className="RampLoading--container">Loading...</div>
  }

  return (
    <div data-testid="transaction-container">
      {transactions.map((transaction) => (
        <TransactionPane
          key={transaction.id}
          transaction={transaction}
          loading={loading}
          setTransactionApproval={setTransactionApproval}
        />
      ))}
    </div>
  )
}
