"use client"

import { useEffect, useState } from "react"
import { Accessibility, X, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

const STORAGE_KEY = "cesizen-a11y"

type TextSize = "normal" | "large" | "xlarge"

interface A11yPrefs {
  textSize: TextSize
  highContrast: boolean
  underlineLinks: boolean
  reduceMotion: boolean
  dyslexia: boolean
  spacing: boolean
}

const DEFAULT: A11yPrefs = {
  textSize: "normal",
  highContrast: false,
  underlineLinks: false,
  reduceMotion: false,
  dyslexia: false,
  spacing: false,
}

function applyToDom(prefs: A11yPrefs) {
  if (typeof document === "undefined") return
  const html = document.documentElement
  html.classList.remove("a11y-text-large", "a11y-text-xlarge")
  if (prefs.textSize === "large") html.classList.add("a11y-text-large")
  if (prefs.textSize === "xlarge") html.classList.add("a11y-text-xlarge")
  html.classList.toggle("a11y-high-contrast", prefs.highContrast)
  html.classList.toggle("a11y-underline-links", prefs.underlineLinks)
  html.classList.toggle("a11y-reduce-motion", prefs.reduceMotion)
  html.classList.toggle("a11y-dyslexia", prefs.dyslexia)
  html.classList.toggle("a11y-spacing", prefs.spacing)
}

function loadPrefs(): A11yPrefs {
  if (typeof window === "undefined") return DEFAULT
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT
    return { ...DEFAULT, ...JSON.parse(raw) }
  } catch {
    return DEFAULT
  }
}

export function AccessibilityPanel() {
  const [open, setOpen] = useState(false)
  const [prefs, setPrefs] = useState<A11yPrefs>(DEFAULT)

  useEffect(() => {
    const loaded = loadPrefs()
    setPrefs(loaded)
    applyToDom(loaded)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open])

  const update = (patch: Partial<A11yPrefs>) => {
    const next = { ...prefs, ...patch }
    setPrefs(next)
    applyToDom(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  const reset = () => {
    setPrefs(DEFAULT)
    applyToDom(DEFAULT)
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le panneau d'accessibilité"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="a11y-keep-color fixed bottom-4 left-4 z-40 h-12 w-12 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 focus-visible:outline-none flex items-center justify-center"
      >
        <Accessibility className="h-6 w-6" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="a11y-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-background rounded-lg shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 id="a11y-title" className="text-lg font-semibold flex items-center gap-2">
                <Accessibility className="h-5 w-5" aria-hidden="true" />
                Accessibilité
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <p className="text-sm text-muted-foreground">
                Adaptez l'affichage à vos préférences. Vos choix sont conservés localement
                (RGAA / WCAG 2.1).
              </p>

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium mb-1">Taille du texte</legend>
                <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Taille du texte">
                  {(["normal", "large", "xlarge"] as TextSize[]).map((size) => (
                    <button
                      key={size}
                      type="button"
                      role="radio"
                      aria-checked={prefs.textSize === size}
                      onClick={() => update({ textSize: size })}
                      className={`px-3 py-2 rounded-md border text-sm ${
                        prefs.textSize === size
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-input hover:bg-accent"
                      }`}
                    >
                      {size === "normal" ? "A" : size === "large" ? "A+" : "A++"}
                    </button>
                  ))}
                </div>
              </fieldset>

              <Toggle
                label="Contraste élevé"
                description="Noir et jaune pour une meilleure lisibilité"
                checked={prefs.highContrast}
                onChange={(v) => update({ highContrast: v })}
              />
              <Toggle
                label="Souligner tous les liens"
                description="Identification visuelle renforcée (RGAA 10.6)"
                checked={prefs.underlineLinks}
                onChange={(v) => update({ underlineLinks: v })}
              />
              <Toggle
                label="Réduire les animations"
                description="Désactive les transitions et animations"
                checked={prefs.reduceMotion}
                onChange={(v) => update({ reduceMotion: v })}
              />
              <Toggle
                label="Police dyslexie"
                description="Caractères mieux différenciés"
                checked={prefs.dyslexia}
                onChange={(v) => update({ dyslexia: v })}
              />
              <Toggle
                label="Espacement augmenté"
                description="Plus d'espace entre les lettres et les lignes"
                checked={prefs.spacing}
                onChange={(v) => update({ spacing: v })}
              />

              <div className="pt-2 border-t">
                <Button variant="outline" size="sm" onClick={reset} className="w-full">
                  <RotateCcw className="h-4 w-4 mr-2" aria-hidden="true" />
                  Réinitialiser
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Toggle({
  label, description, checked, onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-start justify-between gap-3 cursor-pointer">
      <span className="flex-1">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
          checked ? "bg-primary" : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
          aria-hidden="true"
        />
      </button>
    </label>
  )
}
