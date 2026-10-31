'use client'

import * as React from 'react'
import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import type { Country, Category, Language } from '@/lib/catalog/types'

export interface ChannelFilters {
  search: string
  country: string // '' = all
  category: string
  language: string
  includeNsfw: boolean
}

interface FilterBarProps {
  filters: ChannelFilters
  onChange: (filters: ChannelFilters) => void
  countries: Country[]
  categories: Category[]
  languages: Language[]
  /** Hide the search input (e.g. when used alongside a SearchBar). */
  hideSearch?: boolean
  className?: string
}

const ALL = '__all__'

export function FilterBar({
  filters,
  onChange,
  countries,
  categories,
  languages,
  hideSearch,
  className,
}: FilterBarProps) {
  // Debounce search input 300ms.
  const [searchInput, setSearchInput] = React.useState(filters.search)
  React.useEffect(() => {
    setSearchInput(filters.search)
  }, [filters.search])

  React.useEffect(() => {
    const t = setTimeout(() => {
      if (searchInput !== filters.search) {
        onChange({ ...filters, search: searchInput })
      }
    }, 300)
    return () => clearTimeout(t)
  }, [searchInput, filters, onChange])

  function patch(p: Partial<ChannelFilters>) {
    onChange({ ...filters, ...p })
  }

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-end',
        className,
      )}
      aria-label="Channel filters"
    >
      {!hideSearch && (
        <div className="flex-1 min-w-[200px]">
          <Label htmlFor="filter-search" className="mb-1.5 text-xs">
            Search
          </Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="filter-search"
              type="search"
              placeholder="Search channels…"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-8"
              autoComplete="off"
            />
          </div>
        </div>
      )}

      <div className="min-w-[160px] flex-1">
        <Label htmlFor="filter-country" className="mb-1.5 text-xs">
          Country
        </Label>
        <Select
          value={filters.country || ALL}
          onValueChange={(v) => patch({ country: v === ALL ? '' : v })}
        >
          <SelectTrigger id="filter-country" className="w-full">
            <SelectValue placeholder="All countries" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value={ALL}>All countries</SelectItem>
            {countries.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.name} ({c.code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-[160px] flex-1">
        <Label htmlFor="filter-category" className="mb-1.5 text-xs">
          Category
        </Label>
        <Select
          value={filters.category || ALL}
          onValueChange={(v) => patch({ category: v === ALL ? '' : v })}
        >
          <SelectTrigger id="filter-category" className="w-full">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value={ALL}>All categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="min-w-[160px] flex-1">
        <Label htmlFor="filter-language" className="mb-1.5 text-xs">
          Language
        </Label>
        <Select
          value={filters.language || ALL}
          onValueChange={(v) => patch({ language: v === ALL ? '' : v })}
        >
          <SelectTrigger id="filter-language" className="w-full">
            <SelectValue placeholder="All languages" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value={ALL}>All languages</SelectItem>
            {languages.map((l) => (
              <SelectItem key={l.code} value={l.code}>
                {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 pb-1.5">
        <Switch
          id="filter-nsfw"
          checked={filters.includeNsfw}
          onCheckedChange={(checked) => patch({ includeNsfw: checked })}
          aria-label="Include NSFW channels"
        />
        <Label htmlFor="filter-nsfw" className="text-xs">
          NSFW
        </Label>
      </div>

    </div>
  )
}
