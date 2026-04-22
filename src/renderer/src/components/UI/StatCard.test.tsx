import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StatCard from './StatCard'
import { Wallet } from 'lucide-react'

describe('StatCard', () => {
  it('renders label and value', () => {
    render(React.createElement(StatCard, { label: "Gesamteinnahmen", value: "CHF 1'234.00", icon: Wallet }))
    expect(screen.getByText('Gesamteinnahmen')).toBeInTheDocument()
    expect(screen.getByText("CHF 1'234.00")).toBeInTheDocument()
  })

  it('renders subValue when provided', () => {
    render(
      React.createElement(StatCard, {
        label: "Verein",
        value: "CHF 500.00",
        icon: Wallet,
        subLabel: "Einnahmen",
        subValue: "CHF 800.00"
      })
    )
    expect(screen.getByText('Einnahmen')).toBeInTheDocument()
    expect(screen.getByText('CHF 800.00')).toBeInTheDocument()
  })

  it('does not render sub section when subValue is absent', () => {
    render(React.createElement(StatCard, { label: "Test", value: "CHF 0.00", icon: Wallet }))
    expect(screen.queryByText('Einnahmen')).not.toBeInTheDocument()
  })
})
