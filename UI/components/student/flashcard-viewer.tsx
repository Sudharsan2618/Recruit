"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, RotateCw, Shuffle, Loader2, Layers, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getFlashcardDeck } from "@/lib/api/courses"
import type { FlashcardOut } from "@/lib/api/types"

interface FlashcardViewerProps {
  deckId: number
  /** Fired once, when the learner has viewed (flipped or passed) every card. */
  onAllViewed?: () => void
}

export function FlashcardViewer({ deckId, onAllViewed }: FlashcardViewerProps) {
  const [cards, setCards] = useState<FlashcardOut[]>([])
  const [deckTitle, setDeckTitle] = useState("")
  const [order, setOrder] = useState<number[]>([])
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [viewed, setViewed] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const allViewedFiredRef = useRef(false)

  // Load the deck + cards
  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    allViewedFiredRef.current = false
    getFlashcardDeck(deckId)
      .then((deck) => {
        if (!active) return
        const sorted = [...(deck.flashcards || [])].sort(
          (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0),
        )
        setCards(sorted)
        setDeckTitle(deck.title || "Key Terms")
        setOrder(sorted.map((_, i) => i))
        setIndex(0)
        setFlipped(false)
        setViewed(new Set(sorted.length ? [0] : []))
      })
      .catch(() => active && setError("Couldn't load these flashcards. Please try again."))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [deckId])

  const total = cards.length
  const currentCard = total ? cards[order[index]] : undefined

  const markViewed = useCallback((pos: number) => {
    setViewed((prev) => {
      if (prev.has(pos)) return prev
      const next = new Set(prev)
      next.add(pos)
      return next
    })
  }, [])

  const goTo = useCallback(
    (nextIndex: number) => {
      if (nextIndex < 0 || nextIndex >= total) return
      setIndex(nextIndex)
      setFlipped(false)
      markViewed(nextIndex)
    },
    [total, markViewed],
  )

  const next = useCallback(() => goTo(index + 1), [goTo, index])
  const prev = useCallback(() => goTo(index - 1), [goTo, index])
  const flip = useCallback(() => setFlipped((f) => !f), [])

  const shuffle = useCallback(() => {
    const shuffled = [...order]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    setOrder(shuffled)
    setIndex(0)
    setFlipped(false)
    markViewed(0)
  }, [order, markViewed])

  const restart = useCallback(() => {
    setIndex(0)
    setFlipped(false)
  }, [])

  // Fire onAllViewed once every card has been seen
  useEffect(() => {
    if (total > 0 && viewed.size >= total && !allViewedFiredRef.current) {
      allViewedFiredRef.current = true
      onAllViewed?.()
    }
  }, [viewed, total, onAllViewed])

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === "INPUT" || tag === "TEXTAREA") return
      if (e.key === "ArrowRight") { e.preventDefault(); next() }
      else if (e.key === "ArrowLeft") { e.preventDefault(); prev() }
      else if (e.key === " " || e.key === "Enter") { e.preventDefault(); flip() }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [next, prev, flip])

  const progressPct = total ? Math.round((viewed.size / total) * 100) : 0
  const allDone = total > 0 && viewed.size >= total

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px] p-8">
        <p className="text-sm text-destructive text-center">{error}</p>
      </div>
    )
  }

  if (!total) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 mb-4">
          <Layers className="h-7 w-7 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">No flashcards have been added to this lesson yet.</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col items-center min-h-[400px] bg-muted/20 px-4 py-8 sm:px-6">
      <div className="w-full max-w-2xl space-y-5">
        {/* Header: title + counter + progress */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 shrink-0">
                <Layers className="h-4 w-4 text-primary" />
              </div>
              <h2 className="truncate text-sm font-bold text-foreground tracking-tight">{deckTitle}</h2>
            </div>
            <span className="text-xs font-semibold text-muted-foreground tabular-nums shrink-0">
              {index + 1} / {total}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Flip card */}
        <div style={{ perspective: "1600px" }} className="w-full">
          <button
            type="button"
            onClick={flip}
            aria-label="Flip card"
            className="relative w-full min-h-[280px] sm:min-h-[340px] text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-2xl"
          >
            <div
              className="relative w-full min-h-[280px] sm:min-h-[340px]"
              style={{
                transformStyle: "preserve-3d",
                transition: "transform 0.5s",
                transform: flipped ? "rotateY(180deg)" : "none",
              }}
            >
              {/* Front — Term */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card p-8 shadow-sm"
                style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Term</span>
                <p className="text-center text-2xl sm:text-3xl font-bold text-foreground leading-snug">
                  {currentCard?.front_content}
                </p>
                <span className="absolute bottom-4 text-[11px] text-muted-foreground">Tap or press Space to flip</span>
              </div>

              {/* Back — Definition */}
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl border border-primary/30 bg-primary/5 p-8 shadow-sm overflow-y-auto"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Definition</span>
                <p className="text-center text-base sm:text-lg font-medium text-foreground/90 leading-relaxed">
                  {currentCard?.back_content}
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-3">
          <Button variant="outline" size="sm" onClick={prev} disabled={index === 0} className="gap-1.5">
            <ChevronLeft className="h-4 w-4" /> Prev
          </Button>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={flip} className="gap-1.5" title="Flip (Space)">
              <RotateCw className="h-4 w-4" /> Flip
            </Button>
            <Button variant="ghost" size="sm" onClick={shuffle} className="gap-1.5" title="Shuffle">
              <Shuffle className="h-4 w-4" /> Shuffle
            </Button>
          </div>

          <Button
            variant={index === total - 1 ? "secondary" : "default"}
            size="sm"
            onClick={next}
            disabled={index === total - 1}
            className="gap-1.5"
          >
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Completion hint */}
        {allDone && (
          <div className="flex items-center justify-center gap-2 rounded-xl border border-success/20 bg-success/5 px-4 py-3">
            <Check className="h-4 w-4 text-success" />
            <span className="text-xs font-semibold text-success">
              You've reviewed every card.
            </span>
            <button onClick={restart} className="text-xs font-semibold text-primary underline underline-offset-2 ml-1">
              Review again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
