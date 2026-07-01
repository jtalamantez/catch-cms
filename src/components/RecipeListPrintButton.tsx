'use client'

import { useListQuery } from '@payloadcms/ui'

export function RecipeListPrintButton() {
  const { query, data } = useListQuery()

  const handlePrint = () => {
    const where = query?.where ?? {}
    const params = new URLSearchParams({ where: JSON.stringify(where) })
    window.open(`/print/recipes?${params.toString()}`, '_blank')
  }

  const count = data?.totalDocs ?? 0

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '8px 0' }}>
      <button
        onClick={handlePrint}
        disabled={count === 0}
        title="Print results"
        style={{
          backgroundColor: '#2e6666',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          padding: '6px 10px',
          lineHeight: 0,
          cursor: count === 0 ? 'not-allowed' : 'pointer',
          opacity: count === 0 ? 0.5 : 1,
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 6 2 18 2 18 9" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <rect x="6" y="14" width="12" height="8" />
        </svg>
      </button>
    </div>
  )
}
